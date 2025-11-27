import { NextRequest, NextResponse } from 'next/server';
import { httpJson } from '@/lib/auth-utils/http';
import { config } from '@/lib/config';

/**
 * Get team members from Directus
 * GET /api/team
 */
export async function GET(request: NextRequest) {
  try {
    // Fetch team members from Directus
    // Only fetch published team members, sorted by order
    const teamParams = new URLSearchParams();
    teamParams.append('filter[status][_eq]', 'published');
    teamParams.append('fields', '*,image.*');
    teamParams.append('sort', 'order');
    
    const teamResponse = await httpJson(
      'GET',
      `${config.directus.url}/items/team?${teamParams.toString()}`,
      null,
      [`Authorization: Bearer ${config.directus.token}`]
    );

    if (teamResponse.status < 200 || teamResponse.status >= 300) {
      const errorData = JSON.parse(teamResponse.body);
      console.error('❌ Failed to fetch team:', errorData);
      return NextResponse.json(
        { error: errorData.errors?.[0]?.message || 'Failed to fetch team members' },
        { status: teamResponse.status }
      );
    }

    const teamData = JSON.parse(teamResponse.body);
    
    // Return team members
    return NextResponse.json({
      success: true,
      data: teamData.data || [],
    });
  } catch (error: any) {
    console.error('Error fetching team:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

