import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { getAuthToken } from '@/lib/auth-utils/server-auth';

/**
 * Upload an image to Directus
 * POST /api/upload-image
 * Body: FormData with 'file'
 * 
 * Delete an image from Directus
 * DELETE /api/upload-image?id={imageId}
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

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Upload file to Directus using admin token
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    console.log('📤 Uploading file to Directus...');
    const uploadResponse = await fetch(`${config.directus.url}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.directus.token}`, // Use admin token for file upload
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
    console.log('✅ File uploaded successfully:', uploadData.data.id);

    return NextResponse.json({
      success: true,
      data: uploadData.data,
    });
  } catch (error: any) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

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

    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('id');

    if (!imageId) {
      return NextResponse.json(
        { error: 'Image ID is required' },
        { status: 400 }
      );
    }

    console.log('🗑️ Deleting image from Directus:', imageId);

    // Delete file from Directus using admin token
    const deleteResponse = await fetch(`${config.directus.url}/files/${imageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${config.directus.token}`, // Use admin token for file deletion
      },
    });

    if (!deleteResponse.ok) {
      const errorData = await deleteResponse.json().catch(() => ({}));
      console.error('❌ Failed to delete file from Directus:', errorData);
      return NextResponse.json(
        { error: 'Failed to delete file: ' + (errorData.errors?.[0]?.message || 'Unknown error') },
        { status: deleteResponse.status }
      );
    }

    console.log('✅ File deleted successfully from Directus');

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

