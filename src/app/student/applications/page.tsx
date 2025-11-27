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
  collexia_contract_reference?: string;
  collexia_student_id?: string;
  collexia_property_code?: string;
  collexia_student_registered?: boolean;
  collexia_property_registered?: boolean;
  collexia_mandate_registered?: boolean;
  collexia_integration_date?: string;
  collexia_integration_status?: string;
  collexia_error_message?: string;
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
  signed_lease_agreement?: {
    id: string;
    filename_download: string;
  } | null;
  signed_collexia_form?: {
    id: string;
    filename_download: string;
  } | null;
  pay_slip?: {
    id: string;
    filename_download: string;
  } | null;
  bank_statement?: {
    id: string;
    filename_download: string;
  } | null;
}

interface MandateStatus {
  application_id: number;
  application_status: string;
  property: any;
  contract_reference: string;
  mandate_status: any;
  mandate_error?: string;
}

export default function MyApplicationsPage() {
  const { user, isAuthenticated, isStudent, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasChecked, setHasChecked] = useState(false);
  const [hasCookie, setHasCookie] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [mandateStatuses, setMandateStatuses] = useState<MandateStatus[]>([]);
  const [loadingMandateStatus, setLoadingMandateStatus] = useState(false);

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
      } else if (isAuth && !isStudent) {
        if (user?.role && !isStudent) {
          router.push('/');
        }
      } else {
        fetchApplications();
      }
    }
  }, [authLoading, hasChecked, isAuthenticated, hasCookie, isStudent, router, user]);

  const fetchMandateStatuses = async () => {
    setLoadingMandateStatus(true);
    try {
      const token = localStorage.getItem('directus_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/student/mandate-status', {
        method: 'GET',
        credentials: 'include',
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        setMandateStatuses(data.mandates || []);
      }
    } catch (err: any) {
      console.error('Error fetching mandate statuses:', err);
    } finally {
      setLoadingMandateStatus(false);
    }
  };

  const fetchApplications = async () => {
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

      const response = await fetch('/api/applications', {
        method: 'GET',
        credentials: 'include',
        headers,
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications || []);
        
        // Fetch mandate statuses for approved applications
        setTimeout(() => {
          fetchMandateStatuses();
        }, 500);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load applications');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getDocumentUrl = (document: Application['signed_lease_agreement']) => {
    if (!document?.id) return null;
    return `/api/files/${document.id}`;
  };

  const handleDeleteApplication = async (applicationId: number) => {
    if (!confirm('Are you sure you want to delete this application? This action cannot be undone and will also delete all associated files.')) {
      return;
    }

    setDeletingId(applicationId);
    setError(null);

    try {
      const token = localStorage.getItem('directus_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/applications?id=${applicationId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers,
      });

      if (response.ok) {
        // Remove the application from the list
        setApplications(applications.filter(app => app.id !== applicationId));
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete application');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while deleting the application');
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading || !hasChecked || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading applications...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
          <p className="mt-2 text-gray-600">
            Track your property applications and their status.
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {applications.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Yet</h3>
                <p className="text-gray-600 mb-4">You haven't applied for any properties yet.</p>
                <Button asChild>
                  <Link href="/search">Browse Properties</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {applications.map((application) => (
              <Card key={application.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Property Image */}
                    <div className="relative w-full md:w-48 h-48 flex-shrink-0 rounded-lg overflow-hidden">
                      {application.property.featured_image?.id ? (
                        <Image
                          src={getImageUrl(application.property.featured_image.id)}
                          alt={application.property.title}
                          fill
                          sizes="192px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Application Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-1">
                            {application.property.title}
                          </h3>
                          <p className="text-gray-600 mb-2">{application.property.address}</p>
                          <p className="text-lg font-bold text-green-600">
                            {formatPrice(parseFloat(application.property.price_per_month), application.property.currency)}/month
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(application.status)}
                          <span className="text-sm text-gray-500">
                            Applied: {new Date(application.date_created).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {application.message && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Message:</span> {application.message}
                          </p>
                        </div>
                      )}

                      {/* Documents */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {application.signed_lease_agreement && (
                          <a
                            href={getDocumentUrl(application.signed_lease_agreement) || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            Lease Agreement
                          </a>
                        )}
                        {application.pay_slip && (
                          <a
                            href={`/api/files/${application.pay_slip.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            Pay Slip
                          </a>
                        )}
                        {application.bank_statement && (
                          <a
                            href={`/api/files/${application.bank_statement.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            Bank Statement
                          </a>
                        )}
                        {application.signed_collexia_form && (
                          <a
                            href={`/api/files/${application.signed_collexia_form.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-orange-50 text-orange-700 rounded-md hover:bg-orange-100 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            Collexia Form
                          </a>
                        )}
                      </div>

                      {/* Collexia Payment Collection Status */}
                      {application.status === 'approved' && (
                        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Payment Collection Status
                          </h4>
                          <div className="space-y-3">
                            {/* Integration Status */}
                            {application.collexia_integration_status && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-600">Integration Status:</span>
                                {application.collexia_integration_status === 'completed' ? (
                                  <Badge variant="success">Completed</Badge>
                                ) : application.collexia_integration_status === 'failed' ? (
                                  <Badge variant="destructive">Failed</Badge>
                                ) : (
                                  <Badge variant="warning">{application.collexia_integration_status}</Badge>
                                )}
                              </div>
                            )}

                            {/* Contract Reference */}
                            {application.collexia_contract_reference ? (
                              <div>
                                <p className="text-xs text-gray-600 mb-1">Contract Reference</p>
                                <p className="text-sm font-mono font-medium text-blue-900">{application.collexia_contract_reference}</p>
                              </div>
                            ) : (
                              <div className="bg-yellow-50 p-2 rounded border border-yellow-200">
                                <p className="text-xs text-yellow-800">⚠️ No contract reference yet. Integration may still be in progress.</p>
                              </div>
                            )}

                            {/* Registration Status */}
                            {(application.collexia_student_registered !== undefined || 
                              application.collexia_property_registered !== undefined || 
                              application.collexia_mandate_registered !== undefined) && (
                              <div className="space-y-1 text-xs">
                                <p className="text-gray-600 mb-1">Registration Status:</p>
                                <div className="flex flex-wrap gap-2">
                                  {application.collexia_student_registered !== undefined && (
                                    <span className={`px-2 py-1 rounded ${application.collexia_student_registered ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                      Student: {application.collexia_student_registered ? '✓' : '✗'}
                                    </span>
                                  )}
                                  {application.collexia_property_registered !== undefined && (
                                    <span className={`px-2 py-1 rounded ${application.collexia_property_registered ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                      Property: {application.collexia_property_registered ? '✓' : '✗'}
                                    </span>
                                  )}
                                  {application.collexia_mandate_registered !== undefined && (
                                    <span className={`px-2 py-1 rounded ${application.collexia_mandate_registered ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                      Mandate: {application.collexia_mandate_registered ? '✓' : '✗'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Error Message */}
                            {application.collexia_error_message && (
                              <div className="bg-red-50 p-2 rounded border border-red-200">
                                <p className="text-xs font-semibold text-red-800 mb-1">Error:</p>
                                <p className="text-xs text-red-700">{application.collexia_error_message}</p>
                              </div>
                            )}

                            {/* Mandate Status (if contract reference exists) */}
                            {application.collexia_contract_reference && (
                              <>
                                {(() => {
                                  const mandate = mandateStatuses.find(m => m.application_id === application.id);
                                  if (loadingMandateStatus) {
                                    return (
                                      <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                        Checking status...
                                      </div>
                                    );
                                  } else if (mandate?.mandate_status) {
                                    return (
                                      <div className="space-y-2">
                                        {mandate.mandate_status.mandateLoaded !== undefined && (
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-600">Mandate Loaded:</span>
                                            {mandate.mandate_status.mandateLoaded ? (
                                              <Badge variant="success">Active</Badge>
                                            ) : (
                                              <Badge variant="warning">Pending Activation</Badge>
                                            )}
                                          </div>
                                        )}
                                        <details className="text-xs">
                                          <summary className="cursor-pointer text-blue-600 hover:text-blue-700">View Full Status</summary>
                                          <pre className="mt-2 p-2 bg-white rounded border border-gray-200 overflow-auto max-h-40">
                                            {JSON.stringify(mandate.mandate_status, null, 2)}
                                          </pre>
                                        </details>
                                      </div>
                                    );
                                  } else if (mandate?.mandate_error) {
                                    return (
                                      <div className="bg-red-50 p-2 rounded border border-red-200">
                                        <p className="text-xs text-red-700">Error: {mandate.mandate_error}</p>
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/property/${application.property.id}`}>
                            View Property
                          </Link>
                        </Button>
                        {application.status !== 'approved' && application.status !== 'accepted' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteApplication(application.id)}
                            disabled={deletingId === application.id}
                          >
                            {deletingId === application.id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                                Deleting...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
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

