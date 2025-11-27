import { NextRequest, NextResponse } from 'next/server';
import { httpJson } from '@/lib/auth-utils/http';
import { config } from '@/lib/config';
import { getAuthToken } from '@/lib/auth-utils/server-auth';

/**
 * Get properties with optional filters
 * GET /api/properties?search=...&university=...&minPrice=...&maxPrice=...&rooms=...&featured=1
 */
export async function GET(request: NextRequest) {
  try {
    if (!config.directus.url || !config.directus.token) {
      console.error('Directus configuration missing');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const university = searchParams.get('university');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const rooms = searchParams.get('rooms');
    const featured = searchParams.get('featured');
    const limit = searchParams.get('limit');

    // Build Directus query parameters
    const propertiesParams = new URLSearchParams();
    propertiesParams.append('filter[approved][_eq]', '1'); // Only show approved properties
    propertiesParams.append('fields', '*,featured_image.*,image_1.*,image_2.*,image_3.*,image_4.*,university.*');
    propertiesParams.append('sort', '-date_created');

    // Add featured filter if requested
    if (featured === '1' || featured === 'true') {
      propertiesParams.append('filter[featured][_eq]', '1');
    }

    // Add search filter
    if (search) {
      propertiesParams.append('filter[_or][0][title][_contains]', search);
      propertiesParams.append('filter[_or][1][address][_contains]', search);
      propertiesParams.append('filter[_or][2][description][_contains]', search);
    }

    // Add university filter - handle both ID and slug
    if (university) {
      // Check if it's a numeric ID or a slug
      const isNumericId = /^\d+$/.test(university);
      if (isNumericId) {
        propertiesParams.append('filter[university][_eq]', university);
      } else {
        // It's a slug, need to look up the university ID
        try {
          const universityResponse = await httpJson(
            'GET',
            `${config.directus.url}/items/universities?filter[slug][_eq]=${encodeURIComponent(university)}&fields=id`,
            null,
            [`Authorization: Bearer ${config.directus.token}`]
          );
          if (universityResponse.status >= 200 && universityResponse.status < 300) {
            const universityData = JSON.parse(universityResponse.body);
            if (universityData.data && universityData.data.length > 0) {
              const universityId = universityData.data[0].id;
              propertiesParams.append('filter[university][_eq]', universityId.toString());
            }
          }
        } catch (error) {
          console.error('Error fetching university ID from slug:', error);
        }
      }
    }

    // Add price filters
    if (minPrice) {
      propertiesParams.append('filter[price_per_month][_gte]', minPrice);
    }
    if (maxPrice) {
      propertiesParams.append('filter[price_per_month][_lte]', maxPrice);
    }

    // Add rooms filter
    if (rooms) {
      propertiesParams.append('filter[rooms_available][_gte]', rooms);
    }

    // Set limit if provided, or default to 5 for featured
    if (limit) {
      propertiesParams.append('limit', limit);
    } else if (featured === '1' || featured === 'true') {
      propertiesParams.append('limit', '5');
    }

    console.log('🔍 Fetching properties from Directus...');
    const propertiesResponse = await httpJson(
      'GET',
      `${config.directus.url}/items/properties?${propertiesParams.toString()}`,
      null,
      [`Authorization: Bearer ${config.directus.token}`]
    );

    if (propertiesResponse.status < 200 || propertiesResponse.status >= 300) {
      console.error('❌ Failed to fetch properties:', propertiesResponse.status);
      return NextResponse.json(
        { error: 'Failed to fetch properties' },
        { status: propertiesResponse.status }
      );
    }

    const propertiesData = JSON.parse(propertiesResponse.body);
    const properties = propertiesData.data || [];

    console.log(`✅ Fetched ${properties.length} properties`);

    return NextResponse.json({
      success: true,
      properties: properties,
    });
  } catch (error: any) {
    console.error('Error fetching properties:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

/**
 * Create a new property
 * POST /api/properties
 * Body: Property data (title, description, price_per_month, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📝 Creating new property...');
    
    // Get token from cookie or Authorization header
    let token = getAuthToken(request);
    
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token found' },
        { status: 401 }
      );
    }

    // Get the current user's ID
    const meParams = new URLSearchParams();
    meParams.append('fields', 'id');
    
    const meResponse = await httpJson(
      'GET',
      `${config.directus.url}/users/me?${meParams.toString()}`,
      null,
      [`Authorization: Bearer ${token}`]
    );

    if (meResponse.status < 200 || meResponse.status >= 300) {
      console.error('❌ Failed to get user ID:', meResponse.status);
      return NextResponse.json(
        { error: 'Unauthorized - Could not verify user identity' },
        { status: 401 }
      );
    }

    const meData = JSON.parse(meResponse.body);
    const userId = meData.data?.id;

    if (!userId) {
      console.error('❌ User ID not found in response');
      return NextResponse.json(
        { error: 'Unauthorized - User ID not found' },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', userId);

    // Parse request body
    const body = await request.json();
    console.log('📝 Property data received:', Object.keys(body));

    // Prepare property data
    const propertyData: any = {
      title: body.title,
      description: body.description,
      price_per_month: parseFloat(body.price_per_month) || 0,
      currency: body.currency || 'ZMW',
      address: body.address,
      rooms_available: parseInt(body.rooms_available) || 0,
      total_rooms: parseInt(body.total_rooms) || 0,
      amenities: Array.isArray(body.amenities) ? body.amenities : [],
      owner: userId, // Set owner to current user
      approved: 0, // New properties start as unapproved
      featured: 0, // New properties are not featured by default
    };

    // Add optional fields
    if (body.distance_from_campus) {
      propertyData.distance_from_campus = parseInt(body.distance_from_campus);
    }
    if (body.latitude) {
      propertyData.latitude = body.latitude;
    }
    if (body.longitude) {
      propertyData.longitude = body.longitude;
    }
    if (body.university) {
      propertyData.university = parseInt(body.university);
    }

    // Add image fields if provided
    if (body.featured_image) {
      propertyData.featured_image = body.featured_image;
    }
    if (body.image_1) {
      propertyData.image_1 = body.image_1;
    }
    if (body.image_2) {
      propertyData.image_2 = body.image_2;
    }
    if (body.image_3) {
      propertyData.image_3 = body.image_3;
    }
    if (body.image_4) {
      propertyData.image_4 = body.image_4;
    }

    console.log('📤 Creating property in Directus...');

    // Create the property using admin token (user token might not have create permissions)
    const createResponse = await httpJson(
      'POST',
      `${config.directus.url}/items/properties`,
      propertyData,
      [`Authorization: Bearer ${config.directus.token}`]
    );

    console.log('🔍 Create response status:', createResponse.status);

    if (createResponse.status < 200 || createResponse.status >= 300) {
      let errorMessage = 'Failed to create property';
      try {
        const errorData = JSON.parse(createResponse.body);
        errorMessage = errorData.errors?.[0]?.message || errorMessage;
        console.error('❌ Directus create error:', {
          status: createResponse.status,
          error: errorMessage,
          body: createResponse.body.substring(0, 500),
        });
      } catch (e) {
        console.error('❌ Failed to parse error response:', createResponse.body.substring(0, 500));
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: createResponse.status }
      );
    }

    const createData = JSON.parse(createResponse.body);
    const newProperty = createData.data;

    console.log('✅ Property created successfully:', newProperty.id);

    return NextResponse.json({
      success: true,
      property: newProperty,
      message: 'Property created successfully',
    });
  } catch (error: any) {
    console.error('Error creating property:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

