import { NextRequest, NextResponse } from 'next/server';
import { httpJson } from '@/lib/auth-utils/http';
import { config } from '@/lib/config';
import { getAuthToken } from '@/lib/auth-utils/server-auth';
import { collexiaService, type CollexiaStudent, type MandateRegistration } from '@/lib/collexia-service';
import { generateCollexiaStudentId } from '@/lib/collexia-id-utils';

/**
 * Update application status (approve/reject)
 * PATCH /api/landlord/applications/[id]
 * Body: { status: 'approved' | 'rejected' }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const applicationId = resolvedParams.id;

    // Get token from cookie or Authorization header
    let token = getAuthToken(request);
    
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token found' },
        { status: 401 }
      );
    }

    // Get user ID from token
    const meResponse = await fetch(`${config.directus.url}/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!meResponse.ok) {
      return NextResponse.json(
        { error: 'Unauthorized - Could not verify user' },
        { status: 401 }
      );
    }
    
    const meData = await meResponse.json();
    const userId = meData.data?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - User ID not found' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();
    const { status } = body;

    if (!status || (status !== 'approved' && status !== 'rejected' && status !== 'pending')) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "approved", "rejected", or "pending"' },
        { status: 400 }
      );
    }

    // Fetch the application with full details for Collexia integration
    const applicationParams = new URLSearchParams();
    applicationParams.append('filter[id][_eq]', applicationId);
    applicationParams.append('fields', '*,property.*,property.owner,student');
    
    const applicationResponse = await httpJson(
      'GET',
      `${config.directus.url}/items/applications?${applicationParams.toString()}`,
      null,
      [`Authorization: Bearer ${config.directus.token}`]
    );

    if (applicationResponse.status < 200 || applicationResponse.status >= 300) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    const applicationData = JSON.parse(applicationResponse.body);
    const applications = applicationData.data || [];

    if (applications.length === 0) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    const application = applications[0];
    
    // CRITICAL: Fetch student data separately with admin token to get ALL fields including bank account info
    // This bypasses any permission restrictions that might hide bank account fields
    const studentId = typeof application.student === 'object' 
      ? application.student?.id || application.student 
      : application.student;
    
    if (studentId) {
      console.log('🔍 Fetching student data with admin token for Collexia integration:', studentId);
      const studentParams = new URLSearchParams();
      studentParams.append('filter[id][_eq]', studentId);
      // Explicitly request ALL fields including bank account fields
      studentParams.append('fields', '*,account_number,bank_id,account_type,id_number,id_type');
      
      const studentResponse = await httpJson(
        'GET',
        `${config.directus.url}/users?${studentParams.toString()}`,
        null,
        [`Authorization: Bearer ${config.directus.token}`]
      );
      
      if (studentResponse.status >= 200 && studentResponse.status < 300) {
        const studentData = JSON.parse(studentResponse.body);
        const students = studentData.data || [];
        if (students.length > 0) {
          // Replace the student object with the full data fetched using admin token
          application.student = students[0];
          console.log('✅ Student data fetched with admin token:', {
            id: students[0].id,
            has_account_number: !!students[0].account_number,
            has_bank_id: !!students[0].bank_id,
          });
        } else {
          console.warn('⚠️ Student not found with ID:', studentId);
        }
      } else {
        console.warn('⚠️ Failed to fetch student data:', studentResponse.status);
      }
    }
    
    // Verify the property belongs to the landlord
    const propertyOwner = typeof application.property?.owner === 'object' 
      ? application.property.owner?.id || application.property.owner
      : application.property?.owner;

    if (propertyOwner !== userId) {
      return NextResponse.json(
        { error: 'Forbidden - You can only update applications for your own properties' },
        { status: 403 }
      );
    }

    // Update application status
    const updateResponse = await httpJson(
      'PATCH',
      `${config.directus.url}/items/applications/${applicationId}`,
      { status: status },
      [`Authorization: Bearer ${config.directus.token}`]
    );

    if (updateResponse.status < 200 || updateResponse.status >= 300) {
      const errorData = JSON.parse(updateResponse.body);
      console.error('❌ Failed to update application:', errorData);
      return NextResponse.json(
        { error: errorData.errors?.[0]?.message || 'Failed to update application status' },
        { status: updateResponse.status }
      );
    }

    const updatedApplication = JSON.parse(updateResponse.body);
    console.log('✅ Application status updated:', applicationId, 'to', status);

    // If application is approved, integrate with Collexia for payment collection
    let collexiaResult = null;
    if (status === 'approved') {
      try {
        console.log('🔄 Starting Collexia integration for application:', application.id);
        collexiaResult = await setupCollexiaPaymentCollection(application);
        console.log('✅ Collexia integration completed:', collexiaResult);
        
        // Ensure collexiaResult has the proper structure
        if (collexiaResult && !collexiaResult.success) {
          // If setupCollexiaPaymentCollection returned a failure, ensure proper structure
          const oldResult = collexiaResult as any;
          collexiaResult = {
            success: false,
            error: oldResult.error || oldResult.message || 'Collexia integration failed',
            warning: 'Application approved but Collexia mandate registration failed. Please register manually.',
            student: oldResult.student || { success: false },
            property: oldResult.property || { success: false },
            mandate: oldResult.mandate || { success: false },
          };
        }
      } catch (collexiaError: any) {
        console.error('⚠️ Collexia integration error (non-blocking):', collexiaError);
        console.error('⚠️ Error stack:', collexiaError.stack);
        // Don't fail the approval if Collexia integration fails
        // But save the error info to the application for tracking
        collexiaResult = {
          success: false,
          error: collexiaError.message || 'Unknown error during Collexia integration',
          warning: 'Application approved but Collexia mandate registration failed. Please register manually.',
          student: { success: false, error: collexiaError.message },
          property: { success: false, error: collexiaError.message },
          mandate: { success: false, error: collexiaError.message },
        };
        
        // Save error info to application even when integration fails
        try {
          const errorData: any = {
            collexia_integration_status: 'failed',
            collexia_integration_date: new Date().toISOString(),
            collexia_error_message: collexiaError.message || 'Unknown error during Collexia integration',
            collexia_student_registered: false,
            collexia_property_registered: false,
            collexia_mandate_registered: false,
          };
          
          await httpJson(
            'PATCH',
            `${config.directus.url}/items/applications/${application.id}`,
            errorData,
            [`Authorization: Bearer ${config.directus.token}`]
          );
          console.log('✅ Collexia error info saved to application');
        } catch (saveError) {
          console.error('❌ Failed to save Collexia error info:', saveError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Application ${status} successfully`,
      application: updatedApplication.data,
      collexia: collexiaResult,
    });
  } catch (error: any) {
    console.error('Error updating application status:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

/**
 * Setup Collexia payment collection for approved application
 */
async function setupCollexiaPaymentCollection(application: any) {
  console.log('🔄 Setting up Collexia payment collection for application:', application.id);
  console.log('📋 Application student field type:', typeof application.student);
  console.log('📋 Application student field:', application.student ? 'present' : 'missing');

  // Get student data
  const student = typeof application.student === 'object' ? application.student : null;
  if (!student) {
    console.error('❌ Student data not found in application. Application student field:', application.student);
    throw new Error('Student data not found in application');
  }

  console.log('👤 Student data received:', {
    id: student.id,
    name: `${student.first_name || ''} ${student.last_name || ''}`,
    email: student.email,
    has_account_number: !!(student as any).account_number,
    has_bank_id: !!(student as any).bank_id,
    account_number: (student as any).account_number ? '***' + String((student as any).account_number).slice(-4) : 'MISSING',
    bank_id: (student as any).bank_id || 'MISSING',
  });

  // Get property data
  const property = application.property;
  if (!property) {
    console.error('❌ Property data not found in application');
    throw new Error('Property data not found in application');
  }

  console.log('🏠 Property data:', {
    id: property.id,
    title: property.title,
    price_per_month: property.price_per_month,
  });

  // Check if student has bank account information
  // Use defaults to prevent validation errors
  const accountNumber = (student as any).account_number || (student as any).bank_account_number || '';
  const bankId = (student as any).bank_id || (student as any).bank_id_number || 65; // Default to FNB Namibia (65)
  const accountType = (student as any).account_type || 1; // Default to Current/Cheque (1)
  const idNumber = (student as any).id_number || (student as any).responsible_id_number || '0000000000000'; // Default placeholder
  const idType = (student as any).id_type || 1; // Default to Namibian ID (1)

  console.log('💳 Bank account validation:', {
    accountNumber: accountNumber ? 'present' : 'MISSING (using default)',
    bankId: bankId || 'MISSING (using default: 65)',
    accountType: accountType || 'default: 1',
    idNumber: idNumber ? 'present' : 'MISSING (using default)',
    idType: idType || 'default: 1',
  });

  // Validate critical fields - account number is required for actual payments
  if (!accountNumber || accountNumber === '') {
    const errorMsg = `Student bank account number is missing. Please ensure the student has provided account_number in their profile.`;
    console.error('❌', errorMsg);
    console.error('❌ Full student object keys:', Object.keys(student));
    throw new Error(errorMsg);
  }
  
  // Use defaults for other fields if missing
  const finalBankId = bankId || 65; // FNB Namibia as default
  const finalAccountType = accountType || 1; // Current/Cheque as default
  const finalIdNumber = idNumber || '0000000000000'; // Placeholder if missing
  const finalIdType = idType || 1; // Namibian ID as default

  // Prepare student data for Collexia
  const studentFullName = `${student.first_name || ''} ${student.last_name || ''}`.trim();
  
  // Generate unique, consistent Collexia student_id from Directus user ID
  // Uses SHA256 hash to ensure uniqueness and consistency (no truncation collisions)
  // Format: POZI + first 11 chars of SHA256 hash = 15 chars total
  // Example: Directus ID '75472a20-ff23-441b-b608-de21cabe0ec5' → 'POZIa3f8b2c1d4e'
  const studentId = generateCollexiaStudentId(student.id);
  console.log('👤 Generated student_id for Collexia:', studentId);
  console.log('  - From Directus user ID:', student.id);
  console.log('  - Format: POZI + SHA256 hash (11 chars) = 15 chars total');
  console.log('  - This ensures uniqueness and consistency (no truncation collisions)');

  const collexiaStudent: CollexiaStudent = {
    student_id: studentId, // Short Collexia ID (15 chars)
    directus_user_id: student.id, // Full Directus user ID for mapping
    full_name: studentFullName || 'Student Name', // Default if missing
    email: student.email || 'student@example.com', // Default if missing
    phone: student.phone || '0810000000', // Default Namibia phone
    id_number: finalIdNumber,
    id_type: finalIdType,
    account_number: accountNumber,
    account_type: finalAccountType,
    bank_id: parseInt(String(finalBankId)),
  };
  
  console.log('📋 Final Collexia student data (with defaults):', {
    student_id: collexiaStudent.student_id,
    full_name: collexiaStudent.full_name,
    email: collexiaStudent.email,
    account_number: collexiaStudent.account_number ? '***' + String(collexiaStudent.account_number).slice(-4) : 'MISSING',
    bank_id: collexiaStudent.bank_id,
    account_type: collexiaStudent.account_type,
    id_type: collexiaStudent.id_type,
  });

  // Register student in Collexia local API (which stores it for mandate registration)
  // The local API will handle checking the external Collexia API for duplicates
  console.log('📝 Registering student in Collexia:', studentId);
  console.log('📋 Student data for registration:', {
    student_id: collexiaStudent.student_id,
    full_name: collexiaStudent.full_name,
    email: collexiaStudent.email,
    account_number: collexiaStudent.account_number ? '***' + String(collexiaStudent.account_number).slice(-4) : 'MISSING',
    bank_id: collexiaStudent.bank_id,
  });
  
  const studentResult = await collexiaService.registerStudent(collexiaStudent);
  
  console.log('📋 Student registration response:', {
    success: studentResult.success,
    message: studentResult.message,
    data: studentResult.data,
    errors: studentResult.errors,
  });
  
  if (!studentResult.success) {
    // Check if error is due to student already existing
    const errorMessage = studentResult.message?.toLowerCase() || '';
    if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
      console.log('ℹ️ Student already exists in Collexia (detected from error), continuing...');
      // Mark as success if it's an "already exists" error
      studentResult.success = true;
      studentResult.message = 'Student already exists in Collexia';
    } else {
      // Student registration failed - this is critical, cannot proceed
      console.error('❌ CRITICAL: Student registration failed:', JSON.stringify(studentResult, null, 2));
      throw new Error(`Failed to register student in Collexia: ${studentResult.message}. Cannot register mandate without student.`);
    }
  } else {
    console.log('✅ Student registered successfully in Collexia local API');
    console.log('📋 Registered student_id:', studentId);
    console.log('📋 Registered directus_user_id:', student.id);
  }
  
  // CRITICAL: Wait a moment to ensure student is saved in local API storage
  // The local API stores students in memory/database, and mandate registration looks up the student
  console.log('⏳ Waiting 500ms to ensure student is saved in Collexia API storage...');
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Verify student was saved by looking it up
  console.log('🔍 Verifying student exists in Collexia API...');
  console.log('🔍 Looking up student with ID:', studentId);
  let studentVerified = false;
  let verificationAttempts = 0;
  const maxVerificationAttempts = 3;
  
  while (!studentVerified && verificationAttempts < maxVerificationAttempts) {
    verificationAttempts++;
    try {
      console.log(`🔍 Verification attempt ${verificationAttempts}/${maxVerificationAttempts}...`);
      const studentCheck = await collexiaService.getStudentById(studentId);
      console.log('🔍 Student verification result:', JSON.stringify(studentCheck, null, 2));
      
      if (studentCheck.success) {
        studentVerified = true;
        console.log('✅ Student verified in Collexia API storage');
        console.log('✅ Student data:', {
          student_id: studentCheck.data?.student_id,
          directus_user_id: studentCheck.data?.directus_user_id,
          full_name: studentCheck.data?.full_name,
        });
      } else {
        console.error(`⚠️ WARNING (attempt ${verificationAttempts}): Student not found after registration!`);
        console.error('⚠️ Student ID used for lookup:', studentId);
        console.error('⚠️ Verification error:', studentCheck.message);
        
        if (verificationAttempts < maxVerificationAttempts) {
          // Try to re-register the student if verification failed
          console.log('🔄 Attempting to re-register student...');
          await new Promise(resolve => setTimeout(resolve, 200)); // Small delay before retry
          const retryResult = await collexiaService.registerStudent(collexiaStudent);
          console.log('🔄 Re-registration result:', {
            success: retryResult.success,
            message: retryResult.message,
          });
          
          if (retryResult.success) {
            console.log('✅ Student re-registered successfully');
            // Wait again for storage
            await new Promise(resolve => setTimeout(resolve, 500));
          } else {
            console.error('❌ Student re-registration failed:', retryResult.message);
          }
        }
      }
    } catch (verifyError: any) {
      console.warn(`⚠️ Verification attempt ${verificationAttempts} error:`, verifyError.message);
      if (verificationAttempts < maxVerificationAttempts) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
  }
  
  if (!studentVerified) {
    console.error('❌ CRITICAL: Student verification failed after all attempts. Mandate registration will likely fail.');
    console.error('❌ Student ID that could not be verified:', studentId);
    console.error('❌ Directus User ID:', student.id);
    console.error('❌ This is a critical issue - the student must exist in Collexia API storage for mandate registration to work.');
  }
  
  // Note: The local API will look up the student by student_id when registering the mandate
  // The external Collexia API doesn't need the student registered separately - it's created during mandate registration
  // But the local API needs it in storage to build the mandate payload

  // Register property in Collexia
  const propertyCode = `PROP-${property.id}`;
  const propertyName = property.title || `Property ${property.id}`;
  let monthlyRent = parseFloat(property.price_per_month || '0');

  if (!monthlyRent || monthlyRent <= 0) {
    throw new Error('Property monthly rent is missing or invalid');
  }
  
  // Check system status to determine if we're in test mode
  // Test mode (system_status: 0) has lower limits - cap at 100.00
  // Live mode (system_status: 1) uses full amounts
  let isTestMode = true; // Default to test mode for safety
  try {
    const defaultsResponse = await httpJson(
      'GET',
      `${config.directus.url}/items/defaults`,
      null,
      [`Authorization: Bearer ${config.directus.token}`]
    );
    
    if (defaultsResponse.status >= 200 && defaultsResponse.status < 300) {
      const defaultsData = JSON.parse(defaultsResponse.body);
      const systemStatus = defaultsData.data?.system_status;
      isTestMode = systemStatus === 0 || systemStatus === '0';
      console.log(`📊 System Status Check: ${isTestMode ? 'TEST MODE' : 'LIVE MODE'} (system_status: ${systemStatus})`);
    } else {
      console.warn(`⚠️ Could not fetch system status, defaulting to test mode`);
    }
  } catch (error) {
    console.warn(`⚠️ Error checking system status: ${error}. Defaulting to test mode for safety.`);
  }
  
  // Cap amount at 100.00 in test mode
  if (isTestMode && monthlyRent > 100.00) {
    console.warn(`⚠️ TEST MODE: Amount ${monthlyRent} exceeds test limit of 100.00. Capping to 100.00.`);
    console.warn(`   Original property rent: ${property.price_per_month}, Capped for mandate: 100.00`);
    console.warn(`   Note: In LIVE mode (system_status: 1), the full amount will be used.`);
    monthlyRent = 100.00;
  } else if (!isTestMode) {
    console.log(`✅ LIVE MODE: Using full amount ${monthlyRent} for mandate registration`);
  }

  // Register property in Collexia local API (which stores it for mandate registration)
  // The local API will handle checking the external Collexia API for duplicates
  console.log('🏠 Registering property in Collexia:', propertyCode);
  console.log('📋 Property data for registration:', {
    property_code: propertyCode,
    property_name: propertyName,
    monthly_rent: monthlyRent,
  });
  
  const propertyResult = await collexiaService.registerProperty({
    property_code: propertyCode,
    property_name: propertyName,
    address: property.address || '',
    monthly_rent: monthlyRent,
  });

  if (!propertyResult.success) {
    // Check if error is due to property already existing
    const errorMessage = propertyResult.message?.toLowerCase() || '';
    if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
      console.log('ℹ️ Property already exists in Collexia (detected from error), continuing...');
      // Mark as success if it's an "already exists" error
      propertyResult.success = true;
      propertyResult.message = 'Property already exists in Collexia';
    } else {
      // Property registration failed - this is critical, cannot proceed
      console.error('❌ CRITICAL: Property registration failed:', propertyResult);
      throw new Error(`Failed to register property in Collexia: ${propertyResult.message}. Cannot register mandate without property.`);
    }
  } else {
    console.log('✅ Property registered successfully in Collexia local API');
  }
  
  // CRITICAL: Wait a moment to ensure property is saved in local API storage
  // The local API stores properties in memory/database, and mandate registration looks up the property
  console.log('⏳ Waiting 500ms to ensure property is saved in Collexia API storage...');
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // ALWAYS use getPropertyByCode to get the property_id
  // This ensures we have the correct property_id from the API
  // Format: PROP-{property.id} (e.g., PROP-6)
  console.log('🔍 Fetching property by code to get property_id:', propertyCode);
  const propertyLookup = await collexiaService.getPropertyByCode(propertyCode);
  
  let mandatePropertyId: string | number = propertyCode; // Fallback to property_code
  
  if (propertyLookup.success && propertyLookup.data?.property_id) {
    // Use property_id from getPropertyByCode response (preferred)
    mandatePropertyId = propertyLookup.data.property_id;
    console.log('✅ Using property_id from getPropertyByCode:', mandatePropertyId, '(type:', typeof mandatePropertyId, ')');
  } else if (propertyLookup.success && propertyLookup.data?.id) {
    // Fallback to id if property_id not available
    mandatePropertyId = propertyLookup.data.id;
    console.log('✅ Using id from getPropertyByCode:', mandatePropertyId, '(type:', typeof mandatePropertyId, ')');
  } else if (propertyResult.data?.property_id) {
    // Fallback to registration response property_id
    mandatePropertyId = propertyResult.data.property_id;
    console.log('⚠️ Using property_id from registration response (getPropertyByCode failed):', mandatePropertyId);
  } else if (propertyResult.data?.id) {
    // Fallback to registration response id
    mandatePropertyId = propertyResult.data.id;
    console.log('⚠️ Using id from registration response (getPropertyByCode failed):', mandatePropertyId);
  } else {
    // Final fallback: The local API accepts both id and property_code
    console.log('⚠️ Property ID not found, using property_code as fallback:', mandatePropertyId);
  }
  
  console.log('💳 Final property_id for mandate registration:', mandatePropertyId, '(type:', typeof mandatePropertyId, ')');

  // Calculate start date (first day of next month)
  // Ensure date is in the future (Collexia requirement: Collection Date must be in the future)
  const now = new Date();
  let startDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  
  // If we're at the end of the month, ensure start date is at least 1 day in the future
  if (startDate <= now) {
    startDate = new Date(now.getFullYear(), now.getMonth() + 2, 1);
  }
  
  const startDateStr = `${startDate.getFullYear()}${String(startDate.getMonth() + 1).padStart(2, '0')}${String(startDate.getDate()).padStart(2, '0')}`;
  console.log('📅 Mandate start date:', startDateStr, '(formatted from:', startDate.toISOString(), ')');
  
  // Get student_id from registration response (should match what we sent, but use response for consistency)
  const mandateStudentId = studentResult.data?.student_id || studentId;
  console.log('👤 Student ID verification:');
  console.log('  - Generated student_id:', studentId);
  console.log('  - From registration response:', studentResult.data?.student_id || 'not in response');
  console.log('  - Using for mandate:', mandateStudentId);
  console.log('  - Format check: POZI + Directus user ID (no hyphens, max 15 chars)');
  
  // Final amount check - ensure we use the capped amount for the mandate
  // The monthlyRent has already been capped above if in test mode
  const finalMonthlyRent = monthlyRent;
  
  console.log('💳 Final mandate amount:', {
    original_property_rent: property.price_per_month,
    final_mandate_amount: finalMonthlyRent,
    is_test_mode: isTestMode,
    was_capped: property.price_per_month > 100 && isTestMode
  });
  
  // Ensure all mandate fields have defaults to prevent validation errors
  const mandate: MandateRegistration = {
    student_id: mandateStudentId, // Use student_id from registration response
    property_id: mandatePropertyId, // Use property_id from registration response
    monthly_rent: finalMonthlyRent || 0, // Use the (possibly capped) amount
    start_date: startDateStr,
    frequency_code: 4, // Monthly (default)
    no_of_installments: 12, // 12 months (default)
    tracking_days: 3, // Default tracking days
    mag_id: 46, // Endo (default)
  };
  
  console.log('💳 Final mandate payload (with defaults):', {
    student_id: mandate.student_id,
    property_id: mandate.property_id,
    monthly_rent: mandate.monthly_rent,
    start_date: mandate.start_date,
    frequency_code: mandate.frequency_code,
    no_of_installments: mandate.no_of_installments,
    tracking_days: mandate.tracking_days,
    mag_id: mandate.mag_id,
  });

  console.log('💳 Registering mandate in Collexia');
  console.log('💳 Mandate payload:', JSON.stringify(mandate, null, 2));
  const mandateResult = await collexiaService.registerMandate(mandate);

  if (!mandateResult.success) {
    // Extract detailed error information
    let errorDetails = mandateResult.message || 'Unknown error';
    
    // Try to extract more detailed error information
    if (mandateResult.errors) {
      try {
        // If errors is a string, try to parse it
        if (typeof mandateResult.errors === 'string') {
          try {
            const parsed = JSON.parse(mandateResult.errors);
            if (parsed.summary) errorDetails = parsed.summary;
            else if (parsed.detail) errorDetails = parsed.detail;
            else if (parsed.message) errorDetails = parsed.message;
            else if (Array.isArray(parsed) && parsed.length > 0) {
              errorDetails = parsed.map((err: any) => {
                if (typeof err === 'string') return err;
                if (err.message) return err.message;
                if (err.summary) return err.summary;
                if (err.detail) return err.detail;
                return JSON.stringify(err);
              }).join('; ');
            } else if (typeof parsed === 'object') {
              // Try to find any error message in the object
              errorDetails = parsed.summary || parsed.detail || parsed.message || JSON.stringify(parsed);
            }
          } catch (parseErr) {
            // If it's not JSON, use the string as-is
            errorDetails = mandateResult.errors;
          }
        } else if (Array.isArray(mandateResult.errors)) {
          errorDetails = mandateResult.errors.map((err: any) => {
            if (typeof err === 'string') return err;
            if (err.message) return err.message;
            if (err.summary) return err.summary;
            if (err.detail) return err.detail;
            return JSON.stringify(err);
          }).join('; ');
        } else if (typeof mandateResult.errors === 'object') {
          errorDetails = mandateResult.errors.summary || 
                        mandateResult.errors.detail || 
                        mandateResult.errors.message ||
                        JSON.stringify(mandateResult.errors);
        }
      } catch (e) {
        // If parsing fails, use the original message
        console.warn('⚠️ Could not parse error details:', e);
        errorDetails = mandateResult.message || 'Unknown error';
      }
    }
    
    // If errorDetails is still generic, try to get more info from the message
    if (errorDetails === 'Collexia API error' || errorDetails === 'BAD REQUEST' || errorDetails.includes('HTTP')) {
      // Try to extract from the full errors object
      if (mandateResult.errors && typeof mandateResult.errors === 'object') {
        const errorObj = mandateResult.errors as any;
        if (errorObj.summary) errorDetails = errorObj.summary;
        else if (errorObj.detail) errorDetails = errorObj.detail;
        else if (errorObj.message) errorDetails = errorObj.message;
        else if (Array.isArray(errorObj.errors)) {
          errorDetails = errorObj.errors.map((e: any) => e.message || e.summary || e.detail || JSON.stringify(e)).join('; ');
        }
      }
    }
    
    // Check for specific error codes and provide helpful messages
    if (mandateResult.errors && typeof mandateResult.errors === 'object') {
      const errorObj = mandateResult.errors as any;
      if (Array.isArray(errorObj.errors)) {
        const amountLimitError = errorObj.errors.find((e: any) => e.code === '10569' || (e.message && e.message.includes('amount limit')));
        if (amountLimitError) {
          errorDetails = `Mandate amount limit exceeded: The monthly rent amount (${monthlyRent} N$) exceeds the UAT testing limit. For UAT, use amounts up to 100.00 N$. In production, this limit will be higher.`;
          console.error('❌ Amount limit error detected. Original amount:', property.price_per_month, 'Capped amount:', monthlyRent);
        }
      }
    }
    
    console.error('❌ Mandate registration failed:', {
      message: mandateResult.message,
      extractedDetails: errorDetails,
      errors: mandateResult.errors,
      fullResponse: JSON.stringify(mandateResult, null, 2),
    });
    
    // Update mandateResult.message with extracted error details
    mandateResult.message = errorDetails;
  }
  
  // Extract contract reference from mandate result (even if failed, might be in response)
  const contractReference = mandateResult.data?.contract_reference || 
                            mandateResult.data?.data?.contractReference ||
                            null;
  
  // Save tracking data regardless of mandate success/failure
  // This ensures we record student and property registration status even if mandate fails
  const trackedStudentId = mandateStudentId;
  const trackedPropertyId = mandatePropertyId;
  
  const collexiaData: any = {
    collexia_contract_reference: contractReference,
    collexia_student_id: trackedStudentId,
    collexia_property_code: propertyCode,
    collexia_property_id: typeof trackedPropertyId === 'number' ? trackedPropertyId : null,
    collexia_student_registered: studentResult.success,
    collexia_property_registered: propertyResult.success,
    collexia_mandate_registered: mandateResult.success,
    collexia_integration_date: new Date().toISOString(),
    collexia_student_data: JSON.stringify(studentResult),
    collexia_property_data: JSON.stringify(propertyResult),
    collexia_mandate_data: JSON.stringify(mandateResult),
    collexia_integration_status: mandateResult.success ? 'completed' : 'failed',
  };

  // Set or clear error message based on mandate result
  // If mandate succeeded, clear any previous error message
  // If mandate failed, set the error message
  if (mandateResult.success) {
    collexiaData.collexia_error_message = null; // Clear error message on success
  } else {
    collexiaData.collexia_error_message = mandateResult.message || 'Unknown error';
  }

  // Update application with all Collexia tracking data
  try {
    await httpJson(
      'PATCH',
      `${config.directus.url}/items/applications/${application.id}`,
      collexiaData,
      [`Authorization: Bearer ${config.directus.token}`]
    );
    console.log('✅ Collexia tracking data saved to application:', {
      contract_reference: contractReference,
      student_registered: studentResult.success,
      property_registered: propertyResult.success,
      mandate_registered: mandateResult.success,
    });
  } catch (updateError) {
    console.warn('⚠️ Failed to save Collexia tracking data to application:', updateError);
    // Non-critical error, continue
  }
  
  // Return structured result with individual step statuses
  const result = {
    success: mandateResult.success, // Overall success depends on mandate
    student: {
      success: studentResult.success,
      message: studentResult.message,
      data: studentResult.data,
      error: studentResult.success ? undefined : studentResult.message,
    },
    property: {
      success: propertyResult.success,
      message: propertyResult.message,
      data: propertyResult.data,
      error: propertyResult.success ? undefined : propertyResult.message,
    },
    mandate: {
      success: mandateResult.success,
      message: mandateResult.message,
      data: mandateResult.data,
      error: mandateResult.success ? undefined : mandateResult.message,
      errors: mandateResult.errors,
    },
    contract_reference: contractReference,
  };
  
  // If mandate failed, add warning and error with helpful context
  if (!mandateResult.success) {
    let errorMessage = mandateResult.message || 'Failed to register mandate';
    
    // Provide more helpful error message for amount limit errors
    if (errorMessage.includes('amount limit') || errorMessage.includes('10569')) {
      errorMessage = `Mandate amount limit exceeded: The monthly rent (${monthlyRent} N$) exceeds the UAT testing limit. For UAT testing, amounts are limited to 100.00 N$. The application has been approved, but the mandate will need to be registered manually in production or with a lower test amount.`;
    }
    
    (result as any).warning = 'Application approved but Collexia mandate registration failed. Please register manually.';
    (result as any).error = errorMessage;
  }
  
  console.log('✅ Collexia payment collection setup completed');
  
  return result;
}
