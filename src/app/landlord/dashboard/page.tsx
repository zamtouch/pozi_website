'use client';

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Property {
  id: number;
  title: string;
  description: string;
  price_per_month: string;
  currency: string;
  address: string;
  rooms_available: number;
  total_rooms: number;
  approved: boolean | number;
  featured: boolean | number;
  featured_image?: {
    id: string;
    filename_download: string;
  } | null;
  lease_agreement?: {
    id: string;
    filename_download: string;
  } | null;
  date_created?: string;
}

interface DashboardStats {
  totalProperties: number;
  approvedProperties: number;
  pendingProperties: number;
  totalRoomsAvailable: number;
  featuredProperties: number;
}

export default function LandlordDashboard() {
  const { user, isAuthenticated, isLandlord, isLoading, logout } = useAuth();
  const router = useRouter();
  const [hasChecked, setHasChecked] = useState(false);
  const [hasCookie, setHasCookie] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    approvedProperties: 0,
    pendingProperties: 0,
    totalRoomsAvailable: 0,
    featuredProperties: 0,
  });
  const [loading, setLoading] = useState(true);

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
    // Only check after loading is complete AND we haven't checked yet
    if (!isLoading && !hasChecked) {
      setHasChecked(true);
      
      // Check if cookie exists OR auth context says authenticated
      const isAuth = isAuthenticated || hasCookie;
      
      if (!isAuth) {
        console.log('❌ No cookie or auth, redirecting to login');
        router.push('/auth/login');
        return;
      } else if (isAuth && !isLandlord) {
        // Only redirect if we know the role and it's not landlord
        // If role is unknown, allow access (will be validated on API calls)
        if (user?.role && !isLandlord) {
          console.log('❌ Not a landlord, redirecting to home');
          router.push('/');
          return;
        } else {
          console.log('✅ Cookie present, allowing access (role will be validated on API calls)');
          fetchProperties();
        }
      } else {
        console.log('✅ Authenticated as landlord or cookie present');
        fetchProperties();
      }
    }
  }, [isLoading, isAuthenticated, isLandlord, hasCookie, router, hasChecked, user]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('directus_token');
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
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
        const props = data.properties || [];
        setProperties(props);
        
        // Calculate stats
        const total = props.length;
        const approved = props.filter((p: Property) => p.approved === true || p.approved === 1).length;
        const pending = total - approved;
        const totalRooms = props.reduce((sum: number, p: Property) => sum + (p.rooms_available || 0), 0);
        const featured = props.filter((p: Property) => p.featured === true || p.featured === 1).length;
        
        setStats({
          totalProperties: total,
          approvedProperties: approved,
          pendingProperties: pending,
          totalRoomsAvailable: totalRooms,
          featuredProperties: featured,
        });
      }
    } catch (err: any) {
      console.error('Error fetching properties:', err);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (image: Property['featured_image']) => {
    if (!image?.id) return '/placeholder-property.svg';
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Show loading state while checking authentication
  if (isLoading || !hasChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show loading if no cookie and not authenticated (will redirect)
  if (!isAuthenticated && !hasCookie) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  const recentProperties = properties
    .sort((a, b) => {
      const dateA = a.date_created ? new Date(a.date_created).getTime() : 0;
      const dateB = b.date_created ? new Date(b.date_created).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 relative">
      {/* Loading overlay - only shows when fetching properties */}
      {loading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading properties...</p>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Welcome back, {user?.first_name || 'Property Owner'}! 👋
              </h1>
              <p className="text-lg text-gray-600">
                Here's an overview of your property portfolio
              </p>
            </div>
            <Button asChild className="pozi-green">
              <Link href="/landlord/properties/new">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add New Property
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Properties */}
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1">Total Properties</p>
                  <p className="text-3xl font-bold">{stats.totalProperties}</p>
                </div>
                <div className="bg-white/20 rounded-full p-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Approved Properties */}
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium mb-1">Approved</p>
                  <p className="text-3xl font-bold">{stats.approvedProperties}</p>
                </div>
                <div className="bg-white/20 rounded-full p-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Properties */}
          <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium mb-1">Pending Review</p>
                  <p className="text-3xl font-bold">{stats.pendingProperties}</p>
                </div>
                <div className="bg-white/20 rounded-full p-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Rooms Available */}
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium mb-1">Rooms Available</p>
                  <p className="text-3xl font-bold">{stats.totalRoomsAvailable}</p>
                </div>
                <div className="bg-white/20 rounded-full p-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Properties - Takes 2 columns */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Recent Properties</h2>
                  <Link 
                    href="/landlord/properties"
                    className="text-brand-600 hover:text-brand-700 font-medium text-sm flex items-center"
                  >
                    View All
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>

                {recentProperties.length > 0 ? (
                  <div className="space-y-4">
                    {recentProperties.map((property) => (
                      <Link
                        key={property.id}
                        href={`/landlord/properties/${property.id}`}
                        className="block group"
                      >
                        <div className="flex gap-4 p-4 rounded-lg border border-gray-200 hover:border-brand-300 hover:shadow-md transition-all">
                          <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                            <Image
                              src={getImageUrl(property.featured_image)}
                              alt={property.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors truncate">
                                  {property.title}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                  {property.address}
                                </p>
                                <div className="flex items-center gap-4 mt-2">
                                  <span className="text-lg font-bold text-brand-600">
                                    {formatPrice(property.price_per_month, property.currency)}/mo
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    {property.rooms_available} / {property.total_rooms} rooms
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2 ml-4">
                                {property.approved === true || property.approved === 1 ? (
                                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                    Approved
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                    Pending
                                  </span>
                                )}
                                {property.featured === true || property.featured === 1 ? (
                                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                    Featured
                                  </span>
                                ) : null}
                                {property.lease_agreement?.id && (
                                  <div className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 bg-gray-50 rounded-full border border-gray-200">
                                    <svg className="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-xs">Contract</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-gray-400 mt-2">
                              Added {formatDate(property.date_created)}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <p className="text-gray-500 mb-4">No properties yet</p>
                    <Button asChild className="pozi-green">
                      <Link href="/landlord/properties/new">Add Your First Property</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions - Takes 1 column */}
          <div className="space-y-6">
            {/* Quick Actions Card */}
            <Card className="shadow-lg border-0">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <Link
                    href="/landlord/properties/new"
                    className="flex items-center gap-3 p-3 rounded-lg bg-brand-50 hover:bg-brand-100 transition-colors group"
                  >
                    <div className="bg-brand-600 rounded-lg p-2 group-hover:scale-110 transition-transform">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">List New Property</p>
                      <p className="text-sm text-gray-500">Add a property to your portfolio</p>
                    </div>
                  </Link>

                  <Link
                    href="/landlord/properties"
                    className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors group"
                  >
                    <div className="bg-blue-600 rounded-lg p-2 group-hover:scale-110 transition-transform">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Manage Properties</p>
                      <p className="text-sm text-gray-500">View and edit all listings</p>
                    </div>
                  </Link>

                  <Link
                    href="/landlord/applications"
                    className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors group"
                  >
                    <div className="bg-purple-600 rounded-lg p-2 group-hover:scale-110 transition-transform">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">View Applications</p>
                      <p className="text-sm text-gray-500">Review and manage applications</p>
                    </div>
                  </Link>

                  <Link
                    href="/landlord/settings"
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group"
                  >
                    <div className="bg-gray-600 rounded-lg p-2 group-hover:scale-110 transition-transform">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Account Settings</p>
                      <p className="text-sm text-gray-500">Manage your profile</p>
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Portfolio Summary */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-brand-50 to-brand-100">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Portfolio Summary</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Properties</span>
                    <span className="font-bold text-gray-900">{stats.totalProperties}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Featured Listings</span>
                    <span className="font-bold text-gray-900">{stats.featuredProperties}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Approval Rate</span>
                    <span className="font-bold text-gray-900">
                      {stats.totalProperties > 0 
                        ? Math.round((stats.approvedProperties / stats.totalProperties) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="pt-4 border-t border-brand-200">
                    <Link
                      href="/landlord/properties"
                      className="block w-full text-center py-2 px-4 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium"
                    >
                      View Full Portfolio
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
