/**
 * Get profile completion status
 * GET /api/profile/completion
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/auth-utils/server-auth';
import { config } from '@/lib/config';
import { calculateProfileCompletion } from '@/lib/profile-completion';

export async function GET(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user data from Directus with all required fields including bank account info
    // IMPORTANT: We need to properly expand the role relationship to get role.name
    // Use fields parameter to ensure we get all necessary fields
    const fields = [
      'id',
      'email',
      'first_name',
      'last_name',
      'phone',
      'status',
      'role.id',
      'role.name',
      // Responsible person fields
      'responsible_first_name',
      'responsible_last_name',
      'responsible_relationship',
      'responsible_email',
      'responsible_id_number',
      'responsible_cell',
      'responsible_occupation',
      // File uploads
      'id_certified_copy',
      'payslip',
      'bank_statement_6months',
      // Bank account information (for Collexia)
      'account_number',
      'bank_id',
      'account_type',
      'id_number',
      'id_type',
    ].join(',');

    // Fetch user with role relationship properly expanded
    const userResponse = await fetch(`${config.directus.url}/users/me?fields=${fields}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!userResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: userResponse.status }
      );
    }

    const userData = await userResponse.json();
    let user = userData.data;
    
    if (!user || !user.id) {
      console.error('❌ Invalid user data received:', userData);
      return NextResponse.json(
        { error: 'Invalid user data' },
        { status: 500 }
      );
    }
    
    const userId = user.id;
    const originalRole = user.role;

    // Get role name - try from user data first, then fetch with admin token if needed
    let roleName = '';
    if (typeof originalRole === 'object' && originalRole?.name) {
      roleName = originalRole.name;
    } else if (typeof originalRole === 'string') {
      // Role is UUID, fetch with admin token
      try {
        const adminUserResponse = await fetch(`${config.directus.url}/users/${userId}?fields=role.id,role.name`, {
          headers: {
            'Authorization': `Bearer ${config.directus.token}`,
          },
        });
        if (adminUserResponse.ok) {
          const adminData = await adminUserResponse.json();
          roleName = adminData.data?.role?.name || '';
          if (adminData.data?.role) {
            user.role = adminData.data.role;
          }
        } else {
          // Fallback: direct role fetch
          const roleResponse = await fetch(`${config.directus.url}/roles/${originalRole}?fields=id,name`, {
            headers: {
              'Authorization': `Bearer ${config.directus.token}`,
            },
          });
          if (roleResponse.ok) {
            const roleData = await roleResponse.json();
            roleName = roleData.data?.name || '';
            user.role = roleData.data;
          }
        }
      } catch (err) {
        console.error('Error fetching role:', err);
      }
    }
    
    const isStudentCheck = roleName?.toLowerCase().includes('student') || false;
    
    console.log('🔍 Profile completion check - User data:', {
      account_number: user.account_number,
      bank_id: user.bank_id,
      account_type: user.account_type,
      id_number: user.id_number,
      id_type: user.id_type,
      has_account_number: !!user.account_number,
      has_bank_id: !!user.bank_id,
      account_number_value: user.account_number,
      bank_id_value: user.bank_id,
      role: user.role,
      roleName,
      isStudent: isStudentCheck,
      roleType: typeof user.role,
      roleObject: JSON.stringify(user.role),
    });

    // Calculate completion
    const completion = calculateProfileCompletion(user);
    
    // CRITICAL FIX: Always check bank fields for students, regardless of initial calculation
    // Also check if role couldn't be determined but bank fields are missing (safer to require them)
    const shouldCheckBankFields = isStudentCheck || (!roleName && (!user.account_number || !user.bank_id));
    
    if (shouldCheckBankFields) {
      if (!isStudentCheck) {
        console.log('⚠️ Role could not be determined, but checking bank fields anyway for safety');
      }
      const accountNumberStr = user.account_number ? String(user.account_number).trim() : '';
      const bankIdValue = user.bank_id;
      
      const hasAccountNumber = accountNumberStr.length > 0;
      const hasBankId = bankIdValue !== null && 
                       bankIdValue !== undefined && 
                       bankIdValue !== '' && 
                       !isNaN(Number(bankIdValue)) &&
                       Number(bankIdValue) > 0;
      
      console.log('🔍 SAFETY CHECK - Verifying bank fields for student:', {
        hasAccountNumber,
        hasBankId,
        account_number_raw: user.account_number,
        account_number_str: accountNumberStr,
        bank_id_raw: bankIdValue,
        bank_id_type: typeof bankIdValue,
        completion_was_complete: completion.isComplete,
      });
      
      if (!hasAccountNumber || !hasBankId) {
        console.log('❌ SAFETY CHECK: Bank fields missing! Forcing incomplete status...');
        
        // Remove from missingFields if already there (to avoid duplicates)
        completion.missingFields = completion.missingFields.filter(f => 
          f !== 'Bank Account Number' && f !== 'Bank'
        );
        
        // Add missing bank fields
        if (!hasAccountNumber) {
          completion.missingFields.push('Bank Account Number');
          console.log('  → Added "Bank Account Number" to missing fields');
        }
        if (!hasBankId) {
          completion.missingFields.push('Bank');
          console.log('  → Added "Bank" to missing fields');
        }
        
        // Force incomplete status
        completion.isComplete = false;
        
        // Recalculate percentage properly
        // Total fields: 4 (basic) + 7 (responsible) + 3 (files) + 2 (bank) = 16
        const totalFields = 16;
        const completedFields = totalFields - completion.missingFields.length;
        completion.percentage = Math.max(0, Math.round((completedFields / totalFields) * 100));
        
        console.log('✅ SAFETY CHECK: Fixed completion status:', {
          percentage: completion.percentage,
          isComplete: completion.isComplete,
          missingFields: completion.missingFields,
          missingCount: completion.missingFields.length,
        });
      } else {
        console.log('✅ SAFETY CHECK: Bank fields are present');
      }
    } else {
      console.log('⚠️ SAFETY CHECK: User is not a student and bank fields appear present, skipping check');
    }
    
    // Debug: Log completion result
    console.log('📊 Profile completion result:', {
      percentage: completion.percentage,
      isComplete: completion.isComplete,
      missingFields: completion.missingFields,
      totalFields: completion.missingFields.length + (100 - completion.percentage) / (100 / (completion.missingFields.length + (completion.percentage > 0 ? Math.round(100 / completion.percentage) : 0))),
    });

    return NextResponse.json({
      success: true,
      completion,
    });
  } catch (error: any) {
    console.error('Profile completion error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      cause: error.cause,
    });
    return NextResponse.json(
      { error: 'Internal server error: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}




