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

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  responsible_first_name?: string;
  responsible_last_name?: string;
  responsible_relationship?: string;
  responsible_email?: string;
  responsible_id_number?: string;
  responsible_cell?: string;
  responsible_occupation?: string;
}

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
  student: Student | string;
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

// Helper function to get status badge - shared between components
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

export default function LandlordApplicationsPage() {
  const { user, isAuthenticated, isLandlord, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasChecked, setHasChecked] = useState(false);
  const [hasCookie, setHasCookie] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [mandateStatuses, setMandateStatuses] = useState<Record<number, MandateStatus>>({});
  const [loadingMandateStatus, setLoadingMandateStatus] = useState<Record<number, boolean>>({});

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
      } else if (isAuth && !isLandlord) {
        if (user?.role && !isLandlord) {
          router.push('/');
        }
      } else {
        fetchApplications();
        fetchMandateStatuses();
      }
    }
  }, [authLoading, hasChecked, isAuthenticated, hasCookie, isLandlord, router, user, statusFilter]);

  const fetchMandateStatuses = async () => {
    try {
      const token = localStorage.getItem('directus_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Fetch all approved applications with contract references
      const approvedApps = applications.filter((app: Application) => 
        app.status.toLowerCase() === 'approved' && app.collexia_contract_reference
      );
      
      if (approvedApps.length === 0) return;

      // Fetch mandate status for each approved application
      const statusPromises = approvedApps.map(async (app: Application) => {
        if (!app.collexia_contract_reference) return null;
        
        setLoadingMandateStatus(prev => ({ ...prev, [app.id]: true }));
        try {
          const statusResponse = await fetch('/api/student/mandate-status?application_id=' + app.id, {
            method: 'GET',
            credentials: 'include',
            headers,
          });
          
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            if (statusData.mandates && statusData.mandates.length > 0) {
              const mandate = statusData.mandates[0];
              setMandateStatuses(prev => ({ ...prev, [app.id]: mandate }));
            }
          }
        } catch (err) {
          console.error('Error fetching mandate status for application', app.id, err);
        } finally {
          setLoadingMandateStatus(prev => ({ ...prev, [app.id]: false }));
        }
        return null;
      });
      
      await Promise.all(statusPromises);
    } catch (err: any) {
      console.error('Error fetching mandate statuses:', err);
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

      const url = statusFilter !== 'all' 
        ? `/api/landlord/applications?status=${statusFilter}`
        : '/api/landlord/applications';

      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers,
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications || []);
        
        // Refresh mandate statuses for approved applications after a short delay
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

  const handleStatusUpdate = async (applicationId: number, newStatus: string) => {
    if (!confirm(`Are you sure you want to ${newStatus === 'approved' ? 'approve' : 'reject'} this application?`)) {
      return;
    }

    setUpdatingStatus(applicationId);
    setError(null);

    try {
      console.log(`🔄 Updating application ${applicationId} to status: ${newStatus}`);
      const token = localStorage.getItem('directus_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/landlord/applications/${applicationId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers,
        body: JSON.stringify({ status: newStatus }),
      });

      console.log(`📡 Response status: ${response.status}`);

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Application status updated:', responseData);
        
        // Check if there's a Collexia warning (non-blocking)
        if (responseData.collexia?.warning) {
          console.warn('⚠️ Collexia warning:', responseData.collexia.warning);
          // Show info message but don't fail - approval succeeded
          alert(`Application ${newStatus} successfully!\n\nNote: ${responseData.collexia.warning}`);
        } else if (responseData.collexia?.success) {
          console.log('✅ Collexia integration completed:', responseData.collexia);
        }
        
        // Refresh applications
        await fetchApplications();
        // Refresh mandate statuses if approved
        if (newStatus === 'approved') {
          setTimeout(() => {
            fetchMandateStatuses();
          }, 1000);
        }
        if (selectedApplication?.id === applicationId) {
          setSelectedApplication(null);
        }
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error || `Failed to ${newStatus} application`;
        console.error('❌ Failed to update application:', errorMessage, errorData);
        setError(errorMessage);
        alert(`Error: ${errorMessage}`);
      }
    } catch (err: any) {
      console.error('❌ Exception during application update:', err);
      const errorMessage = err.message || 'An error occurred while updating application';
      setError(errorMessage);
      alert(`Error: ${errorMessage}`);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStudentInfo = (application: Application): Student | null => {
    if (typeof application.student === 'object') {
      return application.student;
    }
    return null;
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

  const filteredApplications = applications;
  const pendingCount = applications.filter(app => app.status.toLowerCase() === 'pending').length;
  const approvedCount = applications.filter(app => app.status.toLowerCase() === 'approved' || app.status.toLowerCase() === 'accepted').length;
  const rejectedCount = applications.filter(app => app.status.toLowerCase() === 'rejected' || app.status.toLowerCase() === 'declined').length;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Property Applications</h1>
              <p className="mt-2 text-gray-600">
                Review and manage applications for your properties
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/landlord/dashboard">Back to Dashboard</Link>
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Total Applications</p>
                <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Approved</p>
                <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              statusFilter === 'all'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            All ({applications.length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              statusFilter === 'pending'
                ? 'border-yellow-600 text-yellow-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              statusFilter === 'approved'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Approved ({approvedCount})
          </button>
          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              statusFilter === 'rejected'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Rejected ({rejectedCount})
          </button>
        </div>

        {filteredApplications.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications</h3>
                <p className="text-gray-600">
                  {statusFilter !== 'all' 
                    ? `No ${statusFilter} applications found.`
                    : 'You haven\'t received any applications yet.'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Applications List */}
            <div className="lg:col-span-2 space-y-4">
              {filteredApplications.map((application) => {
                const student = getStudentInfo(application);
                return (
                  <Card 
                    key={application.id} 
                    className={`cursor-pointer hover:shadow-lg transition-shadow ${
                      selectedApplication?.id === application.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedApplication(application)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex gap-4">
                        {application.property.featured_image?.id && (
                          <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                            <Image
                              src={getImageUrl(application.property.featured_image.id)}
                              alt={application.property.title}
                              fill
                              sizes="96px"
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-gray-900 mb-1">
                                {application.property.title}
                              </h3>
                              <p className="text-sm text-gray-600 mb-2">{application.property.address}</p>
                              {student && (
                                <p className="text-sm font-medium text-gray-900">
                                  Applicant: {student.first_name} {student.last_name}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              {getStatusBadge(application.status)}
                              <span className="text-xs text-gray-500">
                                {new Date(application.date_created).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Application Details Sidebar */}
            <div className="lg:col-span-1">
              {selectedApplication ? (
                <ApplicationDetails
                  application={selectedApplication}
                  onStatusUpdate={handleStatusUpdate}
                  updatingStatus={updatingStatus}
                  mandateStatus={mandateStatuses[selectedApplication.id]}
                  loadingMandateStatus={loadingMandateStatus[selectedApplication.id]}
                />
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <p className="text-gray-500">Select an application to view details</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ApplicationDetails({ 
  application, 
  onStatusUpdate, 
  updatingStatus,
  mandateStatus,
  loadingMandateStatus
}: { 
  application: Application; 
  onStatusUpdate: (id: number, status: string) => void;
  updatingStatus: number | null;
  mandateStatus?: MandateStatus;
  loadingMandateStatus?: boolean;
}) {
  const student = typeof application.student === 'object' ? application.student : null;

  // Helper function to get status badge
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

  return (
    <Card className="sticky top-24">
      <CardHeader>
        <CardTitle>Application Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Property Info */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Property</h3>
          <p className="text-sm text-gray-700">{application.property.title}</p>
          <p className="text-sm text-gray-600">{application.property.address}</p>
          <p className="text-sm font-medium text-green-600 mt-1">
            {formatPrice(parseFloat(application.property.price_per_month), application.property.currency)}/month
          </p>
        </div>

        {/* Applicant Info */}
        {student && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Applicant Information</h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Name:</span> {student.first_name} {student.last_name}</p>
              <p><span className="font-medium">Email:</span> {student.email}</p>
              {student.phone && (
                <p><span className="font-medium">Phone:</span> {student.phone}</p>
              )}
            </div>
          </div>
        )}

        {/* Person Responsible for Payment */}
        {student && (student.responsible_first_name || student.responsible_email) && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Person Responsible for Payment</h3>
            <div className="space-y-2 text-sm">
              {student.responsible_first_name && (
                <p><span className="font-medium">Name:</span> {student.responsible_first_name} {student.responsible_last_name || ''}</p>
              )}
              {student.responsible_relationship && (
                <p><span className="font-medium">Relationship:</span> {student.responsible_relationship}</p>
              )}
              {student.responsible_email && (
                <p><span className="font-medium">Email:</span> {student.responsible_email}</p>
              )}
              {student.responsible_cell && (
                <p><span className="font-medium">Cell:</span> {student.responsible_cell}</p>
              )}
              {student.responsible_id_number && (
                <p><span className="font-medium">ID Number:</span> {student.responsible_id_number}</p>
              )}
              {student.responsible_occupation && (
                <p><span className="font-medium">Occupation:</span> {student.responsible_occupation}</p>
              )}
            </div>
          </div>
        )}

        {/* Message */}
        {application.message && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Message</h3>
            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{application.message}</p>
          </div>
        )}

        {/* Attached Files */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Attached Documents</h3>
          <div className="space-y-2">
            {application.signed_lease_agreement && (
              <a
                href={`/api/files/${application.signed_lease_agreement.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Signed Lease Agreement
              </a>
            )}
            {application.signed_collexia_form && (
              <a
                href={`/api/files/${application.signed_collexia_form.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Signed Collexia Form
              </a>
            )}
            {application.pay_slip && (
              <a
                href={`/api/files/${application.pay_slip.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
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
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Bank Statement
              </a>
            )}
            {!application.signed_lease_agreement && !application.signed_collexia_form && !application.pay_slip && !application.bank_statement && (
              <p className="text-sm text-gray-500">No documents attached</p>
            )}
          </div>
        </div>

        {/* Collexia Payment Collection Info */}
        {application.status.toLowerCase() === 'approved' && (
          <div className="pt-4 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">Payment Collection (Collexia)</h3>
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
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Contract Reference</p>
                  <p className="text-sm font-mono font-medium text-blue-900">{application.collexia_contract_reference}</p>
                </div>
              ) : (
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <p className="text-xs text-yellow-800">⚠️ No contract reference yet. Integration may still be in progress.</p>
                </div>
              )}

              {/* Student & Property IDs */}
              {(application.collexia_student_id || application.collexia_property_code) && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {application.collexia_student_id && (
                    <div>
                      <p className="text-gray-600 mb-1">Student ID:</p>
                      <p className="font-mono">{application.collexia_student_id}</p>
                    </div>
                  )}
                  {application.collexia_property_code && (
                    <div>
                      <p className="text-gray-600 mb-1">Property Code:</p>
                      <p className="font-mono">{application.collexia_property_code}</p>
                    </div>
                  )}
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

              {/* Integration Date */}
              {application.collexia_integration_date && (
                <p className="text-xs text-gray-500">
                  Integrated: {new Date(application.collexia_integration_date).toLocaleString()}
                </p>
              )}

              {/* Mandate Status (if contract reference exists) */}
              {application.collexia_contract_reference && (
                <>
                  {loadingMandateStatus ? (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      Checking mandate status...
                    </div>
                  ) : mandateStatus?.mandate_status ? (
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Mandate Status</p>
                        <div className="bg-white p-2 rounded border border-gray-200">
                          <pre className="text-xs overflow-auto max-h-40">
                            {JSON.stringify(mandateStatus.mandate_status, null, 2)}
                          </pre>
                        </div>
                      </div>
                      {mandateStatus.mandate_status?.mandateLoaded !== undefined && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600">Mandate Loaded:</span>
                          {mandateStatus.mandate_status.mandateLoaded ? (
                            <Badge variant="success">Active</Badge>
                          ) : (
                            <Badge variant="warning">Pending</Badge>
                          )}
                        </div>
                      )}
                    </div>
                  ) : mandateStatus?.mandate_error ? (
                    <div className="bg-red-50 p-2 rounded border border-red-200">
                      <p className="text-xs text-red-700">Error: {mandateStatus.mandate_error}</p>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
        )}

        {/* Status and Actions */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-700">Status:</span>
            {getStatusBadge(application.status)}
          </div>
          
          {application.status.toLowerCase() === 'pending' && (
            <div className="flex gap-2">
              <Button
                onClick={() => onStatusUpdate(application.id, 'approved')}
                disabled={updatingStatus === application.id}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {updatingStatus === application.id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Approving...
                  </>
                ) : (
                  'Approve'
                )}
              </Button>
              <Button
                onClick={() => onStatusUpdate(application.id, 'rejected')}
                disabled={updatingStatus === application.id}
                variant="destructive"
                className="flex-1"
              >
                {updatingStatus === application.id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Rejecting...
                  </>
                ) : (
                  'Reject'
                )}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

