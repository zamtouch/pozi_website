import { NextRequest, NextResponse } from 'next/server';
import { httpJson } from '@/lib/auth-utils/http';
import { config } from '@/lib/config';

/**
 * Get gallery images by category
 * GET /api/gallery?category=slider|home
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
    const category = searchParams.get('category') || 'slider';

    console.log('🖼️ Fetching gallery images for category:', category);

    const galleryResponse = await httpJson(
      'GET',
      `${config.directus.url}/items/gallery?filter[category][_eq]=${category}`,
      null,
      [`Authorization: Bearer ${config.directus.token}`]
    );

    if (galleryResponse.status < 200 || galleryResponse.status >= 300) {
      console.error('❌ Failed to fetch gallery images:', galleryResponse.status);
      return NextResponse.json(
        { error: 'Failed to fetch gallery images' },
        { status: galleryResponse.status }
      );
    }

    const galleryData = JSON.parse(galleryResponse.body);
    const images = galleryData.data || [];

    // Return image URLs using our proxy API
    const imageUrls = images.map((item: any) => {
      if (item.featured_image) {
        return `/api/images/${item.featured_image}`;
      }
      return null;
    }).filter(Boolean);

    console.log(`✅ Fetched ${imageUrls.length} gallery images`);

    return NextResponse.json({
      success: true,
      images: imageUrls,
    });
  } catch (error: any) {
    console.error('Error fetching gallery images:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

