import { NextRequest, NextResponse } from 'next/server';
import { httpJson } from '@/lib/auth-utils/http';
import { config } from '@/lib/config';
import { getAuthToken } from '@/lib/auth-utils/server-auth';

/**
 * Upload an image for a property
 * POST /api/properties/[id]/images
 * Body: FormData with 'file' and 'field' (featured_image, image_1, image_2, image_3, image_4)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const propertyId = resolvedParams.id;
    
    console.log('📤 Uploading image for property:', propertyId);
    
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

    // Verify ownership first
    const propertiesParams = new URLSearchParams();
    propertiesParams.append('filter[id][_eq]', propertyId);
    propertiesParams.append('fields', 'owner.id,owner');
    
    const checkResponse = await httpJson(
      'GET',
      `${config.directus.url}/items/properties?${propertiesParams.toString()}`,
      null,
      [`Authorization: Bearer ${token}`]
    );

    if (checkResponse.status >= 200 && checkResponse.status < 300) {
      const checkData = JSON.parse(checkResponse.body);
      const properties = checkData.data || [];
      
      if (properties.length > 0) {
        const property = properties[0];
        const ownerId = typeof property.owner === 'object' ? property.owner?.id : property.owner;
        
        // Get user ID using Authorization header
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

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const field = formData.get('field') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!field || !['featured_image', 'image_1', 'image_2', 'image_3', 'image_4'].includes(field)) {
      return NextResponse.json(
        { error: 'Invalid field. Must be one of: featured_image, image_1, image_2, image_3, image_4' },
        { status: 400 }
      );
    }

    // Get current property to check for old image
    const currentPropertyParams = new URLSearchParams();
    currentPropertyParams.append('filter[id][_eq]', propertyId);
    currentPropertyParams.append('fields', `${field}.*`);
    
    const currentPropertyResponse = await httpJson(
      'GET',
      `${config.directus.url}/items/properties?${currentPropertyParams.toString()}`,
      null,
      [`Authorization: Bearer ${token}`]
    );

    let oldImageId: string | null = null;
    if (currentPropertyResponse.status >= 200 && currentPropertyResponse.status < 300) {
      const currentPropertyData = JSON.parse(currentPropertyResponse.body);
      const properties = currentPropertyData.data || [];
      if (properties.length > 0 && properties[0][field]?.id) {
        oldImageId = properties[0][field].id;
        console.log('🗑️ Old image ID to delete:', oldImageId);
      }
    }

    // Upload file to Directus
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    console.log('📤 Uploading file to Directus...');
    const uploadResponse = await fetch(`${config.directus.url}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.directus.token}`,
      },
      body: uploadFormData,
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json().catch(() => ({}));
      console.error('❌ Failed to upload file:', errorData);
      return NextResponse.json(
        { error: 'Failed to upload file: ' + (errorData.errors?.[0]?.message || 'Unknown error') },
        { status: uploadResponse.status }
      );
    }

    const uploadData = await uploadResponse.json();
    const newImageId = uploadData.data.id;
    console.log('✅ File uploaded successfully:', newImageId);

    // Update property with new image
    const updateResponse = await httpJson(
      'PATCH',
      `${config.directus.url}/items/properties/${propertyId}`,
      { [field]: newImageId },
      [`Authorization: Bearer ${config.directus.token}`]
    );

    if (updateResponse.status < 200 || updateResponse.status >= 300) {
      // If update fails, try to delete the uploaded file
      try {
        await fetch(`${config.directus.url}/files/${newImageId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${config.directus.token}`,
          },
        });
      } catch (e) {
        console.error('Failed to cleanup uploaded file:', e);
      }

      const errorData = JSON.parse(updateResponse.body);
      return NextResponse.json(
        { error: 'Failed to update property: ' + (errorData.errors?.[0]?.message || 'Unknown error') },
        { status: updateResponse.status }
      );
    }

    // Delete old image if it exists
    if (oldImageId) {
      console.log('🗑️ Deleting old image:', oldImageId);
      try {
        const deleteResponse = await fetch(`${config.directus.url}/files/${oldImageId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${config.directus.token}`,
          },
        });

        if (deleteResponse.ok) {
          console.log('✅ Old image deleted successfully');
        } else {
          console.warn('⚠️ Failed to delete old image (non-critical)');
        }
      } catch (e) {
        console.warn('⚠️ Error deleting old image (non-critical):', e);
      }
    }

    // Fetch the updated property to return complete image data
    const updatedPropertyParams = new URLSearchParams();
    updatedPropertyParams.append('filter[id][_eq]', propertyId);
    updatedPropertyParams.append('fields', `${field}.*`);
    
    const updatedPropertyResponse = await httpJson(
      'GET',
      `${config.directus.url}/items/properties?${updatedPropertyParams.toString()}`,
      null,
      [`Authorization: Bearer ${token}`]
    );

    let updatedImage = null;
    if (updatedPropertyResponse.status >= 200 && updatedPropertyResponse.status < 300) {
      const updatedPropertyData = JSON.parse(updatedPropertyResponse.body);
      const properties = updatedPropertyData.data || [];
      if (properties.length > 0 && properties[0][field]) {
        updatedImage = properties[0][field];
      }
    }

    console.log('✅ Image update complete, returning response');

    return NextResponse.json({
      success: true,
      image: updatedImage || {
        id: newImageId,
        filename_download: uploadData.data.filename_download,
      },
      message: 'Image uploaded successfully',
    });
  } catch (error: any) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

/**
 * Delete an image from a property
 * DELETE /api/properties/[id]/images?field=featured_image
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const propertyId = resolvedParams.id;
    
    const { searchParams } = new URL(request.url);
    const field = searchParams.get('field');

    if (!field || !['featured_image', 'image_1', 'image_2', 'image_3', 'image_4'].includes(field)) {
      return NextResponse.json(
        { error: 'Invalid field. Must be one of: featured_image, image_1, image_2, image_3, image_4' },
        { status: 400 }
      );
    }

    console.log('🗑️ Deleting image from property:', propertyId, 'field:', field);
    
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

    // Verify ownership
    const propertiesParams = new URLSearchParams();
    propertiesParams.append('filter[id][_eq]', propertyId);
    propertiesParams.append('fields', 'owner.id,owner');
    
    const checkResponse = await httpJson(
      'GET',
      `${config.directus.url}/items/properties?${propertiesParams.toString()}`,
      null,
      [`Authorization: Bearer ${token}`]
    );

    if (checkResponse.status >= 200 && checkResponse.status < 300) {
      const checkData = JSON.parse(checkResponse.body);
      const properties = checkData.data || [];
      
      if (properties.length > 0) {
        const property = properties[0];
        const ownerId = typeof property.owner === 'object' ? property.owner?.id : property.owner;
        
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

    // Get current image ID
    const currentPropertyParams = new URLSearchParams();
    currentPropertyParams.append('filter[id][_eq]', propertyId);
    currentPropertyParams.append('fields', `${field}.*`);
    
    const currentPropertyResponse = await httpJson(
      'GET',
      `${config.directus.url}/items/properties?${currentPropertyParams.toString()}`,
      null,
      [`Authorization: Bearer ${token}`]
    );

    let imageId: string | null = null;
    if (currentPropertyResponse.status >= 200 && currentPropertyResponse.status < 300) {
      const currentPropertyData = JSON.parse(currentPropertyResponse.body);
      const properties = currentPropertyData.data || [];
      if (properties.length > 0 && properties[0][field]?.id) {
        imageId = properties[0][field].id;
      }
    }

    if (!imageId) {
      return NextResponse.json(
        { error: 'No image found for this field' },
        { status: 404 }
      );
    }

    // Remove image from property
    const updateResponse = await httpJson(
      'PATCH',
      `${config.directus.url}/items/properties/${propertyId}`,
      { [field]: null },
      [`Authorization: Bearer ${config.directus.token}`]
    );

    if (updateResponse.status < 200 || updateResponse.status >= 300) {
      const errorData = JSON.parse(updateResponse.body);
      return NextResponse.json(
        { error: 'Failed to remove image from property: ' + (errorData.errors?.[0]?.message || 'Unknown error') },
        { status: updateResponse.status }
      );
    }

    // Delete the file from Directus
    console.log('🗑️ Deleting file:', imageId);
    const deleteResponse = await fetch(`${config.directus.url}/files/${imageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${config.directus.token}`,
      },
    });

    if (!deleteResponse.ok) {
      console.warn('⚠️ Failed to delete file (non-critical)');
    }

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

