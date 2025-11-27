import { NextRequest, NextResponse } from 'next/server';

/**
 * Logout endpoint - clears the authentication cookie
 */
export async function POST(request: NextRequest) {
  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  });

  // Clear the cookie
  response.cookies.set('directus_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  return response;
}

