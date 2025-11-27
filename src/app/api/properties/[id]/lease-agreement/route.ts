import { NextRequest, NextResponse } from 'next/server';
import { httpJson } from '@/lib/auth-utils/http';
import { config } from '@/lib/config';
import { getAuthToken } from '@/lib/auth-utils/server-auth';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

/**
 * Upload or update lease agreement PDF for a property
 * POST /api/properties/[id]/lease-agreement
 * Body: FormData with 'file'
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const propertyId = resolvedParams.id;
    
    console.log('📤 Uploading lease agreement for property:', propertyId);
    
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

    // Fetch current user ID using their token
    const meParams = new URLSearchParams();
    meParams.append('fields', 'id');
    
    const meResponse = await httpJson(
      'GET',
      `${config.directus.url}/users/me?${meParams.toString()}`,
      null,
      [`Authorization: Bearer ${token}`]
    );

    if (meResponse.status < 200 || meResponse.status >= 300) {
      console.warn('⚠️ Could not verify user ID from token for ownership check.', meResponse.body);
      return NextResponse.json(
        { error: 'Unauthorized - Could not verify user' },
        { status: 403 }
      );
    }

    const meData = JSON.parse(meResponse.body);
    const userId = meData.data?.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid user token' },
        { status: 403 }
      );
    }

    // Verify ownership using the authenticated user's token
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
        
        if (ownerId && ownerId !== userId) {
          return NextResponse.json(
            { error: 'Unauthorized - This property does not belong to you' },
            { status: 403 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'Property not found' },
          { status: 404 }
        );
      }
    } else {
      const errorData = JSON.parse(checkResponse.body);
      console.error('❌ Failed to fetch property for ownership check:', errorData);
      return NextResponse.json(
        { error: 'Failed to verify property ownership' },
        { status: checkResponse.status }
      );
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF files are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    if (file.size > MAX_FILE_SIZE) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return NextResponse.json(
        { 
          error: `File size (${fileSizeMB}MB) exceeds the maximum allowed size of 5MB. Please compress the PDF and try again.`,
          fileSize: file.size,
          maxSize: MAX_FILE_SIZE,
        },
        { status: 400 }
      );
    }

    // Get current property to check for old lease agreement
    const currentPropertyParams = new URLSearchParams();
    currentPropertyParams.append('filter[id][_eq]', propertyId);
    currentPropertyParams.append('fields', 'lease_agreement.*');
    
    const currentPropertyResponse = await httpJson(
      'GET',
      `${config.directus.url}/items/properties?${currentPropertyParams.toString()}`,
      null,
      [`Authorization: Bearer ${token}`]
    );

    let oldLeaseAgreementId: string | null = null;
    if (currentPropertyResponse.status >= 200 && currentPropertyResponse.status < 300) {
      const currentPropertyData = JSON.parse(currentPropertyResponse.body);
      const properties = currentPropertyData.data || [];
      if (properties.length > 0 && properties[0].lease_agreement?.id) {
        oldLeaseAgreementId = properties[0].lease_agreement.id;
        console.log('🗑️ Old lease agreement ID to delete:', oldLeaseAgreementId);
      }
    }

    // Upload file to Directus
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    console.log('📤 Uploading PDF to Directus...');
    const uploadResponse = await fetch(`${config.directus.url}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
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
    const newLeaseAgreementId = uploadData.data.id;
    console.log('✅ PDF uploaded successfully:', newLeaseAgreementId);

    // Update property with new lease agreement
    const updateResponse = await httpJson(
      'PATCH',
      `${config.directus.url}/items/properties/${propertyId}`,
      { lease_agreement: newLeaseAgreementId },
      [`Authorization: Bearer ${token}`]
    );

    if (updateResponse.status < 200 || updateResponse.status >= 300) {
      // If update fails, try to delete the uploaded file
      try {
        await fetch(`${config.directus.url}/files/${newLeaseAgreementId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
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

    // Delete old lease agreement if it exists
    if (oldLeaseAgreementId) {
      console.log('🗑️ Deleting old lease agreement:', oldLeaseAgreementId);
      try {
        const deleteResponse = await fetch(`${config.directus.url}/files/${oldLeaseAgreementId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (deleteResponse.ok) {
          console.log('✅ Old lease agreement deleted successfully');
        } else {
          console.warn('⚠️ Failed to delete old lease agreement (non-critical)');
        }
      } catch (e) {
        console.warn('⚠️ Error deleting old lease agreement (non-critical):', e);
      }
    }

    // Fetch the updated property to return complete lease agreement data
    const updatedPropertyParams = new URLSearchParams();
    updatedPropertyParams.append('filter[id][_eq]', propertyId);
    updatedPropertyParams.append('fields', 'lease_agreement.*');
    
    const updatedPropertyResponse = await httpJson(
      'GET',
      `${config.directus.url}/items/properties?${updatedPropertyParams.toString()}`,
      null,
      [`Authorization: Bearer ${token}`]
    );

    let updatedLeaseAgreement = null;
    if (updatedPropertyResponse.status >= 200 && updatedPropertyResponse.status < 300) {
      const updatedPropertyData = JSON.parse(updatedPropertyResponse.body);
      const properties = updatedPropertyData.data || [];
      if (properties.length > 0 && properties[0].lease_agreement) {
        updatedLeaseAgreement = properties[0].lease_agreement;
      }
    }

    console.log('✅ Lease agreement update complete, returning response');

    return NextResponse.json({
      success: true,
      lease_agreement: updatedLeaseAgreement || {
        id: newLeaseAgreementId,
        filename_download: uploadData.data.filename_download,
      },
      message: 'Lease agreement uploaded successfully',
    });
  } catch (error: any) {
    console.error('Error uploading lease agreement:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

/**
 * Delete lease agreement PDF from a property
 * DELETE /api/properties/[id]/lease-agreement
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const propertyId = resolvedParams.id;
    
    console.log('🗑️ Deleting lease agreement from property:', propertyId);
    
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
        } else {
          console.warn('⚠️ Could not verify user ID from token for ownership check.');
          return NextResponse.json(
            { error: 'Unauthorized - Could not verify ownership' },
            { status: 403 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'Property not found' },
          { status: 404 }
        );
      }
    } else {
      const errorData = JSON.parse(checkResponse.body);
      console.error('❌ Failed to fetch property for ownership check:', errorData);
      return NextResponse.json(
        { error: 'Failed to verify property ownership' },
        { status: checkResponse.status }
      );
    }

    // Get current lease agreement ID
    const currentPropertyParams = new URLSearchParams();
    currentPropertyParams.append('filter[id][_eq]', propertyId);
    currentPropertyParams.append('fields', 'lease_agreement.*');
    
    const currentPropertyResponse = await httpJson(
      'GET',
      `${config.directus.url}/items/properties?${currentPropertyParams.toString()}`,
      null,
      [`Authorization: Bearer ${token}`]
    );

    let leaseAgreementId: string | null = null;
    if (currentPropertyResponse.status >= 200 && currentPropertyResponse.status < 300) {
      const currentPropertyData = JSON.parse(currentPropertyResponse.body);
      const properties = currentPropertyData.data || [];
      if (properties.length > 0 && properties[0].lease_agreement?.id) {
        leaseAgreementId = properties[0].lease_agreement.id;
      }
    }

    if (!leaseAgreementId) {
      return NextResponse.json(
        { error: 'No lease agreement found for this property' },
        { status: 404 }
      );
    }

    // Remove lease agreement from property
    const updatePropertyResponse = await httpJson(
      'PATCH',
      `${config.directus.url}/items/properties/${propertyId}`,
      { lease_agreement: null }, // Set field to null to remove lease agreement
      [`Authorization: Bearer ${token}`]
    );

    if (updatePropertyResponse.status < 200 || updatePropertyResponse.status >= 300) {
      const errorData = JSON.parse(updatePropertyResponse.body);
      return NextResponse.json(
        { error: 'Failed to remove lease agreement from property: ' + (errorData.errors?.[0]?.message || 'Unknown error') },
        { status: updatePropertyResponse.status }
      );
    }

    // Delete file from Directus
    console.log('🗑️ Deleting PDF file from Directus:', leaseAgreementId);
    const deleteFileResponse = await fetch(`${config.directus.url}/files/${leaseAgreementId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!deleteFileResponse.ok) {
      const errorData = await deleteFileResponse.json().catch(() => ({}));
      console.error('❌ Failed to delete file from Directus:', errorData);
      // Note: We still return success if property update was successful, as file deletion is secondary
      return NextResponse.json(
        { success: true, message: 'Lease agreement removed from property, but failed to delete file from storage: ' + (errorData.errors?.[0]?.message || 'Unknown error') },
        { status: 200 }
      );
    }

    console.log('✅ Lease agreement deleted successfully from Directus');

    return NextResponse.json({
      success: true,
      message: 'Lease agreement deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting lease agreement:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

