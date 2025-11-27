import { NextRequest, NextResponse } from 'next/server';
import { httpJson } from '@/lib/auth-utils/http';
import { config } from '@/lib/config';

/**
 * Get current session from cookie
 * This endpoint reads the token from the httpOnly cookie and returns user data
 */
export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('directus_token')?.value;

    console.log('🔍 Session check - Cookie present:', !!token);
    if (token) {
      console.log('🔍 Token preview:', token.substring(0, 10) + '...');
    }
    
    if (!token) {
      console.log('❌ No token in cookie');
      return NextResponse.json(
        { success: false, authenticated: false },
        { status: 200 }
      );
    }

    // Find user by token field (the static token stored in user.token)
    const filterParams = new URLSearchParams();
    filterParams.append('filter[token][_eq]', token);
    filterParams.append('fields', 'id,email,first_name,last_name,status,role.name,role.id');
    filterParams.append('limit', '1');
    const filter = filterParams.toString();

    console.log('🔍 Querying Directus for user with token...');
    const userResponse = await httpJson(
      'GET',
      `${config.directus.url}/users?${filter}`,
      null,
      [`Authorization: Bearer ${config.directus.token}`]
    );

    console.log('🔍 Directus response status:', userResponse.status);

    if (userResponse.status < 200 || userResponse.status >= 300) {
      console.error('❌ Failed to query user:', {
        status: userResponse.status,
        body: userResponse.body.substring(0, 200),
      });
      return NextResponse.json(
        { success: false, authenticated: false, error: 'Failed to validate token' },
        { status: 200 }
      );
    }

    const userData = JSON.parse(userResponse.body);
    const users = userData.data || [];

    console.log('🔍 Users found:', users.length);

    if (users.length === 0) {
      console.log('❌ No user found with this token');
      return NextResponse.json(
        { success: false, authenticated: false, error: 'Token not found' },
        { status: 200 }
      );
    }

    const user = users[0];

    // Check if user is active
    if (user.status !== 'active') {
      console.log('❌ User not active:', user.status);
      return NextResponse.json(
        { success: false, authenticated: false, status: user.status, error: 'User account is not active' },
        { status: 200 }
      );
    }

    console.log('✅ Session valid - User:', user.email, 'Role:', user.role?.name || user.role);

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: user.id,
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        status: user.status || '',
        role: user.role?.name || user.role || '',
        role_id: user.role?.id || '',
      },
    });
  } catch (error: any) {
    console.error('❌ Session check error:', error);
    return NextResponse.json(
      { success: false, authenticated: false, error: error.message },
      { status: 200 }
    );
  }
}

