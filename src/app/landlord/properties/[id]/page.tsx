'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import MapComponent from '@/components/map-component';
import { fetchUniversities, University } from '@/lib/api';
import { calculateDistance, formatDistanceFromUniversity } from '@/lib/utils';

interface Property {
  id: number;
  title: string;
  description: string;
  price_per_month: string;
  currency: string;
  address: string;
  distance_from_campus?: number;
  latitude?: string;
  longitude?: string;
  rooms_available: number;
  total_rooms: number;
  approved: boolean;
  featured: boolean;
  amenities?: string[];
  featured_image?: {
    id: string;
    filename_download: string;
  } | null;
  image_1?: {
    id: string;
    filename_download: string;
  } | null;
  image_2?: {
    id: string;
    filename_download: string;
  } | null;
  image_3?: {
    id: string;
    filename_download: string;
  } | null;
  image_4?: {
    id: string;
    filename_download: string;
  } | null;
  university?: {
    id: number;
    name: string;
  } | null;
  owner?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  lease_agreement?: {
    id: string;
    filename_download: string;
  } | null;
}

export default function LandlordPropertyViewPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageCacheKey, setImageCacheKey] = useState(Date.now()); // For cache-busting images
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set()); // Track images that failed to load
  const [universities, setUniversities] = useState<University[]>([]);
  const [closestUniversity, setClosestUniversity] = useState<{university: University, distance: number} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (params.id && isAuthenticated) {
      fetchProperty();
    }
  }, [params.id, isAuthenticated]);

  // Fetch universities
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

  // Refresh property data when page becomes visible (e.g., after navigating back from edit page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && params.id && isAuthenticated) {
        fetchProperty();
      }
    };

    const handleFocus = () => {
      if (params.id && isAuthenticated) {
        fetchProperty();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [params.id, isAuthenticated]);

  const fetchProperty = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('directus_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/properties/${params.id}`, {
        method: 'GET',
        credentials: 'include',
        headers,
        cache: 'no-store', // Always fetch fresh data
      });

      if (response.ok) {
        const data = await response.json();
        setProperty(data.property);
        // Update cache key when property data changes to force image refresh
        setImageCacheKey(Date.now());
        // Clear failed images when property data refreshes (in case images were re-added)
        setFailedImages(new Set());
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load property');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getImageUrl = (image: Property['featured_image']) => {
    if (!image?.id) return '/placeholder-property.svg';
    // Use our proxy API route to handle authentication
    // Add cache-busting parameter to ensure fresh images after updates
    return `/api/images/${image.id}?t=${imageCacheKey}`;
  };

  const getAllImages = (): string[] => {
    if (!property) return [];
    
    const images: string[] = [];
    
    if (property.featured_image?.id && !failedImages.has(property.featured_image.id)) {
      images.push(getImageUrl(property.featured_image));
    }
    if (property.image_1?.id && !failedImages.has(property.image_1.id)) {
      images.push(`/api/images/${property.image_1.id}?t=${imageCacheKey}`);
    }
    if (property.image_2?.id && !failedImages.has(property.image_2.id)) {
      images.push(`/api/images/${property.image_2.id}?t=${imageCacheKey}`);
    }
    if (property.image_3?.id && !failedImages.has(property.image_3.id)) {
      images.push(`/api/images/${property.image_3.id}?t=${imageCacheKey}`);
    }
    if (property.image_4?.id && !failedImages.has(property.image_4.id)) {
      images.push(`/api/images/${property.image_4.id}?t=${imageCacheKey}`);
    }
    
    return images.length > 0 ? images : ['/placeholder-property.svg'];
  };

  const handleImageError = (imageId: string) => {
    // Mark this image as failed so it won't be displayed
    setFailedImages(prev => new Set(prev).add(imageId));
    // Refresh property data to get updated image list
    fetchProperty();
  };

  const handleDeleteProperty = async () => {
    if (!property) return;

    // Show confirmation dialog
    const confirmed = confirm(
      `Are you sure you want to delete "${property.title}"?\n\n` +
      `This will permanently delete:\n` +
      `- The property listing\n` +
      `- All associated images\n\n` +
      `This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const token = localStorage.getItem('directus_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/properties/${property.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Property deleted successfully:', data);
        // Redirect to properties list
        router.push('/landlord/properties');
      } else {
        const errorData = await response.json();
        console.error('❌ Delete failed:', errorData);
        setError(errorData.error || 'Failed to delete property');
        setIsDeleting(false);
      }
    } catch (err: any) {
      console.error('❌ Error deleting property:', err);
      setError(err.message || 'An error occurred while deleting the property');
      setIsDeleting(false);
    }
  };

  const formatPrice = (price: string, currency: string) => {
    const numPrice = parseFloat(price);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'ZMW',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numPrice);
  };

  const amenityLabels: { [key: string]: string } = {
    wifi: 'Wi-Fi',
    furnished: 'Furnished',
    parking: 'Parking',
    security: 'Security',
    air_conditioning: 'Air Conditioning',
    study_desk: 'Study Desk',
    laundry: 'Laundry',
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
          <div className="mt-4">
            <Button variant="outline" onClick={() => router.push('/landlord/properties')}>
              Back to Properties
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-gray-600">Property not found</p>
        </div>
      </div>
    );
  }

  const propertyImages = getAllImages();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            <li><Link href="/landlord/dashboard" className="hover:text-blue-600">Dashboard</Link></li>
            <li>/</li>
            <li><Link href="/landlord/properties" className="hover:text-blue-600">My Properties</Link></li>
            <li>/</li>
            <li className="text-gray-900">{property.title}</li>
          </ol>
        </nav>

        {/* Header with Actions */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{property.title}</h1>
            <div className="mt-2 flex items-center gap-2">
              {property.approved && (
                <Badge className="bg-green-500">Approved</Badge>
              )}
              {!property.approved && (
                <Badge className="bg-yellow-500">Pending Approval</Badge>
              )}
              {property.featured && (
                <Badge className="bg-blue-500">Featured</Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/landlord/properties/${property.id}/edit`}>
                Edit Property
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/property/${property.id}`} target="_blank">
                View Public Page
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3 lg:gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <div className="space-y-4">
              {propertyImages.length > 0 ? (
                <>
                  <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100">
                    <img
                      src={propertyImages[selectedImageIndex]}
                      alt={property.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Extract image ID from URL to mark it as failed
                        const imageUrl = propertyImages[selectedImageIndex];
                        const match = imageUrl.match(/\/api\/images\/([^/?]+)/);
                        if (match) {
                          handleImageError(match[1]);
                        }
                        e.currentTarget.src = '/placeholder-property.svg';
                      }}
                    />
                  </div>
                  
                  {/* Thumbnails */}
                  {propertyImages.length > 1 && (
                    <div className="grid grid-cols-5 gap-2">
                      {propertyImages.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                            selectedImageIndex === index
                              ? 'border-blue-600 ring-2 ring-blue-600'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <img
                            src={image}
                            alt={`${property.title} - Image ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Extract image ID from URL to mark it as failed
                              const match = image.match(/\/api\/images\/([^/?]+)/);
                              if (match) {
                                handleImageError(match[1]);
                              }
                              e.currentTarget.src = '/placeholder-property.svg';
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="aspect-[4/3] bg-gray-200 rounded-2xl flex items-center justify-center">
                  <p className="text-gray-500">No images available</p>
                </div>
              )}
            </div>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{property.description}</p>
              </CardContent>
            </Card>

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Amenities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {property.amenities.map((amenity) => (
                      <div key={amenity} className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">{amenityLabels[amenity] || amenity}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Map */}
            {property && property.latitude && property.longitude && (
              <Card>
                <CardHeader>
                  <CardTitle>Location</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-gray-700">{property.address}</span>
                    </div>
                    {closestUniversity && (
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span className="text-gray-700">
                          {formatDistanceFromUniversity(closestUniversity.distance)} from {closestUniversity.university.name}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="h-[500px] rounded-lg overflow-hidden">
                    <MapComponent
                      latitude={parseFloat(property.latitude)}
                      longitude={parseFloat(property.longitude)}
                      title={property.title || 'Property'}
                      address={property.address || ''}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Price Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">
                    {formatPrice(property.price_per_month, property.currency)}
                  </p>
                  <p className="text-gray-600 mt-1">per month</p>
                </div>
              </CardContent>
            </Card>

            {/* Property Details */}
            <Card>
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Rooms Available</span>
                  <span className="font-medium">{property.rooms_available} / {property.total_rooms}</span>
                </div>
                {property.university && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Near University</span>
                    <span className="font-medium">{property.university.name}</span>
                  </div>
                )}
                {property.distance_from_campus && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Distance from Campus</span>
                    <span className="font-medium">{property.distance_from_campus}m</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Lease Agreement */}
            {property.lease_agreement && (
              <Card>
                <CardHeader>
                  <CardTitle>Lease Agreement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3">
                      <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{property.lease_agreement.filename_download}</p>
                        <p className="text-xs text-gray-500">PDF Document</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a
                        href={`/api/files/${property.lease_agreement.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" asChild>
                  <Link href={`/landlord/properties/${property.id}/edit`}>
                    Edit Property
                  </Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/property/${property.id}`} target="_blank">
                    View Public Page
                  </Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/landlord/properties">
                    Back to Properties
                  </Link>
                </Button>
                <div className="pt-2 border-t border-gray-200">
                  <Button 
                    variant="outline" 
                    className="w-full text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
                    onClick={handleDeleteProperty}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete Property
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

