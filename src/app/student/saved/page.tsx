'use client';

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils';
import { getImageUrl, Property } from '@/lib/api';

interface FavoriteProperty extends Property {
  favoriteId: string;
}

export default function SavedPropertiesPage() {
  const { user, isAuthenticated, isStudent, isGraduate, isLoading: authLoading } = useAuth();
  const isStudentOrGraduate = isStudent || isGraduate;
  const router = useRouter();
  const [properties, setProperties] = useState<FavoriteProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasChecked, setHasChecked] = useState(false);
  const [hasCookie, setHasCookie] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Check for cookie directly
  useEffect(() => {
    const checkCookie = () => {
      const cookies = document.cookie.split(';');
      const hasDirectusToken = cookies.some(cookie => cookie.trim().startsWith('directus_token='));
      setHasCookie(hasDirectusToken);
    };
    checkCookie();
  }, []);

  useEffect(() => {
    if (!authLoading && !hasChecked) {
      setHasChecked(true);
      const isAuth = isAuthenticated || hasCookie;

      if (!isAuth) {
        router.push('/auth/login');
      } else if (isAuth && !isStudentOrGraduate) {
        if (user?.role && !isStudentOrGraduate) {
          router.push('/');
        }
      } else {
        fetchSavedProperties();
      }
    }
  }, [authLoading, hasChecked, isAuthenticated, hasCookie, isStudentOrGraduate, router, user]);

  const fetchSavedProperties = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('directus_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Fetch favorites (now includes property details)
      const favoritesResponse = await fetch('/api/favorites', {
        method: 'GET',
        credentials: 'include',
        headers,
        cache: 'no-store',
      });

      if (favoritesResponse.ok) {
        const favoritesData = await favoritesResponse.json();
        const propertiesData = favoritesData.properties || [];

        if (propertiesData.length === 0) {
          setProperties([]);
          setIsLoading(false);
          return;
        }

        // Properties are already included in the response
        setProperties(propertiesData);
      } else {
        const errorData = await favoritesResponse.json();
        setError(errorData.error || 'Failed to load saved properties');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFavorite = async (propertyId: number, favoriteId: string) => {
    setRemovingId(favoriteId);
    setError(null);

    try {
      const token = localStorage.getItem('directus_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/favorites?property_id=${propertyId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers,
      });

      if (response.ok) {
        // Remove the property from the list
        setProperties(properties.filter(prop => prop.favoriteId !== favoriteId));
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to remove from favorites');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while removing favorite');
    } finally {
      setRemovingId(null);
    }
  };

  if (authLoading || !hasChecked || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading saved properties...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !hasCookie) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Saved Properties</h1>
          <p className="mt-2 text-gray-600">
            Your favorite properties saved for later.
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {properties.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Saved Properties</h3>
                <p className="text-gray-600 mb-4">You haven't saved any properties yet.</p>
                <Button asChild>
                  <Link href="/search">Browse Properties</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <Card key={property.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                <div className="relative h-48 w-full">
                  {(() => {
                    const imageId = typeof property.featured_image === 'string' 
                      ? property.featured_image 
                      : (property.featured_image as any)?.id;
                    return imageId ? (
                      <Image
                        src={getImageUrl(imageId)}
                        alt={property.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                      />
                    ) : null;
                  })() || (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <button
                    onClick={() => handleRemoveFavorite(property.id, property.favoriteId)}
                    disabled={removingId === property.favoriteId}
                    className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                    title="Remove from favorites"
                  >
                    {removingId === property.favoriteId ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                    ) : (
                      <svg className="w-5 h-5 text-red-500 fill-current" viewBox="0 0 24 24">
                        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    )}
                  </button>
                </div>
                <CardContent className="pt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                    {property.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-1">{property.address}</p>
                  <p className="text-lg font-bold text-green-600 mb-4">
                    {formatPrice(parseFloat(property.price_per_month), property.currency)}/month
                  </p>
                  <div className="flex gap-2">
                    <Button asChild className="flex-1" size="sm">
                      <Link href={`/property/${property.id}`}>
                        View Details
                      </Link>
                    </Button>
                    {isAuthenticated && isStudentOrGraduate && (
                      <Button asChild className="flex-1" size="sm" variant="outline">
                        <Link href={`/student/apply/${property.id}`}>
                          Apply Now
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

