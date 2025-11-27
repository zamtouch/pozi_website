'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPrice, formatDistance, calculateDistance, formatDistanceFromUniversity } from '@/lib/utils';
import { fetchProperties, getAllPropertyImages, Property, fetchUniversities, University } from '@/lib/api';
import MapComponent from '@/components/map-component';
import { useAuth } from '@/lib/auth';


export default function PropertyPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isStudent } = useAuth();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showContactForm, setShowContactForm] = useState(false);
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
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (!property) return;

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
          // Show user-friendly error message
          const errorMessage = (errorData as any).error || 'Failed to add property to favorites. Please try again.';
          alert(errorMessage);
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading property...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !property) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Property Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The property you are looking for does not exist.'}</p>
          <Button asChild>
            <a href="/search">Back to Search</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container py-8 max-w-7xl mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            <li><a href="/" className="hover:text-ink">Home</a></li>
            <li>/</li>
            <li><a href="/search" className="hover:text-ink">Search</a></li>
            <li>/</li>
            <li className="text-ink">{property.title}</li>
          </ol>
        </nav>

        <div className="grid gap-8 lg:grid-cols-3 lg:gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <div className="space-y-4">
              {propertyImages.length > 0 ? (
                <>
                  <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100">
                    <Image
                      src={propertyImages[selectedImageIndex]}
                      alt={property.title}
                      width={800}
                      height={600}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-property.svg';
                      }}
                    />
                  </div>
                  
                  {/* All Images as Thumbnails */}
                  <div className="grid grid-cols-5 gap-2">
                    {propertyImages.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`aspect-square overflow-hidden rounded-lg transition-all duration-200 ${
                          selectedImageIndex === index
                            ? 'ring-2 ring-brand-500'
                            : 'hover:opacity-75'
                        }`}
                      >
                        <Image
                          src={image}
                          alt={`${property.title} ${index + 1}`}
                          width={200}
                          height={200}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder-property.svg';
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100 flex items-center justify-center">
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
            <Card>
              <CardHeader className="pb-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-bold text-gray-900">{property.title}</h1>
                    {property.featured === 1 && (
                      <Badge variant="warning">Featured</Badge>
                    )}
                    {property.approved === 1 && (
                      <Badge variant="success">Verified</Badge>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-brand-600">
                    {formatPrice(parseFloat(property.price_per_month), property.currency)}/month
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Description */}
                <div>
                  <h3 className="font-semibold text-ink mb-2">Description</h3>
                  <p className="text-gray-700 leading-relaxed">{property.description}</p>
                </div>

                {/* Key Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-semibold text-ink">{property.rooms_available}</div>
                    <div className="text-sm text-gray-600">Rooms Available</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-semibold text-ink">{property.total_rooms}</div>
                    <div className="text-sm text-gray-600">Total Rooms</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-semibold text-ink">
                      {closestUniversity ? formatDistanceFromUniversity(closestUniversity.distance) : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">From Nearest University</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-semibold text-ink">
                      {closestUniversity ? closestUniversity.university.name : 'Not specified'}
                    </div>
                    <div className="text-sm text-gray-600">Nearest University</div>
                  </div>
                </div>

                {/* Amenities */}
                <div>
                  <h3 className="font-semibold text-ink mb-4">Amenities</h3>
                  {amenities.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {amenities.map((amenity) => (
                        <div key={amenity} className="flex items-center space-x-2">
                          <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-gray-700">{amenity}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No amenities listed</p>
                  )}
                </div>

                {/* Location */}
                <div>
                  <h3 className="font-semibold text-ink mb-4">Location</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-gray-700">{property.address}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="text-gray-700">
                        {closestUniversity ? 
                          `${formatDistanceFromUniversity(closestUniversity.distance)} from ${closestUniversity.university.name}` : 
                          'Distance not available'
                        }
                      </span>
                    </div>
                  </div>
                  
                  {/* Interactive Map */}
                  <div className="mt-4">
                    <MapComponent
                      latitude={property.latitude ?? null}
                      longitude={property.longitude ?? null}
                      address={property.address}
                      title={property.title}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <Card className="sticky top-24">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Contact us</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {isAuthenticated && isStudent ? (
                    <Button asChild className="w-full" size="lg">
                      <Link href={`/student/apply/${params.slug}`}>
                        Apply Now
                      </Link>
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => router.push('/auth/login')} 
                      className="w-full" 
                      size="lg"
                    >
                      Login to Apply
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    className="w-full" 
                    size="lg"
                    onClick={toggleFavorite}
                    disabled={isTogglingFavorite || !isAuthenticated}
                  >
                    {isTogglingFavorite ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                        {isFavorite ? 'Removing...' : 'Adding...'}
                      </>
                    ) : (
                      <>
                        <svg 
                          className={`w-5 h-5 mr-2 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} 
                          fill={isFavorite ? 'currentColor' : 'none'} 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                          />
                        </svg>
                        {isFavorite ? 'Remove from Favorites' : 'Save to Favorites'}
                      </>
                    )}
                  </Button>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 text-center">
                    Verified property owner • Quick response guaranteed
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Similar Properties */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Similar Properties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-ink text-sm line-clamp-1">
                        Shared room near UNZA
                      </h4>
                      <p className="text-sm text-gray-600">ZMW 1,200/month</p>
                    </div>
                  </div>
                  <div className="flex space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-ink text-sm line-clamp-1">
                        Studio apartment near CBU
                      </h4>
                      <p className="text-sm text-gray-600">ZMW 1,800/month</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Contact Form Modal */}
      {showContactForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Apply for this Property</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-2">
                  Your Message
                </label>
                <textarea
                  className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm text-ink placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors duration-200 resize-none"
                  rows={4}
                  placeholder="Tell the owner why you're interested in this property..."
                />
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowContactForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button onClick={() => setShowContactForm(false)} className="flex-1">
                  Send Application
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

