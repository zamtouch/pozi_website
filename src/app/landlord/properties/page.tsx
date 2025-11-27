'use client';

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

interface Property {
  id: number;
  title: string;
  description: string;
  price_per_month: string;
  currency: string;
  address: string;
  rooms_available: number;
  total_rooms: number;
  approved: boolean;
  featured: boolean;
  featured_image?: {
    id: string;
    filename_download: string;
  } | null;
  university?: {
    id: number;
    name: string;
  } | null;
  date_created?: string;
}

export default function MyPropertiesPage() {
  const { user, isAuthenticated, isLoading: authLoading, isLandlord } = useAuth();
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasChecked, setHasChecked] = useState(false);
  const [cookieCheck, setCookieCheck] = useState(false);

  // Check for cookie directly
  useEffect(() => {
    const checkCookie = () => {
      const cookies = document.cookie.split(';');
      const hasDirectusToken = cookies.some(cookie => cookie.trim().startsWith('directus_token='));
      setCookieCheck(hasDirectusToken);
    };
    checkCookie();
  }, []);

  useEffect(() => {
    if (!authLoading && !hasChecked) {
      setHasChecked(true);
      const isAuth = isAuthenticated || cookieCheck;
      
      if (!isAuth) {
        router.push('/auth/login');
        return;
      }
    }
  }, [authLoading, isAuthenticated, cookieCheck, router, hasChecked]);

  useEffect(() => {
    if (hasChecked && (isAuthenticated || cookieCheck)) {
      fetchProperties();
    }
  }, [hasChecked, isAuthenticated, cookieCheck]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get token from localStorage as fallback
      const token = localStorage.getItem('directus_token');
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // Add token to Authorization header if available (fallback if cookie is missing)
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/properties/my-properties', {
        method: 'GET',
        credentials: 'include',
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        setProperties(data.properties || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load properties');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (image: Property['featured_image']) => {
    if (!image?.id) return '/placeholder-property.svg';
    // Use our proxy API route to handle authentication
    return `/api/images/${image.id}`;
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

  if (authLoading || !hasChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !cookieCheck) {
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
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Properties</h1>
            <p className="mt-2 text-gray-600">
              Manage your property listings
            </p>
          </div>
          <Button asChild>
            <Link href="/landlord/properties/new">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New Property
            </Link>
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading properties...</p>
          </div>
        )}

        {/* Properties Grid */}
        {!loading && properties.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No properties</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new property listing.</p>
            <div className="mt-6">
              <Button asChild>
                <Link href="/landlord/properties/new">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add New Property
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* Properties List */}
        {!loading && properties.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <div key={property.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
                {/* Property Image */}
                <div className="relative h-48 bg-gray-200">
                  <Image
                    src={getImageUrl(property.featured_image)}
                    alt={property.title}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-property.svg';
                    }}
                  />
                  {/* Status Badges */}
                  <div className="absolute top-2 right-2 flex gap-2">
                    {property.approved && (
                      <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded">
                        Approved
                      </span>
                    )}
                    {!property.approved && (
                      <span className="bg-yellow-500 text-white text-xs font-semibold px-2 py-1 rounded">
                        Pending
                      </span>
                    )}
                    {property.featured && (
                      <span className="bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded">
                        Featured
                      </span>
                    )}
                  </div>
                </div>

                {/* Property Details */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">
                    {property.title}
                  </h3>
                  
                  {property.university && (
                    <p className="text-sm text-gray-600 mb-2">
                      Near {property.university.name}
                    </p>
                  )}
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {property.address}
                  </p>

                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        {formatPrice(property.price_per_month, property.currency)}
                      </p>
                      <p className="text-xs text-gray-500">per month</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {property.rooms_available} / {property.total_rooms}
                      </p>
                      <p className="text-xs text-gray-500">rooms available</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link href={`/landlord/properties/${property.id}`}>
                        View
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link href={`/landlord/properties/${property.id}/edit`}>
                        Edit
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

