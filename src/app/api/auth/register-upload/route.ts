import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Public file upload endpoint for registration
 * POST /api/auth/register-upload
 * Body: FormData with 'file'
 * 
 * This endpoint allows file uploads during registration without authentication
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type (PDF only)
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 }
      );
    }

    // Convert File to FormData for Directus
    const directusFormData = new FormData();
    const fileBuffer = await file.arrayBuffer();
    const blob = new Blob([fileBuffer], { type: 'application/pdf' });
    directusFormData.append('file', blob, file.name);

    // Upload to Directus using admin token
    const uploadResponse = await fetch(`${config.directus.url}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.directus.token}`,
      },
      body: directusFormData,
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json().catch(() => ({}));
      console.error('Directus upload error:', errorData);
      return NextResponse.json(
        { error: errorData.errors?.[0]?.message || 'Failed to upload file' },
        { status: uploadResponse.status }
      );
    }

    const uploadData = await uploadResponse.json();
    
    return NextResponse.json({
      success: true,
      data: uploadData.data,
    });

  } catch (error: any) {
    console.error('Registration upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: 500 }
    );
  }
}

