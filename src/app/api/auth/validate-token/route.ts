import { NextRequest, NextResponse } from 'next/server';
import { httpJson } from '@/lib/auth-utils/http';
import { config } from '@/lib/config';
import { getAuthToken } from '@/lib/auth-utils/server-auth';

/**
 * Validate a user's static token and return user information.
 * This is used to check if a stored token is still valid and get user data.
 * Can read token from cookie or request body.
 */
export async function POST(request: NextRequest) {
  try {
    // Try to get token from cookie first, then from body
    let token = getAuthToken(request);
    
    if (!token) {
      const body = await request.json().catch(() => ({}));
      token = body.token;
    }

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    // Find user by token (static token stored in user.token field)
    const filterParams = new URLSearchParams();
    filterParams.append('filter[token][_eq]', token);
    filterParams.append('fields', 'id,email,first_name,last_name,status,role.name,role.id');
    filterParams.append('limit', '1');
    const filter = filterParams.toString();

    console.log('🔍 Validating token in Directus...');
    const userResponse = await httpJson(
      'GET',
      `${config.directus.url}/users?${filter}`,
      null,
      [`Authorization: Bearer ${config.directus.token}`]
    );

    console.log('🔍 Directus response status:', userResponse.status);

    if (userResponse.status < 200 || userResponse.status >= 300) {
      let errorMessage = 'Failed to validate token';
      try {
        const errorData = JSON.parse(userResponse.body);
        errorMessage = errorData.errors?.[0]?.message || errorData.error?.message || errorMessage;
        console.error('❌ Directus query failed:', {
          status: userResponse.status,
          error: errorMessage,
          body: userResponse.body.substring(0, 500),
        });
      } catch (e) {
        console.error('❌ Failed to parse Directus error response:', {
          status: userResponse.status,
          body: userResponse.body.substring(0, 500),
        });
      }
      
      return NextResponse.json(
        { success: false, error: errorMessage, details: 'Directus query failed' },
        { status: 401 }
      );
    }

    let userData;
    try {
      userData = JSON.parse(userResponse.body);
    } catch (e) {
      console.error('❌ Failed to parse Directus response:', userResponse.body.substring(0, 500));
      return NextResponse.json(
        { success: false, error: 'Invalid response from server' },
        { status: 500 }
      );
    }

    const users = userData.data || [];
    console.log('🔍 Users found:', users.length);

    if (users.length === 0) {
      console.log('❌ No user found with this token');
      return NextResponse.json(
        { success: false, error: 'Token not found in database' },
        { status: 401 }
      );
    }

    const user = users[0];

    // Check if user is active
    if (user.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Account is not active', status: user.status },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
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
    console.error('Validate token error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

