import { NextRequest, NextResponse } from 'next/server';
import { httpJson } from '@/lib/auth-utils/http';
import { config } from '@/lib/config';
import { getAuthToken } from '@/lib/auth-utils/server-auth';

/**
 * Get defaults (collexia form, etc.)
 * GET /api/defaults
 */
export async function GET(request: NextRequest) {
  try {
    // Fetch defaults from Directus
    // Use admin token since defaults might be a system collection
    // This ensures we can always fetch defaults regardless of user permissions
    const defaultsResponse = await httpJson(
      'GET',
      `${config.directus.url}/items/defaults`,
      null,
      [`Authorization: Bearer ${config.directus.token}`]
    );

    if (defaultsResponse.status < 200 || defaultsResponse.status >= 300) {
      const errorData = JSON.parse(defaultsResponse.body);
      console.error('❌ Failed to fetch defaults:', errorData);
      return NextResponse.json(
        { error: errorData.errors?.[0]?.message || 'Failed to fetch defaults' },
        { status: defaultsResponse.status }
      );
    }

    const defaultsData = JSON.parse(defaultsResponse.body);
    console.log('📋 Raw defaults response from Directus:', JSON.stringify(defaultsData, null, 2));
    
    // Handle both array and single object responses
    let defaults = null;
    if (Array.isArray(defaultsData.data)) {
      console.log('📋 Defaults is an array, length:', defaultsData.data.length);
      defaults = defaultsData.data.length > 0 ? defaultsData.data[0] : null;
    } else {
      console.log('📋 Defaults is a single object');
      defaults = defaultsData.data || null;
    }

    console.log('📋 Processed defaults:', JSON.stringify(defaults, null, 2));
    console.log('📋 Collexia form ID:', defaults?.collexia_form);

    // Return the defaults entry (or empty if none)
    return NextResponse.json({
      success: true,
      data: defaults,
    });
  } catch (error: any) {
    console.error('Error fetching defaults:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

