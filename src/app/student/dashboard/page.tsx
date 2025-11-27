'use client';

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils';
import { getImageUrl } from '@/lib/api';

interface Application {
  id: number;
  status: string;
  message: string;
  date_created: string;
  property: {
    id: number;
    title: string;
    address: string;
    price_per_month: string;
    currency: string;
    featured_image?: {
      id: string;
      filename_download: string;
    } | null;
  };
}

export default function StudentDashboard() {
  const { user, isAuthenticated, isStudent, isLoading, logout } = useAuth();
  const router = useRouter();
  const [hasChecked, setHasChecked] = useState(false);
  const [hasCookie, setHasCookie] = useState(false);
  const [applicationCount, setApplicationCount] = useState<number | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);

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
      } else if (isAuth && !isStudent) {
        // Only redirect if we know the role and it's not student
        // If role is unknown, allow access (will be validated on API calls)
        if (user?.role && !isStudent) {
          console.log('❌ Not a student, redirecting to home');
          router.push('/');
        } else {
          console.log('✅ Cookie present, allowing access (role will be validated on API calls)');
        }
      } else {
        console.log('✅ Authenticated as student or cookie present');
        // Check profile completion before allowing access to dashboard
        checkProfileCompletion();
      }
    }
  }, [isLoading, isAuthenticated, isStudent, hasCookie, router, hasChecked, user]);

  const checkProfileCompletion = async () => {
    try {
      const token = localStorage.getItem('directus_token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch('/api/profile/completion', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.completion && !data.completion.isComplete) {
          // Profile incomplete, redirect to complete profile page
          console.log('❌ Profile incomplete, redirecting to complete profile');
          router.push('/student/complete-profile');
        } else {
          // Profile complete, allow access to dashboard
          console.log('✅ Profile complete, loading dashboard');
          fetchApplicationCount();
          fetchRecentApplications();
        }
      } else {
        // If check fails, still allow access (will be validated on API calls)
        console.log('⚠️ Profile check failed, allowing access');
        fetchApplicationCount();
        fetchRecentApplications();
      }
    } catch (err) {
      console.error('Error checking profile completion:', err);
      // If check fails, still allow access (will be validated on API calls)
      fetchApplicationCount();
      fetchRecentApplications();
    }
  };

  const fetchApplicationCount = async () => {
    try {
      const token = localStorage.getItem('directus_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/applications', {
        method: 'GET',
        credentials: 'include',
        headers,
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        setApplicationCount(data.count || 0);
      }
    } catch (err) {
      console.error('Error fetching application count:', err);
    }
  };

  const fetchRecentApplications = async () => {
    setIsLoadingApplications(true);
    try {
      const token = localStorage.getItem('directus_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/applications', {
        method: 'GET',
        credentials: 'include',
        headers,
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        // Get the 3 most recent applications
        const recent = (data.applications || []).slice(0, 3);
        setApplications(recent);
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setIsLoadingApplications(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'approved':
      case 'accepted':
        return <Badge variant="success">Approved</Badge>;
      case 'rejected':
      case 'declined':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Show loading state while checking authentication
  if (isLoading || !hasChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show loading if no cookie and not authenticated (will redirect)
  if (!isAuthenticated && !hasCookie) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  const pendingCount = applications.filter(app => app.status.toLowerCase() === 'pending').length;
  const approvedCount = applications.filter(app => app.status.toLowerCase() === 'approved' || app.status.toLowerCase() === 'accepted').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Welcome back, {user?.first_name || 'Student'}! 👋
              </h1>
              <p className="text-lg text-gray-600">
                Find and manage your perfect student accommodation
              </p>
            </div>
            <Button asChild className="pozi-green">
              <Link href="/search">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search Properties
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Applications */}
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1">Total Applications</p>
                  <p className="text-3xl font-bold">{applicationCount !== null ? applicationCount : '—'}</p>
                </div>
                <div className="bg-white/20 rounded-full p-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Applications */}
          <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium mb-1">Pending Review</p>
                  <p className="text-3xl font-bold">{pendingCount}</p>
                </div>
                <div className="bg-white/20 rounded-full p-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Approved Applications */}
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium mb-1">Approved</p>
                  <p className="text-3xl font-bold">{approvedCount}</p>
                </div>
                <div className="bg-white/20 rounded-full p-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium mb-1">Quick Actions</p>
                  <p className="text-lg font-semibold">Get Started</p>
                </div>
                <div className="bg-white/20 rounded-full p-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Applications - Takes 2 columns */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-bold text-gray-900">Recent Applications</CardTitle>
                  <Link 
                    href="/student/applications"
                    className="text-green-600 hover:text-green-700 font-medium text-sm flex items-center transition-colors"
                  >
                    View All
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingApplications ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  </div>
                ) : applications.length > 0 ? (
                  <div className="space-y-4">
                    {applications.map((application) => (
                      <Link
                        key={application.id}
                        href={`/student/applications`}
                        className="block group"
                      >
                        <div className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:shadow-md transition-all duration-200 bg-white group-hover:bg-gray-50">
                          {application.property.featured_image?.id && (
                            <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                              <Image
                                src={getImageUrl(application.property.featured_image.id)}
                                alt={application.property.title}
                                fill
                                sizes="80px"
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors duration-200 truncate">
                                  {application.property.title}
                                </h3>
                                <p className="text-sm text-gray-600 truncate">{application.property.address}</p>
                                <div className="flex items-center gap-3 mt-2">
                                  <span className="text-sm font-bold text-green-600">
                                    {formatPrice(parseFloat(application.property.price_per_month), application.property.currency)}/month
                                  </span>
                                  <span className="text-gray-400">•</span>
                                  <span className="text-xs text-gray-500">
                                    Applied {new Date(application.date_created).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              <div className="flex-shrink-0">
                                {getStatusBadge(application.status)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500 mb-4">No applications yet</p>
                    <Button asChild className="pozi-green">
                      <Link href="/search">Start Searching</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Actions Card */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link 
                  href="/search" 
                  className="flex items-center gap-3 p-4 rounded-lg bg-green-50 hover:bg-green-100 transition-colors duration-200 group"
                >
                  <div className="p-2 rounded-full bg-green-200 group-hover:bg-green-300 transition-colors duration-200">
                    <svg className="h-5 w-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-green-800 group-hover:text-green-900 transition-colors duration-200">Search Properties</span>
                    <p className="text-xs text-green-600">Find your perfect home</p>
                  </div>
                </Link>
                
                <Link 
                  href="/student/applications" 
                  className="flex items-center gap-3 p-4 rounded-lg hover:bg-gray-50 transition-colors duration-200 group"
                >
                  <div className="p-2 rounded-full bg-gray-100 group-hover:bg-gray-200 transition-colors duration-200">
                    <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-gray-700 group-hover:text-gray-900 transition-colors duration-200">My Applications</span>
                    <p className="text-xs text-gray-500">Track your applications</p>
                  </div>
                  {applicationCount !== null && applicationCount > 0 && (
                    <Badge variant="info" className="ml-auto">{applicationCount}</Badge>
                  )}
                </Link>
                
                <Link 
                  href="/student/saved" 
                  className="flex items-center gap-3 p-4 rounded-lg hover:bg-gray-50 transition-colors duration-200 group"
                >
                  <div className="p-2 rounded-full bg-gray-100 group-hover:bg-gray-200 transition-colors duration-200">
                    <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-gray-700 group-hover:text-gray-900 transition-colors duration-200">Saved Properties</span>
                    <p className="text-xs text-gray-500">Your favorites</p>
                  </div>
                </Link>
                
                <Link 
                  href="/student/profile" 
                  className="flex items-center gap-3 p-4 rounded-lg hover:bg-gray-50 transition-colors duration-200 group"
                >
                  <div className="p-2 rounded-full bg-gray-100 group-hover:bg-gray-200 transition-colors duration-200">
                    <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-gray-700 group-hover:text-gray-900 transition-colors duration-200">My Profile</span>
                    <p className="text-xs text-gray-500">View profile & documents</p>
                  </div>
                </Link>
              </CardContent>
            </Card>

            {/* Help Card */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader>
                <CardTitle className="text-lg">Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  Have questions about applying for properties or need assistance?
                </p>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/contact">
                    Contact Support
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
