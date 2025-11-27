import { NextRequest, NextResponse } from 'next/server';
import { httpJson } from '@/lib/auth-utils/http';
import { tokenHash, nowIso } from '@/lib/auth-utils/crypto';
import { config } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password, confirm_password } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Missing reset token' },
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

    // Hash token and look up in DB
    const hash = tokenHash(token);
    const now = nowIso();

    const filterParams = new URLSearchParams();
    filterParams.append('filter[token_hash][_eq]', hash);
    filterParams.append('filter[used][_eq]', 'false');
    filterParams.append('filter[purpose][_eq]', 'password_reset');
    filterParams.append('limit', '1');
    const filter = filterParams.toString();

    const tokenResponse = await httpJson(
      'GET',
      `${config.directus.url}/items/verification_tokens?${filter}`,
      null,
      [`Authorization: Bearer ${config.directus.token}`]
    );

    if (tokenResponse.status < 200 || tokenResponse.status >= 300) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    const data = JSON.parse(tokenResponse.body).data || [];
    if (data.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    const tokenRow = data[0];
    const userId = tokenRow.user;

    if (!userId) {
      return NextResponse.json(
        { error: 'Token not linked to a user' },
        { status: 400 }
      );
    }

    // Check expiry
    if (tokenRow.expires_at && tokenRow.expires_at <= now) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // 1) Update user password
    const updateResponse = await httpJson(
      'PATCH',
      `${config.directus.url}/users/${encodeURIComponent(userId)}`,
      { password },
      [`Authorization: Bearer ${config.directus.token}`]
    );

    if (updateResponse.status < 200 || updateResponse.status >= 300) {
      return NextResponse.json(
        { error: 'Could not update password' },
        { status: 500 }
      );
    }

    // 2) Mark token as used
    await httpJson(
      'PATCH',
      `${config.directus.url}/items/verification_tokens/${encodeURIComponent(tokenRow.id)}`,
      { used: true, used_at: nowIso() },
      [`Authorization: Bearer ${config.directus.token}`]
    );

    // 3) Invalidate any other reset tokens for this user
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
      for (const row of existingTokens) {
        await httpJson(
          'PATCH',
          `${config.directus.url}/items/verification_tokens/${encodeURIComponent(row.id)}`,
          { used: true, used_at: nowIso() },
          [`Authorization: Bearer ${config.directus.token}`]
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.',
      user_id: userId,
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

