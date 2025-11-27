import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

/**
 * Proxy route for Directus images with authentication
 * GET /api/images/[id]
 * This allows Next.js Image Optimization to work with authenticated Directus assets
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    let imageId = resolvedParams.id;
    
    // Handle Next.js Image Optimization query parameters
    // Next.js might append ?w=256&q=75, so we need to extract just the ID
    // The ID might also have query params from cache-busting, so we split on '?' and take the first part
    imageId = imageId.split('?')[0];
    
    // Fetch the image from Directus using admin token
    if (!config.directus.url || !config.directus.token) {
      console.error('Directus configuration missing:', {
        hasUrl: !!config.directus.url,
        hasToken: !!config.directus.token,
      });
      return new NextResponse('Image service misconfigured', { status: 500 });
    }
    
    const imageUrl = `${config.directus.url}/assets/${imageId}`;
    
    const response = await fetch(imageUrl, {
      headers: {
        'Authorization': `Bearer ${config.directus.token}`,
      },
      cache: 'no-store', // Always fetch fresh from Directus
    });

    if (!response.ok) {
      console.error(`Failed to fetch image ${imageId} from Directus:`, response.status, response.statusText);
      return new NextResponse('Image not found', { status: response.status });
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Check if there's a cache-busting parameter (t=timestamp)
    const url = new URL(request.url);
    const cacheBust = url.searchParams.get('t');
    
    // Return the image with proper headers
    // Use shorter cache time and respect cache-busting
    const cacheControl = cacheBust 
      ? 'no-cache, no-store, must-revalidate' // Force fresh fetch when cache-busting
      : 'public, max-age=3600'; // 1 hour cache for normal requests
    
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': cacheControl,
        'Pragma': 'no-cache',
        'Expires': '0',
        // Allow CORS for Next.js Image Optimization
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
      },
    });
  } catch (error: any) {
    console.error('Error proxying image:', error);
    return new NextResponse('Error loading image', { status: 500 });
  }
}

