import { NextRequest, NextResponse } from 'next/server';
import { httpJson } from '@/lib/auth-utils/http';
import { tokenHash, nowIso } from '@/lib/auth-utils/crypto';
import { config } from '@/lib/config';

async function verifyTokenAndActivate(token: string): Promise<{ success: boolean; userId: string | null; message: string }> {
  try {
    const hash = tokenHash(token);
    const now = nowIso();

    const filterParams = new URLSearchParams();
    filterParams.append('filter[token_hash][_eq]', hash);
    filterParams.append('filter[used][_eq]', 'false');
    filterParams.append('filter[purpose][_eq]', 'email_verify');
    filterParams.append('limit', '1');
    const filter = filterParams.toString();

    const tokenResponse = await httpJson(
      'GET',
      `${config.directus.url}/items/verification_tokens?${filter}`,
      null,
      [`Authorization: Bearer ${config.directus.token}`]
    );

    if (tokenResponse.status < 200 || tokenResponse.status >= 300) {
      return { success: false, userId: null, message: 'Invalid or expired verification token' };
    }

    const data = JSON.parse(tokenResponse.body).data || [];
    if (data.length === 0) {
      return { success: false, userId: null, message: 'Invalid or expired verification token' };
    }

    const tokenRow = data[0];
    const userId = tokenRow.user;

    if (!userId) {
      return { success: false, userId: null, message: 'Token not linked to a user' };
    }

    if (tokenRow.expires_at && tokenRow.expires_at <= now) {
      return { success: false, userId: null, message: 'Verification token has expired' };
    }

    // Activate user account
    const updateResponse = await httpJson(
      'PATCH',
      `${config.directus.url}/users/${encodeURIComponent(userId)}`,
      { status: 'active' },
      [`Authorization: Bearer ${config.directus.token}`]
    );

    if (updateResponse.status < 200 || updateResponse.status >= 300) {
      return { success: false, userId: null, message: 'Could not activate user account' };
    }

    // Update profile status if exists (optional, fail silently)
    try {
      await httpJson(
        'PATCH',
        `${config.directus.url}/items/profiles`,
        {
          keys: [{ user: userId }],
          data: [{ status: 'verified' }],
        },
        [`Authorization: Bearer ${config.directus.token}`]
      );
    } catch (e) {
      // Ignore profile update errors
    }

    // Mark token as used
    await httpJson(
      'PATCH',
      `${config.directus.url}/items/verification_tokens/${encodeURIComponent(tokenRow.id)}`,
      { used: true, used_at: nowIso() },
      [`Authorization: Bearer ${config.directus.token}`]
    );

    return { success: true, userId, message: 'Account verified successfully' };
  } catch (error: any) {
    return { success: false, userId: null, message: 'Internal server error: ' + error.message };
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('t') || searchParams.get('token');

  if (!token) {
    // Redirect to error page
    return NextResponse.redirect(new URL('/auth/verify?error=missing_token', request.url));
  }

  const result = await verifyTokenAndActivate(token);
  
  if (result.success) {
    return NextResponse.redirect(new URL('/auth/verify?success=true', request.url));
  } else {
    return NextResponse.redirect(new URL(`/auth/verify?error=${encodeURIComponent(result.message)}`, request.url));
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Missing verification token' },
        { status: 400 }
      );
    }

    const result = await verifyTokenAndActivate(token);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        user_id: result.userId,
      });
    } else {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Verify error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

