import { NextRequest, NextResponse } from 'next/server';
import { httpJson } from '@/lib/auth-utils/http';
import { generateTokenPlain, tokenHash, addMinutesIso } from '@/lib/auth-utils/crypto';
import { sendgridSendVerificationEmail } from '@/lib/auth-utils/sendgrid';
import { config } from '@/lib/config';

// Role IDs for different user types (student rentals)
const STUDENT_ROLE_ID = process.env.STUDENT_ROLE_ID || '';
const LANDLORD_ROLE_ID = process.env.LANDLORD_ROLE_ID || '';
const DEFAULT_ROLE_ID = process.env.DEFAULT_ROLE_ID || STUDENT_ROLE_ID; // Fallback to student
const TOKEN_EXPIRY_MINUTES = parseInt(process.env.TOKEN_EXPIRY_MINUTES || '1440', 10); // 24 hours
const PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.PUBLIC_APP_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      email, 
      password, 
      confirm_password, 
      first_name, 
      last_name, 
      user_type,
      // Person Responsible for Rent Details (students only)
      responsible_first_name,
      responsible_last_name,
      responsible_relationship,
      responsible_email,
      responsible_id_number,
      responsible_cell,
      responsible_occupation,
    } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    if (password !== confirm_password) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    // Determine role ID based on user type (student or landlord)
    let roleId = DEFAULT_ROLE_ID;
    if (user_type === 'landlord' || user_type === 'property_owner') {
      roleId = LANDLORD_ROLE_ID || DEFAULT_ROLE_ID;
    } else if (user_type === 'student') {
      roleId = STUDENT_ROLE_ID || DEFAULT_ROLE_ID;
    }

    if (!roleId) {
      return NextResponse.json(
        { error: 'Server configuration error: Role IDs not configured. Please set STUDENT_ROLE_ID and LANDLORD_ROLE_ID in environment variables.' },
        { status: 500 }
      );
    }

    // 1) Create user with status 'unverified'
    const userData: any = {
      email,
      password,
      first_name: first_name || null,
      last_name: last_name || null,
      role: roleId,
      status: 'unverified',
    };

    // Add student-specific fields if user is a student
    if (user_type === 'student') {
      userData.responsible_first_name = responsible_first_name || null;
      userData.responsible_last_name = responsible_last_name || null;
      userData.responsible_relationship = responsible_relationship || null;
      userData.responsible_email = responsible_email || null;
      userData.responsible_id_number = responsible_id_number || null;
      userData.responsible_cell = responsible_cell || null;
      userData.responsible_occupation = responsible_occupation || null;
      
      // File uploads are not required during signup - users will complete profile later
      // Files will be uploaded via the profile completion page after email verification
    }

    const createResponse = await httpJson(
      'POST',
      `${config.directus.url}/users`,
      userData,
      [`Authorization: Bearer ${config.directus.token}`]
    );

    if (createResponse.status < 200 || createResponse.status >= 300) {
      const err = JSON.parse(createResponse.body);
      let msg = err.errors?.[0]?.message || 'Could not create user';
      
      if (createResponse.status === 401) {
        msg = 'Invalid admin token. Check DIRECTUS_ADMIN_TOKEN in configuration';
      } else if (createResponse.status === 403) {
        msg = 'Insufficient permissions to create users';
      } else if (createResponse.status === 422) {
        msg = 'Invalid user data: ' + msg;
      }

      return NextResponse.json(
        { error: msg },
        { status: 400 }
      );
    }

    const user = JSON.parse(createResponse.body).data;
    if (!user || !user.id) {
      return NextResponse.json(
        { error: 'User created but no ID returned' },
        { status: 500 }
      );
    }

    const userId = user.id;

    // 2) Create verification token record
    const plainToken = generateTokenPlain();
    const hash = tokenHash(plainToken);
    const expires = addMinutesIso(TOKEN_EXPIRY_MINUTES);

    // Debug: Log token info (first 10 chars only for security)
    console.log('Creating verification token with:', {
      directusUrl: config.directus.url,
      tokenPrefix: config.directus.token ? config.directus.token.substring(0, 10) + '...' : 'MISSING',
      userId: userId,
      collection: 'verification_tokens'
    });

    // Try to create verification token - if it fails, we'll still return success but log the error
    let verificationTokenCreated = false;
    let tokenError: any = null;
    
    try {
      const tokenResponse = await httpJson(
        'POST',
        `${config.directus.url}/items/verification_tokens`,
        {
          user: userId,
          token_hash: hash,
          purpose: 'email_verify',
          expires_at: expires,
          used: false,
        },
        [`Authorization: Bearer ${config.directus.token}`]
      );

      if (tokenResponse.status >= 200 && tokenResponse.status < 300) {
        verificationTokenCreated = true;
        console.log('✅ Verification token created successfully');
      } else {
        const err = JSON.parse(tokenResponse.body);
        const errorMsg = err.errors?.[0]?.message || err.error?.message || 'Could not create verification token';
        tokenError = {
          status: tokenResponse.status,
          message: errorMsg,
          fullError: err,
        };
        console.error('❌ Verification token creation failed:', {
          status: tokenResponse.status,
          error: errorMsg,
          fullError: err,
          payload: {
            user: userId,
            token_hash: hash.substring(0, 10) + '...',
            purpose: 'email_verify',
            expires_at: expires,
            used: false,
          }
        });
      }
    } catch (tokenErr: any) {
      tokenError = {
        message: tokenErr.message,
        stack: tokenErr.stack,
      };
      console.error('❌ Exception creating verification token:', tokenErr);
    }
    
    // If token creation failed, log it but don't fail the signup
    // The user can still be created and we can try to send email with a manual verification process
    if (!verificationTokenCreated) {
      console.warn('⚠️  WARNING: Verification token creation failed, but user was created.');
      console.warn('   User ID:', userId);
      console.warn('   You may need to manually verify this user or check verification_tokens collection permissions.');
    }

    // 3) Send verification email (only if token was created successfully)
    let verifyLink = '';
    let emailSent = false;
    let emailError: any = null;
    
    if (verificationTokenCreated) {
      verifyLink = `${PUBLIC_APP_URL}/auth/verify?t=${encodeURIComponent(plainToken)}`;
      
      // Check SendGrid configuration before attempting to send
      const sendGridConfig = {
        apiKey: process.env.SENDGRID_API_KEY ? '***' : 'MISSING (REQUIRED)',
        fromEmail: process.env.SENDGRID_FROM_EMAIL || 'no-reply@pozi.com (default)',
        fromName: process.env.SENDGRID_FROM_NAME || 'Pozi Student Living (default)',
        templateId: process.env.SENDGRID_TEMPLATE_ID || 'MISSING (REQUIRED)',
      };
      
      console.log('SendGrid configuration check:', sendGridConfig);
      
      if (!process.env.SENDGRID_API_KEY) {
        console.warn('⚠️  WARNING: SENDGRID_API_KEY is missing. Email sending will fail.');
      }
      
      try {
        const emailResult = await sendgridSendVerificationEmail(email, first_name || null, verifyLink);
        console.log('✅ Verification email sent successfully:', {
          to: email,
          messageId: emailResult.messageId,
          status: emailResult.status,
        });
        emailSent = true;
      } catch (emailErrorCaught: any) {
        emailError = emailErrorCaught;
        // Log detailed error for debugging
        console.error('❌ SendGrid email sending failed:', {
          error: emailErrorCaught.message,
          stack: emailErrorCaught.stack,
          to: email,
          verifyLink: verifyLink.substring(0, 50) + '...',
          config: sendGridConfig,
        });
        
        // Log full error details
        if (emailErrorCaught.message) {
          console.error('Error message:', emailErrorCaught.message);
        }
        if (emailErrorCaught.response) {
          console.error('Error response:', emailErrorCaught.response);
        }
        
        // Don't fail the signup if email fails, but log it clearly
        // The user can still verify via the link if they have it
      }
    } else {
      console.warn('⚠️  Skipping email send because verification token was not created.');
    }

    // Note: For landlords, property listings can be set up after email verification
    
    // In development, include the verification link in the response for testing
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    let message = 'Account created successfully.';
    if (!verificationTokenCreated) {
      message += ' Warning: Verification token creation failed. Please check server logs.';
    } else if (emailSent) {
      message += ' Please check your email for a verification link.';
    } else {
      message += ' Email sending failed - please check server logs.';
    }
    
    const responseData: any = {
      success: true,
      message: message,
      user_id: userId,
      user_type: user_type || 'student',
      email_sent: emailSent,
      token_created: verificationTokenCreated,
    };
    
    // Always include verification link in development mode for testing
    // Also include if email failed so user can still verify
    if (verifyLink && (isDevelopment || !emailSent)) {
      responseData.verification_link = verifyLink;
      responseData.debug_note = emailSent
        ? 'In development mode, you can use the verification_link above to verify your account.'
        : 'Email sending failed. Use the verification_link above to verify your account. Check server logs for email error details.';
    }
    
    // Include error details in development
    if (isDevelopment) {
      if (tokenError) {
        responseData.token_error = {
          message: tokenError.message || 'Verification token creation failed',
          status: tokenError.status,
        };
      }
      if (emailError) {
        responseData.email_error = {
          message: emailError.message,
          details: emailError.response || emailError.stack,
        };
      }
    }
    
    return NextResponse.json(responseData, { status: 201 });
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

