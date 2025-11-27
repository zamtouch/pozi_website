import { NextRequest, NextResponse } from 'next/server';
import { httpJson } from '@/lib/auth-utils/http';
import { generateTokenPlain } from '@/lib/auth-utils/crypto';
import { config } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // 1) Authenticate via Directus /auth/login
    const authResponse = await httpJson(
      'POST',
      `${config.directus.url}/auth/login`,
      { email, password }
    );

    if (authResponse.status < 200 || authResponse.status >= 300) {
      const err = JSON.parse(authResponse.body);
      const msg = err.errors?.[0]?.message || 'Invalid email or password';
      
      // Log detailed error for debugging
      console.error('Directus authentication failed:', {
        email,
        status: authResponse.status,
        error: msg,
        fullError: err,
      });
      
      // Check if user exists and what their status is (for better error message)
      // Directus blocks login for non-active users, so we need to check status separately
      try {
        const userCheckParams = new URLSearchParams();
        userCheckParams.append('filter[email][_eq]', email);
        userCheckParams.append('fields', 'id,email,status,role.name');
        const userCheckResponse = await httpJson(
          'GET',
          `${config.directus.url}/users?${userCheckParams.toString()}`,
          null,
          [`Authorization: Bearer ${config.directus.token}`]
        );
        
        if (userCheckResponse.status === 200) {
          const userData = JSON.parse(userCheckResponse.body);
          const users = userData.data || [];
          if (users.length > 0) {
            const user = users[0];
            console.log('User found with status:', {
              email: user.email,
              status: user.status,
              role: user.role?.name || user.role,
            });
            
            // If user exists but status is not active, provide specific message
            // Directus blocks login for non-active users, so this is likely the issue
            if (user.status !== 'active') {
              console.log('Login blocked: User status is not active', {
                email: user.email,
                status: user.status,
              });
              return NextResponse.json(
                { 
                  error: `Account status is '${user.status}'. Please verify your email address to activate your account.`,
                  status: user.status,
                  needsVerification: true,
                },
                { status: 403 }
              );
            }
          } else {
            console.log('User not found with email:', email);
          }
        } else {
          console.error('Failed to check user status:', {
            status: userCheckResponse.status,
            body: userCheckResponse.body,
          });
        }
      } catch (checkError: any) {
        // Log check errors but continue with original error message
        console.error('Error checking user status:', {
          error: checkError.message,
          stack: checkError.stack,
        });
      }
      
      return NextResponse.json(
        { error: msg },
        { status: 401 }
      );
    }

    const auth = JSON.parse(authResponse.body);
    const accessToken = auth.data?.access_token;
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Authentication failed - access token missing' },
        { status: 500 }
      );
    }

    // 2) Fetch current user (basic info with user's token)
    const meResponse = await httpJson(
      'GET',
      `${config.directus.url}/users/me?fields=id,email,first_name,last_name,role.name,role.id`,
      null,
      [
        `Authorization: Bearer ${accessToken}`,
        'Accept: application/json',
      ]
    );

    if (meResponse.status < 200 || meResponse.status >= 300) {
      const err = JSON.parse(meResponse.body);
      const msg = err.errors?.[0]?.message || 'Could not fetch user';
      return NextResponse.json(
        { error: msg },
        { status: 500 }
      );
    }

    const me = JSON.parse(meResponse.body).data;
    if (!me || !me.id) {
      return NextResponse.json(
        { error: 'User data missing from /users/me' },
        { status: 500 }
      );
    }

    // 3) Check user status using admin token (user's own token may not have permission to read status)
    // This is important because role permissions might restrict reading the status field
    const userStatusParams = new URLSearchParams();
    userStatusParams.append('filter[id][_eq]', me.id);
    userStatusParams.append('fields', 'id,email,status,role.name,role.id');
    
    const userStatusResponse = await httpJson(
      'GET',
      `${config.directus.url}/users?${userStatusParams.toString()}`,
      null,
      [`Authorization: Bearer ${config.directus.token}`]
    );

    let userStatus = 'unknown';
    if (userStatusResponse.status === 200) {
      const userStatusData = JSON.parse(userStatusResponse.body);
      const users = userStatusData.data || [];
      if (users.length > 0) {
        const fullUserData = users[0];
        userStatus = fullUserData.status || 'unknown';
        // Update me object with status and role if we got it
        me.status = userStatus;
        if (!me.email && fullUserData.email) {
          me.email = fullUserData.email;
        }
        // Ensure role is properly set (use role.name if available, otherwise keep existing)
        if (fullUserData.role?.name) {
          me.role = fullUserData.role;
        }
      }
    } else {
      console.warn('Could not fetch user status with admin token:', {
        status: userStatusResponse.status,
        body: userStatusResponse.body,
      });
    }

    // 4) Ensure account is active
    if (userStatus !== 'active') {
      console.log('Login blocked - user status is not active:', {
        email: me.email || 'unknown',
        status: userStatus,
        userId: me.id,
        fullUserData: me,
      });
      return NextResponse.json(
        { 
          error: `Account status is '${userStatus}'. Please verify your email address to activate your account.`,
          status: userStatus,
        },
        { status: 403 }
      );
    }

    // 4) Generate static token using the access token we received
    // We'll generate a secure static token and save it to the user record
    const staticToken = generateTokenPlain();

    // 5) Write static token back to user record using admin token
    // This allows the user to use the static token for future API calls
    if (!config.directus.token) {
      return NextResponse.json(
        { error: 'Server misconfigured: DIRECTUS_ADMIN_TOKEN is missing' },
        { status: 500 }
      );
    }

    console.log('💾 Generating and saving static token to user record...');
    const updateResponse = await httpJson(
      'PATCH',
      `${config.directus.url}/users/${encodeURIComponent(me.id)}`,
      { token: staticToken },
      [
        `Authorization: Bearer ${config.directus.token}`,
        'Accept: application/json',
      ]
    );

    if (updateResponse.status < 200 || updateResponse.status >= 300) {
      const err = JSON.parse(updateResponse.body);
      const msg = err.errors?.[0]?.message || 'Could not update user token';
      console.error('❌ Failed to save static token to user record:', {
        status: updateResponse.status,
        error: msg,
        fullError: err,
        userId: me.id,
      });
      return NextResponse.json(
        { error: msg },
        { status: 500 }
      );
    }

    console.log('✅ Static token generated and saved successfully to user record');

    // 6) Create response with user data
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      static_token: staticToken,
      user: {
        id: me.id,
        email: me.email || '',
        first_name: me.first_name || '',
        last_name: me.last_name || '',
        status: me.status || '',
        role: me.role?.name || me.role || 'Candidate',
      },
    });

    // 7) Set httpOnly cookie for session management with 30-day lifetime
    const cookieExpiry = 30 * 24 * 60 * 60; // 30 days in seconds
    response.cookies.set('directus_token', staticToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: cookieExpiry,
      path: '/',
    });

    console.log('✅ Cookie set with 30-day lifetime');

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

