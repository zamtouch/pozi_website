// Directus API utilities
const DIRECTUS_BASE_URL = 'https://pozi2.omaridigital.com';

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
    const response = await fetch(`${DIRECTUS_BASE_URL}/items/properties?limit=100&fields=*,university.*`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: DirectusResponse<Property> = await response.json();
    
    // Debug: Log the raw data structure
    // console.log('All properties from Directus:', data);
    // console.log('Properties count:', data.data?.length || 0);
    
    // Transform the data to include full image URLs
    const transformedData = data.data?.map(property => ({
      ...property,
      featured_image: property.featured_image 
        ? `${DIRECTUS_BASE_URL}/assets/${property.featured_image}`
        : null
    })) || [];
    
    return transformedData;
  } catch (error) {
    console.error('Error fetching properties:', error);
    return [];
  }
}

export async function fetchFeaturedProperties(): Promise<Property[]> {
  try {
    const response = await fetch(`${DIRECTUS_BASE_URL}/items/properties?filter[featured]=1&filter[approved]=1&limit=4&fields=*,university.*`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: DirectusResponse<Property> = await response.json();
    
    // console.log('Featured properties from Directus:', data);
    // console.log('Featured properties count:', data.data?.length || 0);
    
    // Transform the data to include full image URLs
    const transformedData = data.data?.map(property => ({
      ...property,
      featured_image: property.featured_image 
        ? `${DIRECTUS_BASE_URL}/assets/${property.featured_image}`
        : null
    })) || [];
    
    return transformedData;
  } catch (error) {
    console.error('Error fetching featured properties:', error);
    return [];
  }
}

// Fetch featured properties (alternative with featured filter)
export async function fetchFeaturedPropertiesFiltered(): Promise<Property[]> {
  try {
    const response = await fetch(`${DIRECTUS_BASE_URL}/items/properties?filter[featured]=1&filter[approved]=1&fields=*,university.*`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: DirectusResponse<Property> = await response.json();
    
    // Debug: Log the raw data structure
    // console.log('Raw Directus data:', data);
    // if (data.data && data.data.length > 0) {
    //   console.log('First property amenities:', data.data[0].amenities, 'Type:', typeof data.data[0].amenities);
    // }
    
    return data.data || [];
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
    let url = `${DIRECTUS_BASE_URL}/items/properties?filter[approved]=1&fields=*,university.*`;
    
    // console.log('Search properties called with:', { query, university, amenities });
    
    if (query) {
      url += `&filter[title][_contains]=${encodeURIComponent(query)}`;
      // console.log('Added title filter for query:', query);
    }
    
    // Handle university filter - need to get university ID from slug
    if (university) {
      try {
        // console.log('Looking up university ID for slug:', university);
        // First, get the university ID from the slug
        const universityResponse = await fetch(`${DIRECTUS_BASE_URL}/items/universities?filter[slug]=${encodeURIComponent(university)}`);
        if (universityResponse.ok) {
          const universityData = await universityResponse.json();
          if (universityData.data && universityData.data.length > 0) {
            const universityId = universityData.data[0].id;
            url += `&filter[university]=${universityId}`;
            // console.log('Added university filter for ID:', universityId);
          }
        } else {
          console.error('Failed to fetch university data:', universityResponse.status);
        }
      } catch (error) {
        console.error('Error fetching university ID:', error);
      }
    }
    
    // Add amenity filters (check if amenity exists in the amenities array)
    if (amenities && amenities.length > 0) {
      amenities.forEach(amenity => {
        url += `&filter[amenities][_contains]=${amenity}`;
        // console.log('Added amenity filter for:', amenity);
      });
    }
    
    // console.log('Final search URL:', url);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: DirectusResponse<Property> = await response.json();
    // console.log('Search returned', data.data?.length || 0, 'properties');
    
    // Transform the data to include full image URLs
    const transformedData = data.data?.map(property => ({
      ...property,
      featured_image: property.featured_image 
        ? `${DIRECTUS_BASE_URL}/assets/${property.featured_image}`
        : null
    })) || [];
    
    return transformedData;
  } catch (error) {
    console.error('Error searching properties:', error);
    return [];
  }
}

// Fetch universities
export async function fetchUniversities(): Promise<University[]> {
  try {
    const response = await fetch(`${DIRECTUS_BASE_URL}/items/universities`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: DirectusResponse<University> = await response.json();
    
    return data.data || [];
  } catch (error) {
    console.error('Error fetching universities:', error);
    return [];
  }
}

// Fetch gallery images
export async function fetchGalleryImages(category: string): Promise<string[]> {
  try {
    const response = await fetch(`${DIRECTUS_BASE_URL}/items/gallery?filter[category]=${category}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: DirectusResponse<GalleryItem> = await response.json();
    
    return data.data.map(item => `${DIRECTUS_BASE_URL}/assets/${item.featured_image}`);
  } catch (error) {
    console.error(`Error fetching ${category} gallery images:`, error);
    return [];
  }
}

// Get image URL from Directus asset ID
export function getImageUrl(assetId: string): string {
  return `${DIRECTUS_BASE_URL}/assets/${assetId}`;
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
    images.push(property.featured_image); // featured_image is already a full URL
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
