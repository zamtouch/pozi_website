import { NextRequest, NextResponse } from 'next/server';
import { httpJson } from '@/lib/auth-utils/http';
import { config } from '@/lib/config';
import { getAuthToken } from '@/lib/auth-utils/server-auth';
import { calculateProfileCompletion } from '@/lib/profile-completion';

/**
 * Create a new application
 * POST /api/applications
 * Body: { property_id, message, signed_lease_agreement, pay_slip, bank_statement }
 */
export async function POST(request: NextRequest) {
  try {
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

    // Verify user is a student
    // Strategy: Get user ID from /users/me, then query with admin token to get role
    console.log('🔍 Step 1: Getting user ID from /users/me for application...');
    const meResponse = await fetch(`${config.directus.url}/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!meResponse.ok) {
      const errorText = await meResponse.text();
      console.error('❌ /users/me failed:', meResponse.status, errorText.substring(0, 200));
      return NextResponse.json(
        { error: 'Unauthorized - Could not verify user' },
        { status: 401 }
      );
    }
    
    const meData = await meResponse.json();
    const userId = meData.data?.id;
    
    if (!userId) {
      console.error('❌ No user ID returned from /users/me');
      return NextResponse.json(
        { error: 'Unauthorized - User ID not found' },
        { status: 401 }
      );
    }
    
    console.log('✅ Got user ID:', userId);
    
    // Query user with admin token to get role information
    console.log('🔍 Step 2: Querying user with admin token to get role...');
    const userByIdParams = new URLSearchParams();
    userByIdParams.append('filter[id][_eq]', userId);
    userByIdParams.append('fields', 'id,email,first_name,last_name,status,role.id,role.name,role');
    userByIdParams.append('limit', '1');
    
    const userResponse = await httpJson(
      'GET',
      `${config.directus.url}/users?${userByIdParams.toString()}`,
      null,
      [`Authorization: Bearer ${config.directus.token}`] // Use admin token to get role info
    );

    if (userResponse.status < 200 || userResponse.status >= 300) {
      const errorText = userResponse.body;
      console.error('❌ Failed to query user with admin token:', {
        status: userResponse.status,
        error: errorText.substring(0, 500),
      });
      return NextResponse.json(
        { error: 'Unauthorized - Could not verify user role' },
        { status: 401 }
      );
    }

    const userData = JSON.parse(userResponse.body);
    const users = userData.data || [];
    
    if (users.length === 0) {
      console.error('❌ No user found with ID:', userId);
      return NextResponse.json(
        { error: 'Unauthorized - User not found' },
        { status: 401 }
      );
    }

    const user = users[0];
    
    // Extract role information
    let userRoleId = '';
    let userRoleName = '';
    
    if (user.role) {
      if (typeof user.role === 'string') {
        userRoleId = user.role;
      } else if (typeof user.role === 'object') {
        userRoleId = user.role.id || '';
        userRoleName = user.role.name || '';
      }
    }
    
    const normalizedRole = typeof userRoleName === 'string' ? userRoleName.toLowerCase().trim() : '';

    // Check if user is a student by role ID or role name
    const isStudentById = config.roles.student && userRoleId === config.roles.student;
    const isStudentByName = normalizedRole.includes('student');

    if (!isStudentById && !isStudentByName) {
      return NextResponse.json(
        { error: 'Forbidden - Only students can apply for properties' },
        { status: 403 }
      );
    }

    // Check profile completion - fetch full user data including file fields and bank account info
    const userFullParams = new URLSearchParams();
    userFullParams.append('filter[id][_eq]', userId);
    userFullParams.append('fields', 'id,email,first_name,last_name,phone,status,role.id,role.name,role,responsible_first_name,responsible_last_name,responsible_relationship,responsible_email,responsible_id_number,responsible_cell,responsible_occupation,id_certified_copy,payslip,bank_statement_6months,account_number,bank_id,account_type,id_number,id_type');
    userFullParams.append('limit', '1');
    
    const userFullResponse = await httpJson(
      'GET',
      `${config.directus.url}/users?${userFullParams.toString()}`,
      null,
      [`Authorization: Bearer ${config.directus.token}`]
    );

    if (userFullResponse.status >= 200 && userFullResponse.status < 300) {
      const userFullData = JSON.parse(userFullResponse.body);
      const fullUser = userFullData.data?.[0];
      
      if (fullUser) {
        // Get role name if needed (for proper student detection)
        let roleName = '';
        if (typeof fullUser.role === 'object' && fullUser.role?.name) {
          roleName = fullUser.role.name;
        } else if (typeof fullUser.role === 'string') {
          // Role is UUID, fetch with admin token
          try {
            const roleResponse = await fetch(`${config.directus.url}/roles/${fullUser.role}?fields=id,name`, {
              headers: {
                'Authorization': `Bearer ${config.directus.token}`,
              },
            });
            if (roleResponse.ok) {
              const roleData = await roleResponse.json();
              roleName = roleData.data?.name || '';
              fullUser.role = roleData.data;
            }
          } catch (err) {
            console.error('Error fetching role:', err);
          }
        }
        
        console.log('🔍 Application submission - Profile check:', {
          account_number: fullUser.account_number,
          bank_id: fullUser.bank_id,
          has_account_number: !!fullUser.account_number,
          has_bank_id: !!fullUser.bank_id,
          roleName,
        });
        
        const completion = calculateProfileCompletion(fullUser);
        
        // Safety check: If student and bank fields are missing, force incomplete
        const normalizedRole = roleName?.toLowerCase() || '';
        const isStudent = normalizedRole.includes('student');
        
        if (isStudent) {
          const hasAccountNumber = fullUser.account_number && String(fullUser.account_number).trim().length > 0;
          const hasBankId = fullUser.bank_id !== null && fullUser.bank_id !== undefined && !isNaN(Number(fullUser.bank_id)) && Number(fullUser.bank_id) > 0;
          
          if (!hasAccountNumber || !hasBankId) {
            console.log('❌ Application blocked: Bank fields missing', {
              hasAccountNumber,
              hasBankId,
              account_number: fullUser.account_number,
              bank_id: fullUser.bank_id,
            });
            
            // Force incomplete status
            completion.isComplete = false;
            if (!hasAccountNumber && !completion.missingFields.includes('Bank Account Number')) {
              completion.missingFields.push('Bank Account Number');
            }
            if (!hasBankId && !completion.missingFields.includes('Bank')) {
              completion.missingFields.push('Bank');
            }
          }
        }
        
        if (!completion.isComplete) {
          console.log('❌ Profile incomplete:', {
            percentage: completion.percentage,
            missingFields: completion.missingFields,
          });
          return NextResponse.json(
            { 
              error: 'Profile incomplete',
              message: 'Please complete your profile before applying for properties. Missing: ' + completion.missingFields.join(', '),
              completion: completion.percentage,
              missingFields: completion.missingFields,
            },
            { status: 403 }
          );
        }
      }
    }

    const body = await request.json();
    const { property_id, message, signed_lease_agreement, signed_collexia_form, pay_slip, bank_statement } = body;

    // Validate required fields
    if (!property_id) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      );
    }

    // Verify property exists
    const propertyParams = new URLSearchParams();
    propertyParams.append('filter[id][_eq]', property_id.toString());
    propertyParams.append('fields', 'id,title');
    
    const propertyResponse = await httpJson(
      'GET',
      `${config.directus.url}/items/properties?${propertyParams.toString()}`,
      null,
      [`Authorization: Bearer ${config.directus.token}`]
    );

    if (propertyResponse.status < 200 || propertyResponse.status >= 300) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    const propertyData = JSON.parse(propertyResponse.body);
    const properties = propertyData.data || [];

    if (properties.length === 0) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    // Check if student already has a pending application for this property
    const existingAppsParams = new URLSearchParams();
    existingAppsParams.append('filter[student][_eq]', userId);
    existingAppsParams.append('filter[property][_eq]', property_id.toString());
    existingAppsParams.append('filter[status][_eq]', 'pending');
    existingAppsParams.append('fields', 'id');
    
    const existingAppsResponse = await httpJson(
      'GET',
      `${config.directus.url}/items/applications?${existingAppsParams.toString()}`,
      null,
      [`Authorization: Bearer ${config.directus.token}`]
    );

    if (existingAppsResponse.status >= 200 && existingAppsResponse.status < 300) {
      const existingAppsData = JSON.parse(existingAppsResponse.body);
      if (existingAppsData.data && existingAppsData.data.length > 0) {
        return NextResponse.json(
          { error: 'You already have a pending application for this property' },
          { status: 400 }
        );
      }
    }

    // Create the application
    const applicationData: any = {
      student: userId,
      property: parseInt(property_id),
      status: 'pending',
      message: message || '',
    };

    // Add file IDs if provided
    if (signed_lease_agreement) {
      applicationData.signed_lease_agreement = signed_lease_agreement;
    }
    if (signed_collexia_form) {
      applicationData.signed_collexia_form = signed_collexia_form;
    }
    if (pay_slip) {
      applicationData.pay_slip = pay_slip;
    }
    if (bank_statement) {
      applicationData.bank_statement = bank_statement;
    }

    console.log('📝 Creating application:', {
      student: userId,
      property: property_id,
      hasLeaseAgreement: !!signed_lease_agreement,
      hasCollexiaForm: !!signed_collexia_form,
      hasPaySlip: !!pay_slip,
      hasBankStatement: !!bank_statement,
    });

    const createResponse = await httpJson(
      'POST',
      `${config.directus.url}/items/applications`,
      applicationData,
      [`Authorization: Bearer ${config.directus.token}`] // Use admin token for creation
    );

    if (createResponse.status < 200 || createResponse.status >= 300) {
      const errorData = JSON.parse(createResponse.body);
      console.error('❌ Failed to create application:', errorData);
      return NextResponse.json(
        { error: errorData.errors?.[0]?.message || 'Failed to create application' },
        { status: createResponse.status }
      );
    }

    const createdApplication = JSON.parse(createResponse.body);
    console.log('✅ Application created successfully:', createdApplication.data.id);

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      application: createdApplication.data,
    });
  } catch (error: any) {
    console.error('Error creating application:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

/**
 * Get applications for the current student
 * GET /api/applications
 */
export async function GET(request: NextRequest) {
  try {
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

    // Verify user is a student
    // Strategy: Get user ID from /users/me, then query with admin token to get role
    console.log('🔍 Step 1: Getting user ID from /users/me for GET applications...');
    const meResponse = await fetch(`${config.directus.url}/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!meResponse.ok) {
      const errorText = await meResponse.text();
      console.error('❌ /users/me failed:', meResponse.status, errorText.substring(0, 200));
      return NextResponse.json(
        { error: 'Unauthorized - Could not verify user' },
        { status: 401 }
      );
    }
    
    const meData = await meResponse.json();
    const userId = meData.data?.id;
    
    if (!userId) {
      console.error('❌ No user ID returned from /users/me');
      return NextResponse.json(
        { error: 'Unauthorized - User ID not found' },
        { status: 401 }
      );
    }
    
    console.log('✅ Got user ID:', userId);
    
    // Query user with admin token to get role information
    console.log('🔍 Step 2: Querying user with admin token to get role...');
    const userByIdParams = new URLSearchParams();
    userByIdParams.append('filter[id][_eq]', userId);
    userByIdParams.append('fields', 'id,email,first_name,last_name,status,role.id,role.name,role');
    userByIdParams.append('limit', '1');
    
    const userResponse = await httpJson(
      'GET',
      `${config.directus.url}/users?${userByIdParams.toString()}`,
      null,
      [`Authorization: Bearer ${config.directus.token}`] // Use admin token to get role info
    );

    if (userResponse.status < 200 || userResponse.status >= 300) {
      const errorText = userResponse.body;
      console.error('❌ Failed to query user with admin token:', {
        status: userResponse.status,
        error: errorText.substring(0, 500),
      });
      return NextResponse.json(
        { error: 'Unauthorized - Could not verify user role' },
        { status: 401 }
      );
    }

    const userData = JSON.parse(userResponse.body);
    const users = userData.data || [];
    
    if (users.length === 0) {
      console.error('❌ No user found with ID:', userId);
      return NextResponse.json(
        { error: 'Unauthorized - User not found' },
        { status: 401 }
      );
    }

    const user = users[0];
    
    // Extract role information
    let userRoleId = '';
    let userRoleName = '';
    
    if (user.role) {
      if (typeof user.role === 'string') {
        userRoleId = user.role;
      } else if (typeof user.role === 'object') {
        userRoleId = user.role.id || '';
        userRoleName = user.role.name || '';
      }
    }
    
    const normalizedRole = typeof userRoleName === 'string' ? userRoleName.toLowerCase().trim() : '';

    // Check if user is a student by role ID or role name
    const isStudentById = config.roles.student && userRoleId === config.roles.student;
    const isStudentByName = normalizedRole.includes('student');

    if (!isStudentById && !isStudentByName) {
      return NextResponse.json(
        { error: 'Forbidden - Only students can view applications' },
        { status: 403 }
      );
    }

    // Fetch applications for this student
    const applicationsParams = new URLSearchParams();
    applicationsParams.append('filter[student][_eq]', userId);
    applicationsParams.append('fields', '*,property.*,property.featured_image.*,property.owner.id,property.owner.first_name,property.owner.last_name,signed_lease_agreement.*,signed_collexia_form.*,pay_slip.*,bank_statement.*,collexia_contract_reference,collexia_student_id,collexia_property_code,collexia_student_registered,collexia_property_registered,collexia_mandate_registered,collexia_integration_date,collexia_integration_status,collexia_error_message');
    applicationsParams.append('sort', '-date_created');
    
    const applicationsResponse = await httpJson(
      'GET',
      `${config.directus.url}/items/applications?${applicationsParams.toString()}`,
      null,
      [`Authorization: Bearer ${config.directus.token}`]
    );

    if (applicationsResponse.status < 200 || applicationsResponse.status >= 300) {
      const errorData = JSON.parse(applicationsResponse.body);
      console.error('❌ Failed to fetch applications:', errorData);
      return NextResponse.json(
        { error: errorData.errors?.[0]?.message || 'Failed to fetch applications' },
        { status: applicationsResponse.status }
      );
    }

    const applicationsData = JSON.parse(applicationsResponse.body);
    const applications = applicationsData.data || [];

    console.log('✅ Applications fetched:', applications.length);

    return NextResponse.json({
      success: true,
      applications: applications,
      count: applications.length,
    });
  } catch (error: any) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

/**
 * Delete an application and its associated files
 * DELETE /api/applications?id={applicationId}
 */
export async function DELETE(request: NextRequest) {
  console.log('🗑️ DELETE /api/applications called');
  try {
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

    // Get application ID from query parameters
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('id');

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
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

    // Fetch the application to verify ownership and get file IDs
    // Only fetch fields we need: id, student, status, and the files we'll delete (signed_lease_agreement, signed_collexia_form)
    // Note: We don't fetch pay_slip and bank_statement since we're not deleting them and they may have permission restrictions
    const applicationParams = new URLSearchParams();
    applicationParams.append('filter[id][_eq]', applicationId);
    applicationParams.append('fields', 'id,student,status,signed_lease_agreement,signed_collexia_form');
    
    console.log('🔍 Fetching application for deletion:', applicationId);
    console.log('🔍 User ID:', userId);
    
    const applicationResponse = await httpJson(
      'GET',
      `${config.directus.url}/items/applications?${applicationParams.toString()}`,
      null,
      [`Authorization: Bearer ${config.directus.token}`]
    );

    console.log('🔍 Application query response status:', applicationResponse.status);

    if (applicationResponse.status < 200 || applicationResponse.status >= 300) {
      let errorData = {};
      try {
        errorData = JSON.parse(applicationResponse.body);
      } catch (e) {
        errorData = { error: applicationResponse.body };
      }
      console.error('❌ Failed to fetch application:', errorData);
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    const applicationData = JSON.parse(applicationResponse.body);
    const applications = applicationData.data || [];

    console.log('🔍 Applications found:', applications.length);
    console.log('🔍 Application data:', JSON.stringify(applications, null, 2));

    if (applications.length === 0) {
      console.error('❌ No application found with ID:', applicationId);
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    const application = applications[0];

    // Handle student field - it might be a UUID string or a relationship object
    const applicationStudentId = typeof application.student === 'object' 
      ? application.student?.id || application.student 
      : application.student;

    console.log('🔍 Application student ID:', applicationStudentId);
    console.log('🔍 Current user ID:', userId);
    console.log('🔍 IDs match:', applicationStudentId === userId);

    // Verify the application belongs to the current user
    if (applicationStudentId !== userId) {
      console.error('❌ Application does not belong to user');
      return NextResponse.json(
        { error: 'Forbidden - You can only delete your own applications' },
        { status: 403 }
      );
    }

    // Check if application is approved - don't allow deletion of approved applications
    if (application.status === 'approved' || application.status === 'accepted') {
      return NextResponse.json(
        { error: 'Cannot delete approved applications' },
        { status: 400 }
      );
    }

    // Collect file IDs to delete - only delete signed_lease_agreement and signed_collexia_form
    // Keep pay_slip and bank_statement as they may be reused
    const fileIds: string[] = [];
    if (application.signed_lease_agreement) {
      fileIds.push(application.signed_lease_agreement);
    }
    if (application.signed_collexia_form) {
      fileIds.push(application.signed_collexia_form);
    }
    // Note: pay_slip and bank_statement are NOT deleted - they may be reused for other applications

    console.log('🗑️ Deleting application:', applicationId);
    console.log('🗑️ Files to delete:', fileIds);

    // Delete the application first
    const deleteResponse = await httpJson(
      'DELETE',
      `${config.directus.url}/items/applications/${applicationId}`,
      null,
      [`Authorization: Bearer ${config.directus.token}`]
    );

    if (deleteResponse.status < 200 || deleteResponse.status >= 300) {
      const errorData = JSON.parse(deleteResponse.body);
      console.error('❌ Failed to delete application:', errorData);
      return NextResponse.json(
        { error: errorData.errors?.[0]?.message || 'Failed to delete application' },
        { status: deleteResponse.status }
      );
    }

    console.log('✅ Application deleted successfully');

    // Delete associated files (non-blocking - continue even if some fail)
    if (fileIds.length > 0) {
      console.log('🗑️ Deleting associated files...');
      const deleteFilePromises = fileIds.map(async (fileId) => {
        try {
          const fileDeleteResponse = await fetch(`${config.directus.url}/files/${fileId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${config.directus.token}`,
            },
          });
          if (fileDeleteResponse.ok) {
            console.log(`✅ Deleted file: ${fileId}`);
          } else {
            console.warn(`⚠️ Failed to delete file: ${fileId}`);
          }
        } catch (error) {
          console.warn(`⚠️ Error deleting file ${fileId}:`, error);
        }
      });

      await Promise.allSettled(deleteFilePromises);
      console.log('✅ File deletion completed');
    }

    return NextResponse.json({
      success: true,
      message: 'Application and associated files deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting application:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

