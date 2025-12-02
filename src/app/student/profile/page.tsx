'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { 
  DocumentArrowUpIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  PencilIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  BriefcaseIcon,
  IdentificationIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import { config } from '@/lib/config';

const DIRECTUS_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || config?.directus?.url || 'https://app.pozi.com.na';

interface ProfileData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  status: string;
  role: string;
  // Responsible person fields
  responsible_first_name?: string;
  responsible_last_name?: string;
  responsible_relationship?: string;
  responsible_email?: string;
  responsible_id_number?: string;
  responsible_cell?: string;
  responsible_occupation?: string;
  // File uploads
  id_certified_copy?: string;
  payslip?: string;
  bank_statement_6months?: string;
}

interface CompletionData {
  percentage: number;
  isComplete: boolean;
  missingFields: string[];
}

export default function StudentProfilePage() {
  const { user, isAuthenticated, isStudent, isGraduate, isLoading: authLoading } = useAuth();
  const isStudentOrGraduate = isStudent || isGraduate;
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [completion, setCompletion] = useState<CompletionData | null>(null);
  const [fileUrls, setFileUrls] = useState<{
    idCertifiedCopy?: string;
    payslip?: string;
    bankStatement?: string;
  }>({});

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !isStudentOrGraduate) {
        router.push('/auth/login');
        return;
      }
      fetchProfile();
    }
  }, [authLoading, isAuthenticated, isStudent, router]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('directus_token');
      
      // Fetch profile completion
      const completionResponse = await fetch('/api/profile/completion', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (completionResponse.ok) {
        const completionData = await completionResponse.json();
        setCompletion(completionData.completion);
      }

      // Fetch full profile data
      const profileResponse = await fetch(`${DIRECTUS_URL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        const userData = profileData.data;
        setProfile(userData);

        // Get file URLs
        const urls: any = {};
        if (userData.id_certified_copy) {
          urls.idCertifiedCopy = `${DIRECTUS_URL}/assets/${userData.id_certified_copy}`;
        }
        if (userData.payslip) {
          urls.payslip = `${DIRECTUS_URL}/assets/${userData.payslip}`;
        }
        if (userData.bank_statement_6months) {
          urls.bankStatement = `${DIRECTUS_URL}/assets/${userData.bank_statement_6months}`;
        }
        setFileUrls(urls);
      }
    } catch (err: any) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFileUrl = (fileId: string) => {
    return `${DIRECTUS_URL}/assets/${fileId}`;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isStudent || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
                My Profile
              </h1>
              <p className="text-gray-600 mt-2">View and manage your profile information</p>
            </div>
            <button
              onClick={() => router.push('/student/complete-profile')}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors"
            >
              <PencilIcon className="h-5 w-5" />
              {completion?.isComplete ? 'Update Profile' : 'Complete Profile'}
            </button>
          </div>

          {/* Profile Completion Status */}
          {completion && (
            <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl p-6 border-2 border-teal-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {completion.isComplete ? (
                    <CheckCircleIcon className="h-8 w-8 text-green-600" />
                  ) : (
                    <XCircleIcon className="h-8 w-8 text-orange-600" />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Profile Completion: {completion.percentage}%
                    </h3>
                    <p className="text-sm text-gray-600">
                      {completion.isComplete 
                        ? 'Your profile is complete and you can apply for properties'
                        : `${completion.missingFields.length} field(s) remaining`}
                    </p>
                  </div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    completion.isComplete 
                      ? 'bg-gradient-to-r from-green-500 to-teal-500' 
                      : 'bg-gradient-to-r from-orange-500 to-yellow-500'
                  }`}
                  style={{ width: `${completion.percentage}%` }}
                ></div>
              </div>
              {completion.missingFields.length > 0 && (
                <p className="text-xs text-gray-600">
                  Missing: {completion.missingFields.join(', ')}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <UserIcon className="h-6 w-6 text-teal-600" />
              Personal Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-500">First Name</label>
                <p className="text-gray-900 font-medium mt-1">{profile.first_name || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-500">Last Name</label>
                <p className="text-gray-900 font-medium mt-1">{profile.last_name || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-500 flex items-center gap-2">
                  <EnvelopeIcon className="h-4 w-4" />
                  Email Address
                </label>
                <p className="text-gray-900 font-medium mt-1">{profile.email || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-500 flex items-center gap-2">
                  <PhoneIcon className="h-4 w-4" />
                  Phone Number
                </label>
                <p className="text-gray-900 font-medium mt-1">{profile.phone || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-500">Account Status</label>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-1 ${
                  profile.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : profile.status === 'unverified'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {profile.status || 'Unknown'}
                </span>
              </div>
            </div>
          </div>

          {/* Person Responsible for Rent */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <UserIcon className="h-6 w-6 text-blue-600" />
              Person Responsible for Rent
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-500">Name</label>
                <p className="text-gray-900 font-medium mt-1">
                  {profile.responsible_first_name && profile.responsible_last_name
                    ? `${profile.responsible_first_name} ${profile.responsible_last_name}`
                    : 'Not provided'}
                </p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-500">Relationship</label>
                <p className="text-gray-900 font-medium mt-1">{profile.responsible_relationship || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-500 flex items-center gap-2">
                  <EnvelopeIcon className="h-4 w-4" />
                  Email
                </label>
                <p className="text-gray-900 font-medium mt-1">{profile.responsible_email || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-500 flex items-center gap-2">
                  <PhoneIcon className="h-4 w-4" />
                  Cell Number
                </label>
                <p className="text-gray-900 font-medium mt-1">{profile.responsible_cell || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-500 flex items-center gap-2">
                  <IdentificationIcon className="h-4 w-4" />
                  ID Number
                </label>
                <p className="text-gray-900 font-medium mt-1">{profile.responsible_id_number || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-500 flex items-center gap-2">
                  <BriefcaseIcon className="h-4 w-4" />
                  Occupation
                </label>
                <p className="text-gray-900 font-medium mt-1">{profile.responsible_occupation || 'Not provided'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Documents Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mt-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <DocumentArrowUpIcon className="h-6 w-6 text-purple-600" />
            Required Documents
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* ID Certified Copy */}
            <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-teal-300 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">ID Certified Copy</h3>
                {profile.id_certified_copy ? (
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                ) : (
                  <XCircleIcon className="h-6 w-6 text-red-600" />
                )}
              </div>
              {profile.id_certified_copy ? (
                <a
                  href={getFileUrl(profile.id_certified_copy)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium"
                >
                  <LinkIcon className="h-5 w-5" />
                  View Document
                </a>
              ) : (
                <p className="text-sm text-gray-500">Not uploaded</p>
              )}
            </div>

            {/* Payslip */}
            <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-teal-300 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Payslip</h3>
                {profile.payslip ? (
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                ) : (
                  <XCircleIcon className="h-6 w-6 text-red-600" />
                )}
              </div>
              {profile.payslip ? (
                <a
                  href={getFileUrl(profile.payslip)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium"
                >
                  <LinkIcon className="h-5 w-5" />
                  View Document
                </a>
              ) : (
                <p className="text-sm text-gray-500">Not uploaded</p>
              )}
            </div>

            {/* Bank Statement */}
            <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-teal-300 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">6 Months Bank Statement</h3>
                {profile.bank_statement_6months ? (
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                ) : (
                  <XCircleIcon className="h-6 w-6 text-red-600" />
                )}
              </div>
              {profile.bank_statement_6months ? (
                <a
                  href={getFileUrl(profile.bank_statement_6months)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium"
                >
                  <LinkIcon className="h-5 w-5" />
                  View Document
                </a>
              ) : (
                <p className="text-sm text-gray-500">Not uploaded</p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-4">
          <button
            onClick={() => router.push('/student/dashboard')}
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
          >
            Back to Dashboard
          </button>
          <button
            onClick={() => router.push('/student/complete-profile')}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-xl hover:from-teal-700 hover:to-blue-700 transition-all font-semibold"
          >
            {completion?.isComplete ? 'Update Documents' : 'Complete Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}

