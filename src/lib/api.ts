// Directus API utilities
const DIRECTUS_BASE_URL = 'https://app.pozi.com.na';

export interface Property {
  id: number;
  title: string;
  description: string;
  price_per_month: string;
  currency: string;
  address: string;
  distance_from_campus?: number;
  latitude?: number | string | null;
  longitude?: number | string | null;
  rooms_available: number;
  total_rooms: number;
  amenities?: string[]; // Array of amenity keys like ['wifi', 'furnished', 'parking']
  featured_image?: string | null; // Main property image for cards
  image_1?: string; // Additional image 1
  image_2?: string; // Additional image 2
  image_3?: string; // Additional image 3
  image_4?: string; // Additional image 4
  photos?: string[] | null; // Legacy photos array (for backward compatibility)
  approved: number; // 0 or 1 in Directus
  featured: number; // 0 or 1 in Directus
  owner?: any | null;
  university?: any | null;
}

export interface DirectusResponse<T> {
  data: T[];
}

export interface GalleryItem {
  id: number;
  status: string;
  user_created: string;
  date_created: string;
  user_updated: string | null;
  date_updated: string | null;
  category: string;
  featured_image: string;
}

export interface University {
  id: number;
  name: string;
  slug: string;
  city: string;
  country: string;
  latitude: string;
  longitude: string;
  image: string | null;
}

// Fetch properties from Directus
export async function fetchProperties(): Promise<Property[]> {
  try {
    const response = await fetch('/api/properties?limit=100');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    // Debug: Log the raw data structure
    // console.log('All properties from API:', data);
    // console.log('Properties count:', data.properties?.length || 0);
    
    // Transform the data - keep image IDs, components will use getImageUrl() to get proxy URLs
    // Don't convert to full URLs here, let components handle it via getImageUrl()
    return data.properties || [];
  } catch (error) {
    console.error('Error fetching properties:', error);
    return [];
  }
}

export async function fetchFeaturedProperties(): Promise<Property[]> {
  try {
    const response = await fetch('/api/properties?featured=1&limit=4');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    // console.log('Featured properties from API:', data);
    // console.log('Featured properties count:', data.properties?.length || 0);
    
    // Transform the data - keep image IDs, components will use getImageUrl() to get proxy URLs
    // Don't convert to full URLs here, let components handle it via getImageUrl()
    return data.properties || [];
  } catch (error) {
    console.error('Error fetching featured properties:', error);
    return [];
  }
}

// Fetch featured properties (alternative with featured filter)
export async function fetchFeaturedPropertiesFiltered(): Promise<Property[]> {
  try {
    const response = await fetch('/api/properties?featured=1');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    // Debug: Log the raw data structure
    // console.log('Raw API data:', data);
    // if (data.properties && data.properties.length > 0) {
    //   console.log('First property amenities:', data.properties[0].amenities, 'Type:', typeof data.properties[0].amenities);
    // }
    
    return data.properties || [];
  } catch (error) {
    console.error('Error fetching featured properties:', error);
    return [];
  }
}

// Search properties
export async function searchProperties(
  query: string, 
  university?: string, 
  amenities?: string[]
): Promise<Property[]> {
  try {
    const params = new URLSearchParams();
    
    // console.log('Search properties called with:', { query, university, amenities });
    
    if (query) {
      params.append('search', query);
    }
    
    // Handle university filter - pass slug directly, API will handle ID lookup
    if (university) {
      params.append('university', university);
    }
    
    // Add amenity filters (check if amenity exists in the amenities array)
    if (amenities && amenities.length > 0) {
      amenities.forEach(amenity => {
        params.append('amenities', amenity);
      });
    }
    
    // console.log('Final search URL:', `/api/properties?${params.toString()}`);
    
    const response = await fetch(`/api/properties?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    // console.log('Search returned', data.properties?.length || 0, 'properties');
    
    // Transform the data - keep image IDs, components will use getImageUrl() to get proxy URLs
    // Don't convert to full URLs here, let components handle it via getImageUrl()
    return data.properties || [];
  } catch (error) {
    console.error('Error searching properties:', error);
    return [];
  }
}

// Fetch universities
export async function fetchUniversities(): Promise<University[]> {
  try {
    const response = await fetch('/api/universities');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    return data.universities || [];
  } catch (error) {
    console.error('Error fetching universities:', error);
    return [];
  }
}

// Fetch gallery images
export async function fetchGalleryImages(category: string): Promise<string[]> {
  try {
    const response = await fetch(`/api/gallery?category=${encodeURIComponent(category)}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    return data.images || [];
  } catch (error) {
    console.error(`Error fetching ${category} gallery images:`, error);
    return [];
  }
}

// Get image URL from Directus asset ID
export function getImageUrl(assetId: string): string {
  // Use our proxy API route to handle authentication
  return `/api/images/${assetId}`;
}

// Get property image URLs
export function getPropertyImageUrls(photos: string[]): string[] {
  return photos.map(photo => getImageUrl(photo));
}

// Get all property images for detail page (featured_image + image_1,2,3,4 as thumbnails)
export function getAllPropertyImages(property: Property): string[] {
  const images: string[] = [];
  
  // Add featured image first (will be the active/selected thumbnail)
  if (property.featured_image) {
    // Extract ID from URL if it's a full URL, otherwise use as-is
    const imageId = typeof property.featured_image === 'string' && property.featured_image.startsWith('http')
      ? property.featured_image.match(/\/assets\/([^/?]+)/)?.[1] || property.featured_image
      : property.featured_image;
    images.push(getImageUrl(imageId));
  }
  
  // Add additional images in order: image_1, image_2, image_3, image_4
  const additionalImages = [
    property.image_1,
    property.image_2,
    property.image_3,
    property.image_4
  ].filter(Boolean); // Remove null/undefined values
  
  additionalImages.forEach(imageId => {
    if (imageId) {
      const imageUrl = getImageUrl(imageId);
      // Show all images as thumbnails (remove deduplication)
      images.push(imageUrl);
    }
  });
  
  // Legacy support: also check photos array for backward compatibility
  if (property.photos && Array.isArray(property.photos)) {
    property.photos.forEach(photo => {
      const imageUrl = getImageUrl(photo);
      // Show all images as thumbnails
      images.push(imageUrl);
    });
  }
  
  return images;
}
