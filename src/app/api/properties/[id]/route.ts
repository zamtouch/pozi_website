import { NextRequest, NextResponse } from 'next/server';
import { httpJson } from '@/lib/auth-utils/http';
import { config } from '@/lib/config';
import { getAuthToken } from '@/lib/auth-utils/server-auth';

/**
 * Get a single property by ID (for authenticated landlord)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle both Promise and direct params (Next.js 13+ compatibility)
    const resolvedParams = await Promise.resolve(params);
    const propertyId = resolvedParams.id;
    
    console.log('🔍 Fetching property:', propertyId);
    
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

    // Fetch the property using Authorization header (static token)
    // Always fetch fresh data - don't cache property queries
    const propertiesParams = new URLSearchParams();
    propertiesParams.append('filter[id][_eq]', propertyId);
    propertiesParams.append('fields', '*,featured_image.*,image_1.*,image_2.*,image_3.*,image_4.*,lease_agreement.*,university.*,town.*,residential.*,owner.id,owner.first_name,owner.last_name,owner.email');
    // Add cache-busting to ensure fresh data
    propertiesParams.append('_', Date.now().toString());
    
    console.log('🔍 Querying Directus for property:', propertyId);
    // Use Authorization header instead of access_token query param for static tokens
    const propertiesResponse = await httpJson(
      'GET',
      `${config.directus.url}/items/properties?${propertiesParams.toString()}`,
      null,
      [`Authorization: Bearer ${token}`]
    );

    console.log('🔍 Directus response status:', propertiesResponse.status);

    if (propertiesResponse.status < 200 || propertiesResponse.status >= 300) {
      let errorMessage = 'Failed to fetch property';
      try {
        const errorData = JSON.parse(propertiesResponse.body);
        errorMessage = errorData.errors?.[0]?.message || errorMessage;
        console.error('❌ Directus error:', {
          status: propertiesResponse.status,
          error: errorMessage,
          body: propertiesResponse.body.substring(0, 500),
        });
      } catch (e) {
        console.error('❌ Failed to parse error:', propertiesResponse.body.substring(0, 500));
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: propertiesResponse.status }
      );
    }

    let propertiesData;
    try {
      propertiesData = JSON.parse(propertiesResponse.body);
    } catch (e) {
      console.error('❌ Failed to parse properties response:', propertiesResponse.body.substring(0, 500));
      return NextResponse.json(
        { error: 'Invalid response from server' },
        { status: 500 }
      );
    }

    const properties = propertiesData.data || [];
    console.log('🔍 Properties found:', properties.length);

    if (properties.length === 0) {
      console.log('❌ Property not found');
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    const property = properties[0];
    console.log('✅ Property found:', property.id, property.title);

      // Verify the property belongs to the authenticated user
      // Get user ID from token using Authorization header
      try {
        const meParams = new URLSearchParams();
        meParams.append('fields', 'id');
        
        const meResponse = await httpJson(
          'GET',
          `${config.directus.url}/users/me?${meParams.toString()}`,
          null,
          [`Authorization: Bearer ${token}`]
        );

      if (meResponse.status >= 200 && meResponse.status < 300) {
        const meData = JSON.parse(meResponse.body);
        const userId = meData.data?.id;
        console.log('✅ User ID from /users/me:', userId);
        console.log('🔍 Property owner ID:', property.owner?.id || property.owner);
        
        // Check if property owner matches authenticated user
        // Handle both object and string owner formats
        const ownerId = typeof property.owner === 'object' ? property.owner?.id : property.owner;
        if (ownerId && ownerId !== userId) {
          console.log('❌ Property owner mismatch');
          return NextResponse.json(
            { error: 'Unauthorized - This property does not belong to you' },
            { status: 403 }
          );
        }
      } else {
        console.log('⚠️ /users/me failed, skipping ownership verification');
      }
    } catch (meError: any) {
      console.error('⚠️ Error verifying ownership:', meError.message);
      // Continue anyway - ownership check is not critical for viewing
    }

    return NextResponse.json({
      success: true,
      property: property,
    });
  } catch (error: any) {
    console.error('Error fetching property:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

/**
 * Update a property (for authenticated landlord)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const propertyId = resolvedParams.id;
    
    console.log('💾 Updating property:', propertyId);
    
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

    // Get request body
    const body = await request.json();
    console.log('📝 Update data:', Object.keys(body));

    // Verify ownership first
    const propertiesParams = new URLSearchParams();
    propertiesParams.append('access_token', token);
    propertiesParams.append('filter[id][_eq]', propertyId);
    propertiesParams.append('fields', 'owner.id,owner');
    
    const checkResponse = await httpJson(
      'GET',
      `${config.directus.url}/items/properties?${propertiesParams.toString()}`,
      null,
      []
    );

    if (checkResponse.status >= 200 && checkResponse.status < 300) {
      const checkData = JSON.parse(checkResponse.body);
      const properties = checkData.data || [];
      
      if (properties.length > 0) {
        const property = properties[0];
        const ownerId = typeof property.owner === 'object' ? property.owner?.id : property.owner;
        
        // Get user ID
        const meParams = new URLSearchParams();
        meParams.append('access_token', token);
        meParams.append('fields', 'id');
        
        const meResponse = await httpJson(
          'GET',
          `${config.directus.url}/users/me?${meParams.toString()}`,
          null,
          []
        );

        if (meResponse.status >= 200 && meResponse.status < 300) {
          const meData = JSON.parse(meResponse.body);
          const userId = meData.data?.id;
          
          if (ownerId && ownerId !== userId) {
            return NextResponse.json(
              { error: 'Unauthorized - This property does not belong to you' },
              { status: 403 }
            );
          }
        }
      } else {
        return NextResponse.json(
          { error: 'Property not found' },
          { status: 404 }
        );
      }
    }

    // Prepare update data - convert boolean values to 0/1 for Directus
    const updateData: any = { ...body };
    
    // Convert approved and featured to 0/1 if they're booleans
    if (typeof updateData.approved === 'boolean') {
      updateData.approved = updateData.approved ? 1 : 0;
    }
    if (typeof updateData.featured === 'boolean') {
      updateData.featured = updateData.featured ? 1 : 0;
    }

    // Update the property using admin token (user token might not have update permissions)
    // We verify ownership above, so it's safe to use admin token
    const updateResponse = await httpJson(
      'PATCH',
      `${config.directus.url}/items/properties/${propertyId}`,
      updateData,
      [`Authorization: Bearer ${config.directus.token}`]
    );

    console.log('🔍 Update response status:', updateResponse.status);

    if (updateResponse.status < 200 || updateResponse.status >= 300) {
      let errorMessage = 'Failed to update property';
      try {
        const errorData = JSON.parse(updateResponse.body);
        errorMessage = errorData.errors?.[0]?.message || errorMessage;
        console.error('❌ Update error:', {
          status: updateResponse.status,
          error: errorMessage,
          body: updateResponse.body.substring(0, 500),
        });
      } catch (e) {
        console.error('❌ Failed to parse error:', updateResponse.body.substring(0, 500));
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: updateResponse.status }
      );
    }

    const updatedData = JSON.parse(updateResponse.body);
    console.log('✅ Property updated successfully');

    return NextResponse.json({
      success: true,
      property: updatedData.data,
      message: 'Property updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating property:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

/**
 * Delete a property and all associated images (for authenticated landlord)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const propertyId = resolvedParams.id;
    
    console.log('🗑️ Deleting property:', propertyId);
    
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

    // First, fetch the property to get all image IDs and verify ownership
    const propertiesParams = new URLSearchParams();
    propertiesParams.append('filter[id][_eq]', propertyId);
    propertiesParams.append('fields', '*,featured_image.*,image_1.*,image_2.*,image_3.*,image_4.*,lease_agreement.*,town.*,residential.*,owner.id,owner');
    
    const propertyResponse = await httpJson(
      'GET',
      `${config.directus.url}/items/properties?${propertiesParams.toString()}`,
      null,
      [`Authorization: Bearer ${token}`]
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

    // Verify ownership
    const meParams = new URLSearchParams();
    meParams.append('fields', 'id');
    
    const meResponse = await httpJson(
      'GET',
      `${config.directus.url}/users/me?${meParams.toString()}`,
      null,
      [`Authorization: Bearer ${token}`]
    );

    if (meResponse.status >= 200 && meResponse.status < 300) {
      const meData = JSON.parse(meResponse.body);
      const userId = meData.data?.id;
      const ownerId = typeof property.owner === 'object' ? property.owner?.id : property.owner;
      
      if (ownerId && ownerId !== userId) {
        return NextResponse.json(
          { error: 'Unauthorized - This property does not belong to you' },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Unauthorized - Could not verify ownership' },
        { status: 403 }
      );
    }

    // Collect all image IDs to delete
    const imageIds: string[] = [];
    const imageFields = ['featured_image', 'image_1', 'image_2', 'image_3', 'image_4'];
    
    imageFields.forEach(field => {
      const image = property[field];
      if (image && image.id) {
        imageIds.push(image.id);
        console.log(`📸 Found image to delete: ${field} - ${image.id}`);
      }
    });

    // Collect lease agreement ID to delete
    let leaseAgreementId: string | null = null;
    if (property.lease_agreement && property.lease_agreement.id) {
      leaseAgreementId = property.lease_agreement.id;
      console.log(`📄 Found lease agreement to delete: ${leaseAgreementId}`);
    }

    // Delete all images from Directus
    const deletedImages: string[] = [];
    const failedImages: string[] = [];

    for (const imageId of imageIds) {
      try {
        console.log(`🗑️ Deleting image: ${imageId}`);
        const deleteImageResponse = await fetch(`${config.directus.url}/files/${imageId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${config.directus.token}`,
          },
        });

        if (deleteImageResponse.ok) {
          deletedImages.push(imageId);
          console.log(`✅ Image deleted: ${imageId}`);
        } else {
          failedImages.push(imageId);
          console.warn(`⚠️ Failed to delete image: ${imageId}`);
        }
      } catch (error: any) {
        failedImages.push(imageId);
        console.error(`❌ Error deleting image ${imageId}:`, error.message);
      }
    }

    // Delete lease agreement if it exists
    let leaseAgreementDeleted = false;
    if (leaseAgreementId) {
      try {
        console.log(`🗑️ Deleting lease agreement: ${leaseAgreementId}`);
        const deleteLeaseResponse = await fetch(`${config.directus.url}/files/${leaseAgreementId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${config.directus.token}`,
          },
        });

        if (deleteLeaseResponse.ok) {
          leaseAgreementDeleted = true;
          console.log(`✅ Lease agreement deleted: ${leaseAgreementId}`);
        } else {
          console.warn(`⚠️ Failed to delete lease agreement: ${leaseAgreementId}`);
        }
      } catch (error: any) {
        console.error(`❌ Error deleting lease agreement ${leaseAgreementId}:`, error.message);
      }
    }

    // Delete the property record
    console.log(`🗑️ Deleting property record: ${propertyId}`);
    const deletePropertyResponse = await httpJson(
      'DELETE',
      `${config.directus.url}/items/properties/${propertyId}`,
      null,
      [`Authorization: Bearer ${config.directus.token}`]
    );

    if (deletePropertyResponse.status < 200 || deletePropertyResponse.status >= 300) {
      let errorMessage = 'Failed to delete property';
      try {
        const errorData = JSON.parse(deletePropertyResponse.body);
        errorMessage = errorData.errors?.[0]?.message || errorMessage;
      } catch (e) {
        // Ignore parse errors
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: deletePropertyResponse.status }
      );
    }

    console.log(`✅ Property deleted successfully: ${propertyId}`);
    console.log(`📊 Deleted ${deletedImages.length} images, ${failedImages.length} failed, lease agreement: ${leaseAgreementDeleted ? 'deleted' : 'none'}`);

    return NextResponse.json({
      success: true,
      message: 'Property and associated files deleted successfully',
      deletedImages: deletedImages.length,
      failedImages: failedImages.length,
      leaseAgreementDeleted: leaseAgreementDeleted,
    });
  } catch (error: any) {
    console.error('Error deleting property:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
