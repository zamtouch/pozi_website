import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { getAuthToken } from '@/lib/auth-utils/server-auth';
import { httpJson } from '@/lib/auth-utils/http';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

/**
 * Upload a document (lease agreement, pay slip, or bank statement)
 * POST /api/upload-document
 * Body: FormData with 'file'
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
    console.log('🔍 Step 1: Getting user ID from /users/me...');
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
    console.log('🔍 Full user data:', JSON.stringify(user, null, 2));
    
    // Extract role information
    let userRoleId = '';
    let userRoleName = '';
    
    if (user.role) {
      if (typeof user.role === 'string') {
        // Role is just an ID string - fetch role details
        userRoleId = user.role;
        try {
          const roleResponse = await fetch(`${config.directus.url}/roles/${userRoleId}`, {
            headers: {
              'Authorization': `Bearer ${config.directus.token}`,
            },
          });
          if (roleResponse.ok) {
            const roleData = await roleResponse.json();
            userRoleName = roleData.data?.name || '';
            console.log('🔍 Fetched role name from ID:', userRoleName);
          }
        } catch (e) {
          console.warn('⚠️ Could not fetch role name:', e);
        }
      } else if (typeof user.role === 'object') {
        // Role is an object
        userRoleId = user.role.id || '';
        userRoleName = user.role.name || '';
      }
    }
    
    const normalizedRole = typeof userRoleName === 'string' ? userRoleName.toLowerCase().trim() : '';
    
    console.log('🔍 User role check:', {
      roleId: userRoleId,
      roleName: userRoleName,
      normalizedRole: normalizedRole,
      studentRoleId: config.roles.student,
      hasStudentRoleId: !!config.roles.student,
      fullRoleObject: user.role,
    });

    // Check if user is a student by role ID or role name
    const isStudentById = config.roles.student && userRoleId && userRoleId === config.roles.student;
    const isStudentByName = normalizedRole && (normalizedRole.includes('student') || normalizedRole === 'student');
    
    console.log('🔍 Student check results:', {
      isStudentById,
      isStudentByName,
      willAllow: isStudentById || isStudentByName,
    });
    
    if (!isStudentById && !isStudentByName) {
      console.error('❌ User is not a student:', {
        roleId: userRoleId,
        roleName: userRoleName,
        normalizedRole: normalizedRole,
        expectedStudentRoleId: config.roles.student,
        hasStudentRoleId: !!config.roles.student,
        fullRoleData: user.role,
      });
      return NextResponse.json(
        { 
          error: 'Forbidden - Only students can upload documents',
          debug: process.env.NODE_ENV === 'development' ? {
            roleId: userRoleId,
            roleName: userRoleName,
            normalizedRole: normalizedRole,
            expectedStudentRoleId: config.roles.student,
            hasStudentRoleId: !!config.roles.student,
            fullRoleData: user.role,
          } : undefined,
        },
        { status: 403 }
      );
    }
    
    console.log('✅ User verified as student');

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type (PDF or image)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, JPEG, and PNG files are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    if (file.size > MAX_FILE_SIZE) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return NextResponse.json(
        { 
          error: `File size (${fileSizeMB}MB) exceeds the maximum allowed size of 5MB. Please compress the file and try again.`,
          fileSize: file.size,
          maxSize: MAX_FILE_SIZE,
        },
        { status: 400 }
      );
    }

    // Upload file to Directus
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    console.log('📤 Uploading document to Directus:', { fileName: file.name, fileSize: file.size, fileType: file.type });

    const uploadResponse = await fetch(`${config.directus.url}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.directus.token}`, // Use admin token for file upload
      },
      body: uploadFormData,
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json().catch(() => ({}));
      console.error('❌ Failed to upload file:', errorData);
      return NextResponse.json(
        { error: 'Failed to upload file: ' + (errorData.errors?.[0]?.message || 'Unknown error') },
        { status: uploadResponse.status }
      );
    }

    const uploadData = await uploadResponse.json();
    const fileId = uploadData.data.id;
    const fileData = uploadData.data;
    
    console.log('✅ Document uploaded successfully to Directus:');
    console.log('  File ID:', fileId);
    console.log('  Filename:', fileData.filename_download);
    console.log('  Type:', fileData.type);
    console.log('  Size:', fileData.filesize);
    console.log('  Storage:', fileData.storage);
    console.log('  Full file data:', JSON.stringify(fileData, null, 2));
    console.log('  View in Directus:', `${config.directus.url}/admin/files/${fileId}`);

    return NextResponse.json({
      success: true,
      data: {
        id: fileId,
        filename_download: fileData.filename_download,
        type: fileData.type,
        filesize: fileData.filesize,
        storage: fileData.storage,
        directus_url: `${config.directus.url}/admin/files/${fileId}`, // For debugging
      },
      message: 'Document uploaded successfully',
    });
  } catch (error: any) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

/**
 * Delete an uploaded document (for cleaning up orphaned files)
 * DELETE /api/upload-document?id={fileId}
 */
export async function DELETE(request: NextRequest) {
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

    // Verify user is authenticated (use same method as POST endpoint)
    // Strategy: Get user ID from /users/me, then query with admin token to get role
    console.log('🔍 Step 1: Getting user ID from /users/me for file deletion...');
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
    
    console.log('✅ Got user ID for file deletion:', userId);

    // Get file ID from query params
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('id');

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      );
    }

    // Optional: Verify the file belongs to this user (check if it's referenced in any of their applications)
    // For now, we'll allow deletion if user is authenticated as student
    // In production, you might want to add additional checks

    console.log('🗑️ Deleting document from Directus:', fileId);

    // Delete file from Directus using admin token
    const deleteResponse = await fetch(`${config.directus.url}/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${config.directus.token}`, // Use admin token for file deletion
      },
    });

    if (!deleteResponse.ok) {
      const errorData = await deleteResponse.json().catch(() => ({}));
      console.error('❌ Failed to delete file from Directus:', errorData);
      return NextResponse.json(
        { error: 'Failed to delete file: ' + (errorData.errors?.[0]?.message || 'Unknown error') },
        { status: deleteResponse.status }
      );
    }

    console.log('✅ Document deleted successfully from Directus');

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
