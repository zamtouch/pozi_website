import { NextRequest, NextResponse } from 'next/server';
import { httpJson } from '@/lib/auth-utils/http';
import { generateTokenPlain, tokenHash, addMinutesIso, nowIso } from '@/lib/auth-utils/crypto';
import { sendgridSendPasswordResetEmail } from '@/lib/auth-utils/sendgrid';
import { config } from '@/lib/config';

const TOKEN_EXPIRY_MINUTES = parseInt(process.env.TOKEN_EXPIRY_MINUTES || '1440', 10);
const PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.PUBLIC_APP_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // 1) Check if user exists in Directus
    const filterParams = new URLSearchParams();
    filterParams.append('filter[email][_eq]', email);
    filterParams.append('limit', '1');
    const filter = filterParams.toString();

    const userResponse = await httpJson(
      'GET',
      `${config.directus.url}/users?${filter}`,
      null,
      [`Authorization: Bearer ${config.directus.token}`]
    );

    if (userResponse.status < 200 || userResponse.status >= 300) {
      // Always respond with success to avoid leaking account existence
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent',
      });
    }

    const users = JSON.parse(userResponse.body).data || [];
    if (users.length === 0) {
      // Always respond with success to avoid leaking account existence
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent',
      });
    }

    const user = users[0];
    const userId = user.id;
    const firstName = user.first_name || null;

    // 2) Invalidate existing password reset tokens for this user
    const existingFilterParams = new URLSearchParams();
    existingFilterParams.append('filter[user][_eq]', userId);
    existingFilterParams.append('filter[purpose][_eq]', 'password_reset');
    existingFilterParams.append('filter[used][_eq]', 'false');
    const existingFilter = existingFilterParams.toString();

    const existingResponse = await httpJson(
      'GET',
      `${config.directus.url}/items/verification_tokens?${existingFilter}`,
      null,
      [`Authorization: Bearer ${config.directus.token}`]
    );

    if (existingResponse.status === 200) {
      const existingTokens = JSON.parse(existingResponse.body).data || [];
      for (const tokenRow of existingTokens) {
        await httpJson(
          'PATCH',
          `${config.directus.url}/items/verification_tokens/${encodeURIComponent(tokenRow.id)}`,
          { used: true, used_at: nowIso() },
          [`Authorization: Bearer ${config.directus.token}`]
        );
      }
    }

    // 3) Create new password reset token
    const plainToken = generateTokenPlain();
    const hash = tokenHash(plainToken);
    const expires = addMinutesIso(TOKEN_EXPIRY_MINUTES);

    const tokenResponse = await httpJson(
      'POST',
      `${config.directus.url}/items/verification_tokens`,
      {
        user: userId,
        token_hash: hash,
        purpose: 'password_reset',
        expires_at: expires,
        used: false,
      },
      [`Authorization: Bearer ${config.directus.token}`]
    );

    if (tokenResponse.status < 200 || tokenResponse.status >= 300) {
      return NextResponse.json(
        { error: 'Could not create password reset token' },
        { status: 500 }
      );
    }

    // 4) Send password reset email
    const resetLink = `${PUBLIC_APP_URL}/auth/reset-password?t=${encodeURIComponent(plainToken)}`;
    
    // Check SendGrid configuration before attempting to send
    const sendGridConfig = {
      apiKey: process.env.SENDGRID_API_KEY ? '***' : 'MISSING (REQUIRED)',
      fromEmail: process.env.SENDGRID_FROM_EMAIL || 'no-reply@pozi.com (default)',
      fromName: process.env.SENDGRID_FROM_NAME || 'Pozi Student Living (default)',
      templateId: process.env.SENDGRID_PASSWORD_RESET_TEMPLATE_ID || 'MISSING (REQUIRED)',
    };
    
    console.log('SendGrid password reset configuration check:', sendGridConfig);
    
    if (!process.env.SENDGRID_API_KEY) {
      console.warn('⚠️  WARNING: SENDGRID_API_KEY is missing. Email sending will fail.');
    }
    
    try {
      const emailResult = await sendgridSendPasswordResetEmail(email, firstName, resetLink);
      console.log('Password reset email sent successfully:', {
        to: email,
        messageId: emailResult.messageId,
        status: emailResult.status,
      });
    } catch (emailError: any) {
      // Log detailed error for debugging
      console.error('SendGrid password reset email sending failed:', {
        error: emailError.message,
        stack: emailError.stack,
        to: email,
        resetLink: resetLink.substring(0, 50) + '...',
        config: sendGridConfig,
      });
      // Do not expose error to client - always return success message
    }

    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent',
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

