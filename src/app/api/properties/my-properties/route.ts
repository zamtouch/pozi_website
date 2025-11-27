import { NextRequest, NextResponse } from 'next/server';
import { httpJson } from '@/lib/auth-utils/http';
import { config } from '@/lib/config';
import { getAuthToken } from '@/lib/auth-utils/server-auth';

/**
 * Get properties owned by the currently authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Get token from cookie first
    let token = getAuthToken(request);
    
    // If no token in cookie, try to get from Authorization header
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
        console.log('🔍 Token found in Authorization header');
      }
    }
    
    console.log('🔍 My Properties API - Token present:', !!token);
    
    if (!token) {
      console.log('❌ No token in cookie or header');
      return NextResponse.json(
        { error: 'Unauthorized - No token found' },
        { status: 401 }
      );
    }

    // Use the token directly to authenticate with Directus
    // First, try to get current user info using the token as access_token
    console.log('🔍 Getting current user info using token...');
    
    let userId: string | null = null;
    
    // Try using /users/me endpoint with the token
    const meParams = new URLSearchParams();
    meParams.append('access_token', token);
    meParams.append('fields', 'id,email,first_name,last_name');
    
    const meResponse = await httpJson(
      'GET',
      `${config.directus.url}/users/me?${meParams.toString()}`,
      null,
      []
    );

    console.log('🔍 /users/me response status:', meResponse.status);

    if (meResponse.status >= 200 && meResponse.status < 300) {
      const meData = JSON.parse(meResponse.body);
      if (meData.data && meData.data.id) {
        userId = meData.data.id;
        console.log('✅ User authenticated via /users/me:', userId, meData.data.email);
      }
    } else {
      // Fallback: Try to find user by token field using admin token
      console.log('⚠️ /users/me failed, trying to find user by token field...');
      const filterParams = new URLSearchParams();
      filterParams.append('filter[token][_eq]', token);
      filterParams.append('fields', 'id,email,first_name,last_name');
      filterParams.append('limit', '1');
      
      const userResponse = await httpJson(
        'GET',
        `${config.directus.url}/users?${filterParams.toString()}`,
        null,
        [`Authorization: Bearer ${config.directus.token}`]
      );

      if (userResponse.status >= 200 && userResponse.status < 300) {
        const userData = JSON.parse(userResponse.body);
        const users = userData.data || [];
        if (users.length > 0) {
          userId = users[0].id;
          console.log('✅ User found by token field:', userId, users[0].email);
        }
      }
    }

    if (!userId) {
      console.log('⚠️ Could not get userId, will fetch properties and filter by owner.token');
    }

    // Fetch properties using the user's token directly
    // Directus will automatically filter based on permissions when using access_token
    const propertiesParams = new URLSearchParams();
    
    // Use access_token parameter - Directus will authenticate and apply permissions
    propertiesParams.append('access_token', token);
    
    if (userId) {
      // Filter by owner ID if we have it (preferred method)
      propertiesParams.append('filter[owner][_eq]', userId);
      console.log('🔍 Fetching properties for user ID:', userId);
    } else {
      // No owner filter - Directus will return based on permissions
      console.log('⚠️ Fetching properties without owner filter (using token permissions)');
    }
    
    // Always include owner.token in fields so we can filter if needed
    propertiesParams.append('fields', '*,featured_image.*,image_1.*,image_2.*,image_3.*,image_4.*,lease_agreement.*,university.*,owner.id,owner.first_name,owner.last_name,owner.email,owner.token');
    propertiesParams.append('sort', '-date_created');
    
    console.log('🔍 Fetching properties with access_token...');
    const propertiesResponse = await httpJson(
      'GET',
      `${config.directus.url}/items/properties?${propertiesParams.toString()}`,
      null,
      [] // No Authorization header needed when using access_token parameter
    );

    console.log('🔍 Properties query response status:', propertiesResponse.status);

    if (propertiesResponse.status < 200 || propertiesResponse.status >= 300) {
      let errorMessage = 'Failed to fetch properties';
      try {
        const errorData = JSON.parse(propertiesResponse.body);
        errorMessage = errorData.errors?.[0]?.message || errorMessage;
        console.error('❌ Failed to fetch properties:', {
          status: propertiesResponse.status,
          error: errorMessage,
          body: propertiesResponse.body.substring(0, 500),
        });
      } catch (e) {
        console.error('❌ Failed to parse error response:', propertiesResponse.body.substring(0, 500));
      }
      
      // If filtering failed and we don't have userId, return error
      if (!userId) {
        return NextResponse.json(
          { 
            error: 'Failed to authenticate user and fetch properties',
            details: errorMessage,
          },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: propertiesResponse.status }
      );
    }

    const propertiesData = JSON.parse(propertiesResponse.body);
    let properties = propertiesData.data || [];
    
    // If we couldn't filter by userId, filter client-side by owner.token
    if (!userId) {
      console.log('🔍 Filtering properties by owner.token client-side...');
      console.log('🔍 Token to match:', token.substring(0, 10) + '...');
      console.log('🔍 Total properties before filter:', properties.length);
      
      properties = properties.filter((prop: any) => {
        const ownerToken = prop.owner?.token;
        const matches = ownerToken === token;
        if (prop.owner && properties.length <= 20) { // Only log if not too many
          console.log(`  Property ${prop.id} (${prop.title}): owner.id = ${prop.owner.id}, owner.token = ${ownerToken ? ownerToken.substring(0, 10) + '...' : 'null'}, matches: ${matches}`);
        }
        return matches;
      });
      console.log('✅ Filtered properties:', properties.length);
    }
    
    console.log('✅ Properties found:', properties.length);
    
    return NextResponse.json({
      success: true,
      properties: properties,
      count: properties.length,
    });
  } catch (error: any) {
    console.error('Error fetching properties:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

