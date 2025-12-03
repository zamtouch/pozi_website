'use client';

// Force dynamic rendering - prevent static generation and caching
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { formatPrice, calculateDistance, formatDistanceFromUniversity } from '@/lib/utils';
import { fetchProperties, getAllPropertyImages, Property, fetchUniversities, University } from '@/lib/api';
import MapComponent from '@/components/map-component';
import { useAuth } from '@/lib/auth';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

// Extend Window interface for React Native WebView
declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}

export default function PropertyMobilePage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isStudent } = useAuth();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [universities, setUniversities] = useState<University[]>([]);
  const [closestUniversity, setClosestUniversity] = useState<{university: University, distance: number} | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  // Fetch property data from API
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setIsLoading(true);
        const properties = await fetchProperties();
        
        // Find property by ID (using slug as ID for now)
        const propertyId = parseInt(params.slug as string);
        const foundProperty = properties.find(p => p.id === propertyId);
        
        if (foundProperty) {
          setProperty(foundProperty);
          // Check if property is favorited
          if (isAuthenticated) {
            checkFavoriteStatus(propertyId);
          }
        } else {
          setError('Property not found');
        }
      } catch (err) {
        console.error('Error fetching property:', err);
        setError('Failed to load property');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.slug) {
      fetchProperty();
    }
  }, [params.slug, isAuthenticated]);

  // Check if property is in favorites
  const checkFavoriteStatus = async (propertyId: number) => {
    try {
      const token = localStorage.getItem('directus_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/favorites', {
        method: 'GET',
        credentials: 'include',
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        const propertyIds = data.propertyIds || [];
        setIsFavorite(propertyIds.includes(propertyId));
      }
    } catch (err) {
      console.error('Error checking favorite status:', err);
    }
  };

  // Toggle favorite status
  const toggleFavorite = async () => {
    if (!isAuthenticated || !property) return;

    setIsTogglingFavorite(true);
    try {
      const token = localStorage.getItem('directus_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      if (isFavorite) {
        // Remove from favorites
        const response = await fetch(`/api/favorites?property_id=${property.id}`, {
          method: 'DELETE',
          credentials: 'include',
          headers,
        });

        if (response.ok) {
          setIsFavorite(false);
        } else {
          const errorData = await response.json();
          console.error('Failed to remove favorite:', errorData);
        }
      } else {
        // Add to favorites
        const response = await fetch('/api/favorites', {
          method: 'POST',
          credentials: 'include',
          headers,
          body: JSON.stringify({ property_id: property.id }),
        });

        if (response.ok) {
          setIsFavorite(true);
        } else {
          let errorData = {};
          try {
            errorData = await response.json();
          } catch (e) {
            errorData = { error: `Failed to add favorite: ${response.status} ${response.statusText}` };
          }
          console.error('Failed to add favorite:', errorData);
        }
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  // Fetch universities and calculate closest one
  useEffect(() => {
    const fetchUniversitiesData = async () => {
      try {
        const universitiesData = await fetchUniversities();
        setUniversities(universitiesData);
      } catch (error) {
        console.error('Error fetching universities:', error);
      }
    };

    fetchUniversitiesData();
  }, []);

  // Calculate closest university when property and universities are available
  useEffect(() => {
    if (property && universities.length > 0 && property.latitude && property.longitude) {
      let closest = null;
      let minDistance = Infinity;

      universities.forEach(university => {
        const uniLat = typeof university.latitude === 'string' ? parseFloat(university.latitude) : university.latitude;
        const uniLng = typeof university.longitude === 'string' ? parseFloat(university.longitude) : university.longitude;
        
        if (!isNaN(uniLat) && !isNaN(uniLng)) {
          const distance = calculateDistance(
            property.latitude!,
            property.longitude!,
            uniLat,
            uniLng
          );
          
          if (distance > 0 && distance < minDistance) {
            minDistance = distance;
            closest = { university, distance };
          }
        }
      });

      setClosestUniversity(closest);
    }
  }, [property, universities]);

  // Get all property images for gallery
  const propertyImages = property ? getAllPropertyImages(property) : [];
  
  // Handle amenities display
  const amenities = property ? (() => {
    const amenitiesArray = (property as any).amenities;
    if (!amenitiesArray || !Array.isArray(amenitiesArray)) {
      return [];
    }
    
    const amenityMap: { [key: string]: string } = {
      'wifi': 'Wi-Fi',
      'furnished': 'Furnished',
      'parking': 'Parking',
      'security': 'Security',
      'air_conditioning': 'Air Conditioning',
      'study_desk': 'Study Desk'
    };

    return amenitiesArray
      .map(amenity => amenityMap[amenity] || amenity)
      .filter(Boolean);
  })() : [];

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading property...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !property) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Property Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The property you are looking for does not exist.'}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Image Gallery */}
      <div className="relative">
        {propertyImages.length > 0 ? (
          <>
            <div className="relative aspect-[4/3] bg-gray-100">
              <Image
                src={propertyImages[selectedImageIndex]}
                alt={property.title}
                fill
                className="object-cover"
                priority
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-property.svg';
                }}
              />
              {/* Image counter */}
              {propertyImages.length > 1 && (
                <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {selectedImageIndex + 1} / {propertyImages.length}
                </div>
              )}
            </div>
            
            {/* Image thumbnails */}
            {propertyImages.length > 1 && (
              <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
                {propertyImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden transition-all ${
                      selectedImageIndex === index
                        ? 'ring-2 ring-teal-500'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${property.title} ${index + 1}`}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-property.svg';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-500">No images available</p>
            </div>
          </div>
        )}
      </div>

      {/* Property Details */}
      <div className="px-4 py-6 space-y-6">
        {/* Title and Price */}
        <div>
          <div className="flex items-start justify-between gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900 flex-1">{property.title}</h1>
            <div className="flex gap-2 flex-shrink-0">
              {property.featured === 1 && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">Featured</span>
              )}
              {property.approved === 1 && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">Verified</span>
              )}
            </div>
          </div>
          <div className="text-3xl font-bold text-teal-600 mt-2">
            {formatPrice(parseFloat(property.price_per_month), property.currency)}/month
          </div>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <div className="text-2xl font-bold text-gray-900">{property.rooms_available}</div>
            <div className="text-xs text-gray-600 mt-1">Rooms Available</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <div className="text-2xl font-bold text-gray-900">{property.total_rooms}</div>
            <div className="text-xs text-gray-600 mt-1">Total Rooms</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <div className="text-2xl font-bold text-gray-900">
              {closestUniversity ? formatDistanceFromUniversity(closestUniversity.distance) : 'N/A'}
            </div>
            <div className="text-xs text-gray-600 mt-1">From University</div>
          </div>
        </div>

        {/* Description */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
          <p className="text-gray-700 leading-relaxed">{property.description}</p>
        </div>

        {/* Location Details */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 mb-2">Location</h3>
          <div className="space-y-2">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-gray-700 flex-1">{property.address}</span>
            </div>
            {(property as any).town && (
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
                <span className="text-gray-700 flex-1">
                  {typeof (property as any).town === 'object' ? (property as any).town.town_name : 'N/A'}
                  {(property as any).residential && (
                    <span className="text-gray-500">
                      {' - '}
                      {typeof (property as any).residential === 'object' ? (property as any).residential.residential_name : ''}
                    </span>
                  )}
                </span>
              </div>
            )}
            {closestUniversity && (
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="text-gray-700 flex-1">
                  {formatDistanceFromUniversity(closestUniversity.distance)} from {closestUniversity.university.name}
                </span>
              </div>
            )}
          </div>
          
          {/* Interactive Map */}
          <div className="mt-4 rounded-xl overflow-hidden">
            <MapComponent
              latitude={property.latitude ?? null}
              longitude={property.longitude ?? null}
              address={property.address}
              title={property.title}
            />
          </div>
        </div>

        {/* Amenities */}
        {amenities.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Amenities</h3>
            <div className="grid grid-cols-2 gap-3">
              {amenities.map((amenity) => (
                <div key={amenity} className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-teal-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 text-sm">{amenity}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Action Buttons - Only show if authenticated and student */}
      {isAuthenticated && isStudent && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50 safe-area-inset-bottom">
          <div className="max-w-2xl mx-auto space-y-3">
            <Link
              href={`/student/apply/${params.slug}`}
              className="block w-full bg-gradient-to-r from-teal-600 to-blue-600 text-white font-semibold py-4 px-6 rounded-xl text-center hover:from-teal-700 hover:to-blue-700 transition-all shadow-lg"
              onClick={() => {
                // Send message to React Native WebView if embedded
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'NAVIGATE',
                    path: `/student/apply/${params.slug}`
                  }));
                }
              }}
            >
              Apply Now
            </Link>
            <p className="text-xs text-gray-500 text-center">
              Verified property owner • Quick response guaranteed
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

