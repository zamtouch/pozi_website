'use client';

import { useAuth } from '@/lib/auth';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { useEffect, useState, useCallback, useRef } from 'react';
import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatPrice } from '@/lib/utils';
import { getImageUrl } from '@/lib/api';
import Image from 'next/image';

interface Property {
  id: number;
  title: string;
  address: string;
  price_per_month: string;
  currency: string;
  featured_image?: {
    id: string;
    filename_download: string;
  } | null;
  lease_agreement?: {
    id: string;
    filename_download: string;
  } | null;
}

interface UploadedDocument {
  id: string;
  filename_download: string;
}

export default function ApplyPage() {
  const { user, isAuthenticated, isStudent, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const propertyId = params.propertyId as string;

  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [hasCookie, setHasCookie] = useState(false);

  const [message, setMessage] = useState('');
  const [signedLeaseAgreement, setSignedLeaseAgreement] = useState<UploadedDocument | null>(null);
  const [signedCollexiaForm, setSignedCollexiaForm] = useState<UploadedDocument | null>(null);
  const [collexiaFormId, setCollexiaFormId] = useState<string | null>(null);

  const [uploadingLeaseAgreement, setUploadingLeaseAgreement] = useState(false);
  const [uploadingCollexiaForm, setUploadingCollexiaForm] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false); // Track if form was successfully submitted
  
  // Use refs to track current values for cleanup (avoid stale closures)
  const formSubmittedRef = useRef(false);
  const signedLeaseAgreementRef = useRef<UploadedDocument | null>(null);
  const signedCollexiaFormRef = useRef<UploadedDocument | null>(null);
  
  // Keep refs in sync with state
  useEffect(() => {
    formSubmittedRef.current = formSubmitted;
    signedLeaseAgreementRef.current = signedLeaseAgreement;
    signedCollexiaFormRef.current = signedCollexiaForm;
  }, [formSubmitted, signedLeaseAgreement, signedCollexiaForm]);

  // Debug: Log when collexiaFormId changes
  useEffect(() => {
    if (collexiaFormId) {
      console.log('✅ Collexia form ID set in state:', collexiaFormId);
    } else {
      console.log('⚠️ Collexia form ID is null');
    }
  }, [collexiaFormId]);

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
        fetchProperty();
        fetchDefaults();
      }
    }
  }, [authLoading, hasChecked, isAuthenticated, hasCookie, isStudent, router, user]);

  const fetchDefaults = async () => {
    try {
      const token = localStorage.getItem('directus_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Try the proxy API route first
      let response = await fetch('/api/defaults', {
        method: 'GET',
        credentials: 'include',
        headers,
        cache: 'no-store',
      });

      // If proxy fails, try direct API call as fallback
      if (!response.ok) {
        console.warn('⚠️ Proxy API failed, trying direct API call...');
        response = await fetch('https://app.pozi.com.na/items/defaults', {
          method: 'GET',
          credentials: 'include',
          headers,
          cache: 'no-store',
        });
      }

      if (response.ok) {
        const data = await response.json();
        console.log('📋 Defaults data received:', data);
        
        // Handle both proxy response format { success: true, data: {...} } and direct API format { data: {...} }
        const defaultsData = data.success ? data.data : data.data;
        
        if (defaultsData?.collexia_form) {
          console.log('✅ Collexia form ID found:', defaultsData.collexia_form);
          setCollexiaFormId(defaultsData.collexia_form);
        } else {
          console.warn('⚠️ No collexia_form in defaults data:', defaultsData);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Failed to fetch defaults:', response.status, errorData);
      }
    } catch (err: any) {
      console.error('❌ Error fetching defaults:', err.message);
    }
  };

  const fetchProperty = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        setProperty(data.property);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Property not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load property');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentUpload = async (
    file: File,
    setDocument: (doc: UploadedDocument) => void,
    setUploading: (loading: boolean) => void
  ) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Only PDF, JPEG, and PNG files are allowed.');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setError(`File size (${fileSizeMB}MB) exceeds the maximum allowed size of 5MB. Please compress the file and try again.`);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const token = localStorage.getItem('directus_token');
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      console.log('📤 Uploading file:', { fileName: file.name, fileSize: file.size, fileType: file.type });

      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      // Don't set Content-Type for FormData - browser will set it automatically with boundary

      const response = await fetch('/api/upload-document', {
        method: 'POST',
        credentials: 'include',
        headers,
        body: uploadFormData,
      });

      console.log('📤 Upload response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Upload successful:', data);
        if (data.data) {
          setDocument(data.data);
          setSuccess(true);
          setTimeout(() => setSuccess(false), 3000);
        } else {
          console.error('❌ No data in response:', data);
          setError('Upload succeeded but no file data returned');
        }
      } else {
        let errorMessage = 'Failed to upload document';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          console.error('❌ Upload failed:', errorData);
          if (errorData.debug) {
            console.error('Debug info:', errorData.debug);
          }
        } catch (parseError) {
          const text = await response.text();
          console.error('❌ Failed to parse error response:', text);
          errorMessage = `Upload failed with status ${response.status}`;
        }
        setError(errorMessage);
      }
    } catch (err: any) {
      console.error('❌ Upload error:', err);
      setError(err.message || 'An error occurred while uploading document');
    } finally {
      setUploading(false);
    }
  };

  // Function to delete a document from Directus
  const handleDocumentDelete = useCallback(async (fileId: string) => {
    try {
      const token = localStorage.getItem('directus_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/upload-document?id=${fileId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers,
      });

      if (!response.ok) {
        console.warn('Failed to delete file from Directus (non-critical)');
      }
    } catch (err) {
      console.error('Error deleting file from Directus:', err);
    }
  }, []);

  // Cleanup function to delete orphaned files (uses refs to avoid stale closures)
  const cleanupOrphanedFiles = useCallback(async () => {
    // Only cleanup if form wasn't successfully submitted
    if (formSubmittedRef.current) {
      return;
    }

    const filesToDelete: string[] = [];
    if (signedLeaseAgreementRef.current?.id) filesToDelete.push(signedLeaseAgreementRef.current.id);
    if (signedCollexiaFormRef.current?.id) filesToDelete.push(signedCollexiaFormRef.current.id);

    if (filesToDelete.length === 0) {
      return;
    }

    console.log('🧹 Cleaning up orphaned files:', filesToDelete);

    // Delete files in parallel (non-blocking)
    const deletePromises = filesToDelete.map(fileId => handleDocumentDelete(fileId));
    await Promise.allSettled(deletePromises);
  }, [handleDocumentDelete]);

  // Store file IDs in sessionStorage for reliable cleanup
  const STORAGE_KEY = `application_files_${propertyId}`;
  
  // Update sessionStorage whenever files change
  useEffect(() => {
    const fileIds: string[] = [];
    if (signedLeaseAgreement?.id) fileIds.push(signedLeaseAgreement.id);
    if (signedCollexiaForm?.id) fileIds.push(signedCollexiaForm.id);
    
    if (fileIds.length > 0) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(fileIds));
      console.log('💾 Stored file IDs in sessionStorage:', fileIds);
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [signedLeaseAgreement, signedCollexiaForm, STORAGE_KEY]);

  // Helper function to perform cleanup (used in multiple places)
  const performCleanup = useCallback(() => {
    console.log('🧹 performCleanup called');
    console.log('  formSubmittedRef.current:', formSubmittedRef.current);
    console.log('  signedLeaseAgreementRef.current:', signedLeaseAgreementRef.current);
    
    if (formSubmittedRef.current) {
      console.log('⏭️ Skipping cleanup - form was submitted');
      // Clear sessionStorage since files are now part of application
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }

    // Get files from both refs and sessionStorage (for reliability)
    const filesToDelete: string[] = [];
    
    // From refs
    if (signedLeaseAgreementRef.current?.id) filesToDelete.push(signedLeaseAgreementRef.current.id);
    if (signedCollexiaFormRef.current?.id) filesToDelete.push(signedCollexiaFormRef.current.id);
    
    // From sessionStorage (backup)
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const storedIds: string[] = JSON.parse(stored);
        storedIds.forEach(id => {
          if (!filesToDelete.includes(id)) {
            filesToDelete.push(id);
          }
        });
      }
    } catch (e) {
      console.warn('⚠️ Failed to read from sessionStorage:', e);
    }

    if (filesToDelete.length === 0) {
      console.log('⏭️ No files to cleanup');
      return;
    }

    console.log('🧹 Performing cleanup for files:', filesToDelete);

    // Delete files - use fetch with keepalive for reliability
    const token = localStorage.getItem('directus_token') || '';
    
    // Use Promise.allSettled to ensure all requests are sent
    const deletePromises = filesToDelete.map(fileId => {
      console.log(`  🗑️ Deleting file: ${fileId}`);
      return fetch(`/api/upload-document?id=${fileId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        keepalive: true, // Important: keeps request alive even after page unloads
      }).then(response => {
        if (response.ok) {
          console.log(`  ✅ Deleted file: ${fileId}`);
        } else {
          console.warn(`  ⚠️ Failed to delete file: ${fileId}`, response.status);
        }
      }).catch(err => {
        console.warn(`  ❌ Error deleting file ${fileId}:`, err);
      });
    });
    
    // Wait for all deletions to be initiated (but don't block)
    Promise.allSettled(deletePromises).then(() => {
      console.log('🧹 Cleanup requests completed');
      // Clear sessionStorage after cleanup
      sessionStorage.removeItem(STORAGE_KEY);
    });
  }, [STORAGE_KEY]);

  // Track previous pathname to detect navigation away from this page
  const prevPathnameRef = useRef(pathname);
  const currentApplyPath = `/student/apply/${propertyId}`;

  // Cleanup when pathname changes away from the apply page (Next.js App Router navigation)
  useEffect(() => {
    // Only cleanup if we were on the apply page and now we're on a different page
    if (prevPathnameRef.current === currentApplyPath && pathname !== currentApplyPath) {
      console.log('🔄 Navigated away from apply page - performing cleanup');
      console.log('  Previous:', prevPathnameRef.current);
      console.log('  Current:', pathname);
      performCleanup();
    }
    prevPathnameRef.current = pathname;
  }, [pathname, performCleanup, currentApplyPath]);

  // Cleanup on component unmount (Next.js navigation or page close)
  useEffect(() => {
    return () => {
      console.log('🔄 Component unmounting - performing cleanup');
      performCleanup();
    };
  }, [performCleanup]);

  // Also listen to popstate (browser back/forward)
  useEffect(() => {
    const handlePopState = () => {
      console.log('🔄 Browser navigation (back/forward) - performing cleanup');
      performCleanup();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [performCleanup]);

  // Cleanup only on beforeunload (closing tab/window), NOT on visibility change
  // Visibility change fires too often (tab switching, dev tools, etc.) and would delete files prematurely
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      console.log('🔄 Before unload (closing tab/window) - performing cleanup');
      performCleanup();
      // Note: Modern browsers ignore custom messages in beforeunload
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [performCleanup]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const token = localStorage.getItem('directus_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const applicationData = {
        property_id: propertyId,
        message: message,
        signed_lease_agreement: signedLeaseAgreement?.id || null,
      };

      const response = await fetch('/api/applications', {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify(applicationData),
      });

      if (response.ok) {
        setFormSubmitted(true); // Mark form as submitted so we don't cleanup files
        formSubmittedRef.current = true; // Update ref immediately
        // Clear sessionStorage since files are now part of application
        sessionStorage.removeItem(STORAGE_KEY);
        setSuccess(true);
        setTimeout(() => {
          router.push('/student/applications');
        }, 2000);
      } else {
        const errorData = await response.json();
        
        // Check if error is due to incomplete profile
        if (errorData.error === 'Profile incomplete' || response.status === 403) {
          setError(
            errorData.message || 
            'Please complete your profile before applying. ' +
            (errorData.missingFields ? `Missing: ${errorData.missingFields.join(', ')}` : '')
          );
          // Redirect to complete profile page after showing error
          setTimeout(() => {
            router.push('/student/complete-profile');
          }, 3000);
        } else {
          setError(errorData.error || 'Failed to submit application');
        }
        
        // If submission fails, cleanup orphaned files
        performCleanup();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || !hasChecked || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading...</p>
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

  if (error && !property) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
          <Button variant="outline" asChild>
            <Link href="/search">Back to Search</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Apply for Property</h1>
          <p className="mt-2 text-gray-600">Submit your application for this property</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            Application submitted successfully! Redirecting...
          </div>
        )}

        {property && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                {property.featured_image?.id && (
                  <div className="relative w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden">
                    <Image
                      src={getImageUrl(property.featured_image.id)}
                      alt={property.title}
                      fill
                      sizes="128px"
                      className="object-cover"
                    />
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">{property.title}</h2>
                  <p className="text-gray-600 mb-2">{property.address}</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatPrice(parseFloat(property.price_per_month), property.currency)}/month
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Download Pozi Lease Agreement with Debit order Instruction */}
          {collexiaFormId && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                  Pozi Lease Agreement with Debit order Instruction
                </CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Please download the Pozi Lease Agreement with Debit order Instruction document.
                </p>
              </CardHeader>
              <CardContent>
                <a
                  href={`/api/files/${collexiaFormId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Pozi Lease Agreement with Debit order Instruction
                </a>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Application Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="message">Message (Optional)</Label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  className="input w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add any additional information you'd like to include with your application..."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Required Documents</CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                {property?.lease_agreement?.id 
                  ? 'Download the lease agreement above, complete it, and upload the signed version below.'
                  : 'Upload the signed lease agreement (PDF or image files, max 5MB)'}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Signed Lease Agreement */}
              <div>
                <Label>Signed Lease Agreement *</Label>
                {property?.lease_agreement?.id && (
                  <p className="text-xs text-gray-500 mt-1 mb-2">
                    Make sure you've downloaded and completed the lease agreement before uploading it here.
                  </p>
                )}
                {signedLeaseAgreement ? (
                  <div className="mt-2 flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-900">{signedLeaseAgreement.filename_download}</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if (signedLeaseAgreement?.id) {
                          await handleDocumentDelete(signedLeaseAgreement.id);
                        }
                        setSignedLeaseAgreement(null);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <label className="mt-2 cursor-pointer block">
                    <input
                      type="file"
                      accept="application/pdf,image/jpeg,image/jpg,image/png"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleDocumentUpload(file, setSignedLeaseAgreement, setUploadingLeaseAgreement);
                      }}
                      disabled={uploadingLeaseAgreement}
                    />
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                      {uploadingLeaseAgreement ? (
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                          <p className="text-sm text-gray-500">Uploading...</p>
                        </div>
                      ) : (
                        <>
                          <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <p className="text-sm font-medium text-gray-700">Click to upload</p>
                          <p className="text-xs text-gray-500">PDF, JPEG, or PNG (max 5MB)</p>
                        </>
                      )}
                    </div>
                  </label>
                )}
              </div>

            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={isSubmitting || !signedLeaseAgreement}
              className="pozi-green"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </Button>
            <Button 
              variant="outline" 
              type="button"
              onClick={() => {
                // Cleanup files before navigating away
                performCleanup();
                // Small delay to ensure cleanup request is sent
                setTimeout(() => {
                  router.push(`/property/${propertyId}`);
                }, 100);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

