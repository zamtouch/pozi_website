import { NextRequest, NextResponse } from 'next/server';
import { httpJson } from '@/lib/auth-utils/http';
import { config } from '@/lib/config';

/**
 * Get universities
 * GET /api/universities
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🏫 Fetching universities from Directus...');

    const universitiesResponse = await httpJson(
      'GET',
      `${config.directus.url}/items/universities`,
      null,
      [`Authorization: Bearer ${config.directus.token}`]
    );

    if (universitiesResponse.status < 200 || universitiesResponse.status >= 300) {
      console.error('❌ Failed to fetch universities:', universitiesResponse.status);
      return NextResponse.json(
        { error: 'Failed to fetch universities' },
        { status: universitiesResponse.status }
      );
    }

    const universitiesData = JSON.parse(universitiesResponse.body);
    const universities = universitiesData.data || [];

    console.log(`✅ Fetched ${universities.length} universities`);

    return NextResponse.json({
      success: true,
      universities: universities,
    });
  } catch (error: any) {
    console.error('Error fetching universities:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

