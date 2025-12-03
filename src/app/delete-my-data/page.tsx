'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { config } from '@/lib/config';
import Link from 'next/link';

export default function DeleteMyDataPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Check authentication and redirect if not logged in
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      // Store the current path to redirect back after login
      router.push(`/auth/login?redirect=${encodeURIComponent('/delete-my-data')}`);
    }
  }, [isAuthenticated, authLoading, router]);

  // Pre-fill email if user is logged in
  useEffect(() => {
    if (isAuthenticated && user?.email) {
      setEmail(user.email);
    }
  }, [isAuthenticated, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    // Validation
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    if (!reason || reason.trim().length < 10) {
      setError('Please provide a reason (at least 10 characters)');
      setLoading(false);
      return;
    }

    try {
      const directusUrl = config.directus.url || 'https://app.pozi.com.na';
      const response = await fetch(`${directusUrl}/items/delete_my_data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          reason: reason.trim(),
          submitted_at: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setEmail('');
        setReason('');
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || errorData.error || 'Failed to submit request. Please try again.');
      }
    } catch (err: any) {
      console.error('Delete data request error:', err);
      setError('An error occurred while submitting your request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render form if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
              Request Data Deletion
            </h1>
            <p className="mt-3 text-gray-600">
              Submit a request to have your data deleted from our system
            </p>
          </div>

          {success ? (
            <div className="rounded-lg bg-green-50 border border-green-200 p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-green-800 mb-2">Request Submitted Successfully</h3>
              <p className="text-green-700 mb-4">
                Your data deletion request has been received. We will process it within 30 days as required by data protection regulations.
              </p>
              <Link
                href="/"
                className="inline-block mt-4 px-6 py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-colors"
              >
                Return to Home
              </Link>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                  <div className="text-sm font-medium text-red-800">{error}</div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                  placeholder="your.email@example.com"
                  disabled={!!user?.email} // Disable if pre-filled from logged-in user
                />
                {user?.email && (
                  <p className="mt-1 text-xs text-gray-500">
                    Using your account email address
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="reason" className="block text-sm font-semibold text-gray-700 mb-2">
                  Reason for Deletion *
                </label>
                <textarea
                  id="reason"
                  name="reason"
                  required
                  rows={6}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all resize-none"
                  placeholder="Please provide a reason for requesting data deletion (minimum 10 characters)..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  {reason.length} / 10 minimum characters
                </p>
              </div>

              <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div className="text-sm text-yellow-800">
                    <p className="font-semibold mb-1">Important Information</p>
                    <ul className="list-disc list-inside space-y-1 text-yellow-700">
                      <li>Data deletion requests are processed within 30 days</li>
                      <li>Some data may be retained for legal or regulatory compliance</li>
                      <li>This action cannot be undone once processed</li>
                      <li>You will receive a confirmation email when your request is processed</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 py-4 px-6 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-xl shadow-lg hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02]"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Submitting Request...</span>
                    </>
                  ) : (
                    'Submit Deletion Request'
                  )}
                </button>
              </div>

              <div className="text-center pt-4">
                <Link
                  href="/privacy"
                  className="text-sm text-gray-600 hover:text-teal-600 transition-colors"
                >
                  Learn more about our data deletion policy
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

