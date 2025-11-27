import { NextRequest, NextResponse } from 'next/server';
import { httpJson } from '@/lib/auth-utils/http';
import { config } from '@/lib/config';
import { getAuthToken } from '@/lib/auth-utils/server-auth';

/**
 * Get user's favorites
 * GET /api/favorites
 */
export async function GET(request: NextRequest) {
  try {
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

    // Get user ID from token
    const meResponse = await fetch(`${config.directus.url}/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!meResponse.ok) {
      return NextResponse.json(
        { error: 'Unauthorized - Could not verify user' },
        { status: 401 }
      );
    }
    
    const meData = await meResponse.json();
    const userId = meData.data?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - User ID not found' },
        { status: 401 }
      );
    }

    // Fetch user's favorites with property details
    // Try 'student' field first (consistent with applications), fallback to 'user' if needed
    let favoritesParams = new URLSearchParams();
    favoritesParams.append('filter[student][_eq]', userId);
    favoritesParams.append('fields', 'id,property.*,property.featured_image.*,property.university.*');
    
    let favoritesResponse = await httpJson(
      'GET',
      `${config.directus.url}/items/favorites?${favoritesParams.toString()}`,
      null,
      [`Authorization: Bearer ${config.directus.token}`]
    );

    // If 'student' field doesn't exist, try 'user' field
    if (favoritesResponse.status >= 400) {
      let errorData: { errors?: Array<{ message?: string }> } = {};
      try {
        errorData = JSON.parse(favoritesResponse.body);
      } catch (e) {
        errorData = { errors: [{ message: favoritesResponse.body }] };
      }
      const errorMessage = errorData.errors?.[0]?.message || '';
      
      if (errorMessage.includes('student') && errorMessage.includes('does not exist')) {
        console.log('⚠️ "student" field not found, trying "user" field...');
        favoritesParams = new URLSearchParams();
        favoritesParams.append('filter[user][_eq]', userId);
        favoritesParams.append('fields', 'id,property.*,property.featured_image.*,property.university.*');
        
        favoritesResponse = await httpJson(
          'GET',
          `${config.directus.url}/items/favorites?${favoritesParams.toString()}`,
          null,
          [`Authorization: Bearer ${config.directus.token}`]
        );
      }
    }

    if (favoritesResponse.status < 200 || favoritesResponse.status >= 300) {
      let errorData: { errors?: Array<{ message?: string }> } = {};
      try {
        errorData = JSON.parse(favoritesResponse.body);
      } catch (e) {
        errorData = { errors: [{ message: favoritesResponse.body }] };
      }
      console.error('❌ Failed to fetch favorites:', errorData);
      
      // If field doesn't exist, return empty array (collection might not be set up yet)
      const errorMessage = errorData.errors?.[0]?.message || '';
      if (errorMessage.includes('permission') || errorMessage.includes('does not exist')) {
        console.warn('⚠️ Favorites collection may not be set up. Returning empty array.');
        return NextResponse.json({
          success: true,
          favorites: [],
          propertyIds: [],
          properties: [],
        });
      }
      
      return NextResponse.json(
        { error: errorMessage || 'Failed to fetch favorites' },
        { status: favoritesResponse.status }
      );
    }

    const favoritesData = JSON.parse(favoritesResponse.body);
    const favorites = favoritesData.data || [];

    // Extract property IDs and properties
    const propertyIds: number[] = [];
    const properties: any[] = [];
    
    favorites.forEach((fav: any) => {
      const property = typeof fav.property === 'object' ? fav.property : null;
      if (property && property.id) {
        propertyIds.push(property.id);
        properties.push({
          ...property,
          favoriteId: fav.id,
        });
      }
    });

    return NextResponse.json({
      success: true,
      favorites: favorites,
      propertyIds: propertyIds,
      properties: properties,
    });
  } catch (error: any) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

/**
 * Add a property to favorites
 * POST /api/favorites
 * Body: { property_id }
 */
export async function POST(request: NextRequest) {
  try {
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

    // Get user ID from token
    const meResponse = await fetch(`${config.directus.url}/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!meResponse.ok) {
      return NextResponse.json(
        { error: 'Unauthorized - Could not verify user' },
        { status: 401 }
      );
    }
    
    const meData = await meResponse.json();
    const userId = meData.data?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - User ID not found' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { property_id } = body;

    if (!property_id) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      );
    }

    // Verify property exists before creating favorite
    const propertyParams = new URLSearchParams();
    propertyParams.append('filter[id][_eq]', property_id.toString());
    propertyParams.append('fields', 'id,title');
    
    const propertyResponse = await httpJson(
      'GET',
      `${config.directus.url}/items/properties?${propertyParams.toString()}`,
      null,
      [`Authorization: Bearer ${config.directus.token}`]
    );

    if (propertyResponse.status < 200 || propertyResponse.status >= 300) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    const propertyData = JSON.parse(propertyResponse.body);
    const properties = propertyData.data || [];

    if (properties.length === 0) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    const property = properties[0];
    console.log('✅ Property verified:', property.id, property.title);

    // Check if favorite already exists - try 'student' first, then 'user'
    let checkParams = new URLSearchParams();
    checkParams.append('filter[student][_eq]', userId);
    checkParams.append('filter[property][_eq]', property_id.toString());
    checkParams.append('fields', 'id');
    
    let checkResponse = await httpJson(
      'GET',
      `${config.directus.url}/items/favorites?${checkParams.toString()}`,
      null,
      [`Authorization: Bearer ${config.directus.token}`]
    );

    // If 'student' field doesn't exist, try 'user'
    if (checkResponse.status >= 400) {
      let errorData: { errors?: Array<{ message?: string }> } = {};
      try {
        errorData = JSON.parse(checkResponse.body);
      } catch (e) {
        errorData = { errors: [{ message: checkResponse.body }] };
      }
      const errorMessage = errorData.errors?.[0]?.message || '';
      
      if (errorMessage.includes('student') && errorMessage.includes('does not exist')) {
        console.log('⚠️ "student" field not found, trying "user" field...');
        checkParams = new URLSearchParams();
        checkParams.append('filter[user][_eq]', userId);
        checkParams.append('filter[property][_eq]', property_id.toString());
        checkParams.append('fields', 'id');
        
        checkResponse = await httpJson(
          'GET',
          `${config.directus.url}/items/favorites?${checkParams.toString()}`,
          null,
          [`Authorization: Bearer ${config.directus.token}`]
        );
      }
    }

    if (checkResponse.status >= 200 && checkResponse.status < 300) {
      const checkData = JSON.parse(checkResponse.body);
      if (checkData.data && checkData.data.length > 0) {
        return NextResponse.json({
          success: true,
          message: 'Property is already in favorites',
          favorite: checkData.data[0],
        });
      }
    }

    // Determine which field name to use - try 'student' first, fallback to 'user'
    const useStudentField = checkResponse.status < 400 || !checkParams.toString().includes('filter[user]');
    
    // Create favorite - try 'student' first, fallback to 'user' if needed
    // Use the property ID from the verified property (handles both integer and string)
    const propertyIdValue = typeof property.id === 'number' ? property.id : parseInt(property_id);
    
    let favoriteData: any = {
      property: propertyIdValue,
    };
    
    if (useStudentField) {
      favoriteData.student = userId;
    } else {
      favoriteData.user = userId;
    }

    console.log('📝 Creating favorite with data:', { ...favoriteData, [useStudentField ? 'student' : 'user']: '***' });

    let createResponse = await httpJson(
      'POST',
      `${config.directus.url}/items/favorites`,
      favoriteData,
      [`Authorization: Bearer ${config.directus.token}`]
    );

    // If 'student' failed, try 'user'
    if (createResponse.status >= 400 && useStudentField) {
      let errorData: { errors?: Array<{ message?: string }> } = {};
      try {
        errorData = JSON.parse(createResponse.body);
      } catch (e) {
        errorData = { errors: [{ message: createResponse.body }] };
      }
      const errorMessage = errorData.errors?.[0]?.message || '';
      
        if (errorMessage.includes('student') || errorMessage.includes('does not exist') || errorMessage.includes('permission')) {
          console.log('⚠️ "student" field failed, trying "user" field for creation...');
          favoriteData = {
            user: userId,
            property: propertyIdValue,
          };
        
        createResponse = await httpJson(
          'POST',
          `${config.directus.url}/items/favorites`,
          favoriteData,
          [`Authorization: Bearer ${config.directus.token}`]
        );
      }
    }

    if (createResponse.status < 200 || createResponse.status >= 300) {
      let errorData: { errors?: Array<{ message?: string }> } = {};
      try {
        errorData = JSON.parse(createResponse.body);
      } catch (e) {
        errorData = { errors: [{ message: createResponse.body || 'Unknown error' }] };
      }
      console.error('❌ Failed to create favorite:', errorData);
      console.error('❌ Response status:', createResponse.status);
      console.error('❌ Response body:', createResponse.body);
      return NextResponse.json(
        { error: errorData.errors?.[0]?.message || 'Failed to add to favorites. Please ensure the favorites collection exists in Directus.' },
        { status: createResponse.status }
      );
    }

    const createdFavorite = JSON.parse(createResponse.body);
    console.log('✅ Favorite created successfully:', createdFavorite.data.id);

    return NextResponse.json({
      success: true,
      message: 'Property added to favorites',
      favorite: createdFavorite.data,
    });
  } catch (error: any) {
    console.error('Error adding favorite:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return NextResponse.json(
      { error: 'Internal server error: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}

/**
 * Remove a property from favorites
 * DELETE /api/favorites?property_id={propertyId}
 */
export async function DELETE(request: NextRequest) {
  try {
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

    // Get user ID from token
    const meResponse = await fetch(`${config.directus.url}/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!meResponse.ok) {
      return NextResponse.json(
        { error: 'Unauthorized - Could not verify user' },
        { status: 401 }
      );
    }
    
    const meData = await meResponse.json();
    const userId = meData.data?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - User ID not found' },
        { status: 401 }
      );
    }

    // Get property ID from query parameters
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('property_id');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      );
    }

    // Find the favorite to delete
    const findParams = new URLSearchParams();
    findParams.append('filter[student][_eq]', userId);
    findParams.append('filter[property][_eq]', propertyId);
    findParams.append('fields', 'id');
    
    const findResponse = await httpJson(
      'GET',
      `${config.directus.url}/items/favorites?${findParams.toString()}`,
      null,
      [`Authorization: Bearer ${config.directus.token}`]
    );

    if (findResponse.status < 200 || findResponse.status >= 300) {
      return NextResponse.json(
        { error: 'Favorite not found' },
        { status: 404 }
      );
    }

    const findData = JSON.parse(findResponse.body);
    const favorites = findData.data || [];

    if (favorites.length === 0) {
      return NextResponse.json(
        { error: 'Favorite not found' },
        { status: 404 }
      );
    }

    const favoriteId = favorites[0].id;

    // Delete the favorite
    const deleteResponse = await httpJson(
      'DELETE',
      `${config.directus.url}/items/favorites/${favoriteId}`,
      null,
      [`Authorization: Bearer ${config.directus.token}`]
    );

    if (deleteResponse.status < 200 || deleteResponse.status >= 300) {
      const errorData = JSON.parse(deleteResponse.body);
      console.error('❌ Failed to delete favorite:', errorData);
      return NextResponse.json(
        { error: errorData.errors?.[0]?.message || 'Failed to remove from favorites' },
        { status: deleteResponse.status }
      );
    }

    console.log('✅ Favorite deleted successfully');

    return NextResponse.json({
      success: true,
      message: 'Property removed from favorites',
    });
  } catch (error: any) {
    console.error('Error removing favorite:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

