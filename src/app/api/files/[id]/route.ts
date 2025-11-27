import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { getAuthToken } from '@/lib/auth-utils/server-auth';

/**
 * Proxy route for Directus files (PDFs, documents, etc.) with authentication
 * GET /api/files/[id]
 * This allows downloading files from Directus with proper authentication
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    let fileId = resolvedParams.id;
    
    // Handle query parameters (cache-busting, etc.)
    fileId = fileId.split('?')[0];
    
    // Fetch the file from Directus using admin token
    const fileUrl = `${config.directus.url}/assets/${fileId}`;
    
    const response = await fetch(fileUrl, {
      headers: {
        'Authorization': `Bearer ${config.directus.token}`,
      },
      cache: 'no-store', // Always fetch fresh from Directus
    });

    if (!response.ok) {
      console.error(`Failed to fetch file ${fileId} from Directus:`, response.status, response.statusText);
      return new NextResponse('File not found', { status: response.status });
    }

    // Get the file data
    const fileBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'application/pdf';
    const contentDisposition = response.headers.get('content-disposition') || `attachment; filename="file.pdf"`;

    // Return the file with proper headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition,
        'Cache-Control': 'public, max-age=3600', // 1 hour cache
        // Allow CORS for downloads
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
      },
    });
  } catch (error: any) {
    console.error('Error proxying file:', error);
    return new NextResponse('Error loading file', { status: 500 });
  }
}

