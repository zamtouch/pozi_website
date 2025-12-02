'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { DocumentArrowUpIcon, XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function CompleteProfilePage() {
  const { user, isAuthenticated, isStudent, isGraduate, isLoading: authLoading } = useAuth();
  const isStudentOrGraduate = isStudent || isGraduate;
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [completion, setCompletion] = useState<{ percentage: number; isComplete: boolean; missingFields: string[] } | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Profile data
  const [profileData, setProfileData] = useState({
    phone: '',
    responsible_first_name: '',
    responsible_last_name: '',
    responsible_relationship: '',
    responsible_email: '',
    responsible_id_number: '',
    responsible_cell: '',
    responsible_occupation: '',
    // Bank account information (for Collexia payment collection)
    account_number: '',
    bank_id: '',
    account_type: '1', // Default to Current/Cheque
    id_number: '',
    id_type: '1', // Default to RSA ID
  });
  
  // File states
  const [idCertifiedCopy, setIdCertifiedCopy] = useState<File | null>(null);
  const [payslip, setPayslip] = useState<File | null>(null);
  const [bankStatement, setBankStatement] = useState<File | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{
    idCertifiedCopy?: string;
    payslip?: string;
    bankStatement?: string;
  }>({});
  
  // Existing file IDs (for replacement)
  const [existingFiles, setExistingFiles] = useState<{
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
      fetchCompletion();
    }
  }, [authLoading, isAuthenticated, isStudent, router]);

  const fetchCompletion = async () => {
    try {
      const token = localStorage.getItem('directus_token');
      
      // Fetch completion status
      const completionResponse = await fetch('/api/profile/completion', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (completionResponse.ok) {
        const data = await completionResponse.json();
        setCompletion(data.completion);
      }
      
      // Fetch profile data with all fields including bank account info
      const DIRECTUS_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://app.pozi.com.na';
      const fields = [
        'id',
        'email',
        'first_name',
        'last_name',
        'phone',
        'responsible_first_name',
        'responsible_last_name',
        'responsible_relationship',
        'responsible_email',
        'responsible_id_number',
        'responsible_cell',
        'responsible_occupation',
        'id_certified_copy',
        'payslip',
        'bank_statement_6months',
        'account_number',
        'bank_id',
        'account_type',
        'id_number',
        'id_type',
      ].join(',');
      
      const profileResponse = await fetch(`${DIRECTUS_URL}/users/me?fields=${fields}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        const user = profileData.data;
        
        // Set profile form data
        setProfileData({
          phone: user.phone || '',
          responsible_first_name: user.responsible_first_name || '',
          responsible_last_name: user.responsible_last_name || '',
          responsible_relationship: user.responsible_relationship || '',
          responsible_email: user.responsible_email || '',
          responsible_id_number: user.responsible_id_number || '',
          responsible_cell: user.responsible_cell || '',
          responsible_occupation: user.responsible_occupation || '',
          // Bank account information
          account_number: user.account_number || '',
          bank_id: user.bank_id ? String(user.bank_id) : '',
          account_type: user.account_type ? String(user.account_type) : '1',
          id_number: user.id_number || '',
          id_type: user.id_type ? String(user.id_type) : '1',
        });
        
        // Set existing file IDs
        setExistingFiles({
          idCertifiedCopy: user.id_certified_copy || undefined,
          payslip: user.payslip || undefined,
          bankStatement: user.bank_statement_6months || undefined,
        });
      }
    } catch (err: any) {
      console.error('Error fetching completion:', err);
      setError('Failed to load profile status');
    } finally {
      setLoading(false);
    }
  };

  const deleteOldFile = async (fileId: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('directus_token');
      const response = await fetch(`/api/upload-document?id=${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (response.ok) {
        console.log(`✅ Successfully deleted old file: ${fileId}`);
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error(`❌ Failed to delete old file ${fileId}:`, errorData);
        return false;
      }
    } catch (error) {
      console.error('Error deleting old file:', error);
      return false;
    }
  };

  const uploadFile = async (file: File, type: 'idCertifiedCopy' | 'payslip' | 'bankStatement'): Promise<string | null> => {
    setUploading(type);
    setError('');
    const oldFileId = existingFiles[type];
    
    try {
      // Validate file type
      if (file.type !== 'application/pdf') {
        setError('Only PDF files are allowed');
        setUploading(null);
        return null;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        setUploading(null);
        return null;
      }

      // Step 1: Upload new file first (to avoid losing old file if upload fails)
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('directus_token');
      const response = await fetch('/api/auth/register-upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload file');
      }

      const data = await response.json();
      const newFileId = data.data?.id;
      
      if (!newFileId) {
        throw new Error('No file ID returned from upload');
      }

      // Step 2: New file uploaded successfully, now delete old file
      if (oldFileId && oldFileId !== newFileId) {
        console.log(`🗑️ Deleting old ${type} file:`, oldFileId);
        const deleted = await deleteOldFile(oldFileId);
        if (!deleted) {
          // Log warning but don't fail - new file is already uploaded
          console.warn(`⚠️ Warning: Failed to delete old file ${oldFileId}, but new file uploaded successfully. Old file may be orphaned.`);
        }
      }

      // Step 3: Update state with new file ID
      setUploadedFiles(prev => ({ ...prev, [type]: newFileId }));
      setExistingFiles(prev => ({ ...prev, [type]: newFileId }));
      
      return newFileId;
    } catch (error: any) {
      console.error(`Error uploading ${type}:`, error);
      setError(`Failed to upload ${type}: ${error.message}`);
      return null;
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validate files are uploaded (use existing files if no new uploads)
    const filesToSave = {
      id_certified_copy: uploadedFiles.idCertifiedCopy || existingFiles.idCertifiedCopy,
      payslip: uploadedFiles.payslip || existingFiles.payslip,
      bank_statement_6months: uploadedFiles.bankStatement || existingFiles.bankStatement,
    };

    if (!filesToSave.id_certified_copy || !filesToSave.payslip || !filesToSave.bank_statement_6months) {
      setError('Please upload all required documents');
      return;
    }

    try {
      const token = localStorage.getItem('directus_token');
      
      // Update documents
      const documentsResponse = await fetch('/api/profile/update-documents', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(filesToSave),
      });

      if (!documentsResponse.ok) {
        const errorData = await documentsResponse.json();
        throw new Error(errorData.error || 'Failed to save documents');
      }

      // Update profile fields (including bank account info)
      const profileUpdateData = {
        ...profileData,
        bank_id: profileData.bank_id ? parseInt(profileData.bank_id) : null,
        account_type: profileData.account_type ? parseInt(profileData.account_type) : null,
        id_type: profileData.id_type ? parseInt(profileData.id_type) : null,
      };
      
      const profileResponse = await fetch('/api/profile/update', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(profileUpdateData),
      });

      if (!profileResponse.ok) {
        const errorData = await profileResponse.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      setSuccess(true);
      // Clear profile incomplete flags
      localStorage.removeItem('profile_incomplete');
      localStorage.removeItem('profile_missing_fields');
      localStorage.removeItem('profile_completion_percentage');
      
      // Refresh completion status and reload profile data
      setTimeout(async () => {
        await fetchCompletion();
        // Reload the page data to show saved values
        const DIRECTUS_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://app.pozi.com.na';
        const fields = [
          'id',
          'email',
          'first_name',
          'last_name',
          'phone',
          'responsible_first_name',
          'responsible_last_name',
          'responsible_relationship',
          'responsible_email',
          'responsible_id_number',
          'responsible_cell',
          'responsible_occupation',
          'id_certified_copy',
          'payslip',
          'bank_statement_6months',
          'account_number',
          'bank_id',
          'account_type',
          'id_number',
          'id_type',
        ].join(',');
        
        const profileResponse = await fetch(`${DIRECTUS_URL}/users/me?fields=${fields}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          const user = profileData.data;
          
          // Update form with saved data
          setProfileData({
            phone: user.phone || '',
            responsible_first_name: user.responsible_first_name || '',
            responsible_last_name: user.responsible_last_name || '',
            responsible_relationship: user.responsible_relationship || '',
            responsible_email: user.responsible_email || '',
            responsible_id_number: user.responsible_id_number || '',
            responsible_cell: user.responsible_cell || '',
            responsible_occupation: user.responsible_occupation || '',
            account_number: user.account_number || '',
            bank_id: user.bank_id ? String(user.bank_id) : '',
            account_type: user.account_type ? String(user.account_type) : '1',
            id_number: user.id_number || '',
            id_type: user.id_type ? String(user.id_type) : '1',
          });
        }
        
        // Only redirect if profile was incomplete and is now complete
        if (completion && !completion.isComplete) {
          // Check if it's now complete
          const checkResponse = await fetch('/api/profile/completion', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            credentials: 'include',
          });
          if (checkResponse.ok) {
            const checkData = await checkResponse.json();
            if (checkData.completion.isComplete) {
              // Was incomplete, now complete - redirect after 2 seconds
              setTimeout(() => {
                router.push('/student/dashboard');
              }, 2000);
            }
          }
        }
      }, 1000);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError(err.message || 'An error occurred while saving');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isStudent) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
              {completion?.isComplete ? 'Update Your Profile' : 'Complete Your Profile'}
            </h2>
            <p className="mt-3 text-gray-600">
              {completion?.isComplete 
                ? 'Update your documents or profile information'
                : 'Complete your profile to start applying for properties'}
            </p>
          </div>

          {/* Progress Bar */}
          {completion && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-700">Profile Completion</span>
                <span className="text-sm font-bold text-teal-600">{completion.percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-teal-600 to-blue-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${completion.percentage}%` }}
                ></div>
              </div>
              {completion.missingFields.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  Missing: {completion.missingFields.join(', ')}
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 mb-6">
              <div className="text-sm font-medium text-red-800">{error}</div>
            </div>
          )}

          {success && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-4 mb-6">
              <div className="text-sm font-medium text-green-800">
                {completion?.isComplete 
                  ? 'Documents updated successfully!'
                  : 'Documents saved successfully! Your profile is now complete.'}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information Section */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-teal-700 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number * <span className="text-xs font-normal text-gray-500">(Your contact number)</span>
                  </label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                    placeholder="+264 81 000 0000"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">This is your primary contact number</p>
                </div>
              </div>
            </div>

            {/* Profile Information Section */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-teal-700 mb-4">Person Responsible for Rent Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={profileData.responsible_first_name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, responsible_first_name: e.target.value }))}
                    className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                    placeholder="First name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={profileData.responsible_last_name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, responsible_last_name: e.target.value }))}
                    className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                    placeholder="Last name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Relationship *
                  </label>
                  <input
                    type="text"
                    value={profileData.responsible_relationship}
                    onChange={(e) => setProfileData(prev => ({ ...prev, responsible_relationship: e.target.value }))}
                    className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                    placeholder="Parent, Guardian, etc."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={profileData.responsible_email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, responsible_email: e.target.value }))}
                    className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                    placeholder="example@email.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ID Number *
                  </label>
                  <input
                    type="text"
                    value={profileData.responsible_id_number}
                    onChange={(e) => setProfileData(prev => ({ ...prev, responsible_id_number: e.target.value }))}
                    className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                    placeholder="ID Number"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Cell Number *
                  </label>
                  <input
                    type="tel"
                    value={profileData.responsible_cell}
                    onChange={(e) => setProfileData(prev => ({ ...prev, responsible_cell: e.target.value }))}
                    className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                    placeholder="+264 81 000 0000"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Occupation *
                  </label>
                  <input
                    type="text"
                    value={profileData.responsible_occupation}
                    onChange={(e) => setProfileData(prev => ({ ...prev, responsible_occupation: e.target.value }))}
                    className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                    placeholder="Occupation"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Bank Account Information Section */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-teal-700 mb-4">Bank Account Information</h3>
              <p className="text-sm text-gray-600 mb-4">
                Required for automatic rent payment collection via Collexia. Your bank account will be used to collect monthly rent payments.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Bank Account Number * <span className="text-xs font-normal text-gray-500">(Your account number)</span>
                  </label>
                  <input
                    type="text"
                    value={profileData.account_number}
                    onChange={(e) => setProfileData(prev => ({ ...prev, account_number: e.target.value }))}
                    className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                    placeholder="e.g., 62001543455"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Bank * <span className="text-xs font-normal text-gray-500">(Select your bank)</span>
                  </label>
                  <select
                    value={profileData.bank_id}
                    onChange={(e) => setProfileData(prev => ({ ...prev, bank_id: e.target.value }))}
                    className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                    required
                  >
                    <option value="">Select Bank</option>
                    <option value="64">Bank Windhoek</option>
                    <option value="65">FNB Namibia</option>
                    <option value="66">TrustCo Bank</option>
                    <option value="67">Bank Atlántico</option>
                    <option value="68">BankBIC</option>
                    <option value="69">Bank of Namibia</option>
                    <option value="70">Letshego Bank Namibia</option>
                    <option value="71">Nedbank Namibia</option>
                    <option value="72">Standard Bank Namibia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Account Type <span className="text-xs font-normal text-gray-500">(Optional)</span>
                  </label>
                  <select
                    value={profileData.account_type}
                    onChange={(e) => setProfileData(prev => ({ ...prev, account_type: e.target.value }))}
                    className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                  >
                    <option value="1">Current (Cheque)</option>
                    <option value="2">Savings</option>
                    <option value="3">Transmission</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ID Number <span className="text-xs font-normal text-gray-500">(Optional - for mandate)</span>
                  </label>
                  <input
                    type="text"
                    value={profileData.id_number}
                    onChange={(e) => setProfileData(prev => ({ ...prev, id_number: e.target.value }))}
                    className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                    placeholder="Your ID number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ID Type <span className="text-xs font-normal text-gray-500">(Optional)</span>
                  </label>
                  <select
                    value={profileData.id_type}
                    onChange={(e) => setProfileData(prev => ({ ...prev, id_type: e.target.value }))}
                    className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                  >
                    <option value="1">RSA ID</option>
                    <option value="2">Passport</option>
                    <option value="3">Temp ID</option>
                    <option value="4">Business</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Documents Section */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-teal-700 mb-4">Required Documents</h3>
              <p className="text-sm text-gray-600 mb-6">
                {completion?.isComplete 
                  ? 'Update your documents below (PDF format, max 5MB each).'
                  : 'Please upload the following documents to complete your profile (PDF format, max 5MB each). You must complete this before applying for properties.'}
              </p>
            </div>

            {/* ID Certified Copy */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                ID Number Certified Copy * <span className="text-xs font-normal text-gray-500">(PDF)</span>
                {existingFiles.idCertifiedCopy && !idCertifiedCopy && (
                  <span className="ml-2 text-xs text-green-600 font-normal">(Document uploaded)</span>
                )}
              </label>
              <div className="flex items-center gap-4">
                <label className="flex-1 cursor-pointer">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={async (e) => {
                      const file = e.target.files?.[0] || null;
                      setIdCertifiedCopy(file);
                      if (file) {
                        await uploadFile(file, 'idCertifiedCopy');
                      }
                    }}
                    className="hidden"
                    disabled={Boolean(uploading)}
                  />
                  <div className="border-2 border-dashed border-teal-300 rounded-xl p-6 text-center hover:border-teal-500 transition-colors">
                    {idCertifiedCopy ? (
                      <div className="flex items-center justify-center gap-2 text-teal-600">
                        <DocumentArrowUpIcon className="h-5 w-5" />
                        <span className="font-medium">{idCertifiedCopy.name}</span>
                        {uploading === 'idCertifiedCopy' && <span className="text-sm">(Uploading...)</span>}
                        {uploadedFiles.idCertifiedCopy && !uploading && (
                          <span className="text-green-600 text-sm">✓</span>
                        )}
                      </div>
                    ) : existingFiles.idCertifiedCopy ? (
                      <div className="text-green-600">
                        <CheckCircleIcon className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm font-medium">Document uploaded</p>
                        <p className="text-xs mt-1 text-gray-600">Click to replace document</p>
                      </div>
                    ) : (
                      <div className="text-gray-500">
                        <DocumentArrowUpIcon className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm">Click to upload ID certified copy</p>
                      </div>
                    )}
                  </div>
                </label>
                {idCertifiedCopy && (
                  <button
                    type="button"
                    onClick={() => {
                      setIdCertifiedCopy(null);
                      setUploadedFiles(prev => ({ ...prev, idCertifiedCopy: undefined }));
                    }}
                    className="p-2 text-red-600 hover:text-red-700"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Payslip */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Payslip * <span className="text-xs font-normal text-gray-500">(PDF - Latest payslip)</span>
                {existingFiles.payslip && !payslip && (
                  <span className="ml-2 text-xs text-green-600 font-normal">(Document uploaded)</span>
                )}
              </label>
              <div className="flex items-center gap-4">
                <label className="flex-1 cursor-pointer">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={async (e) => {
                      const file = e.target.files?.[0] || null;
                      setPayslip(file);
                      if (file) {
                        await uploadFile(file, 'payslip');
                      }
                    }}
                    className="hidden"
                    disabled={Boolean(uploading)}
                  />
                  <div className="border-2 border-dashed border-teal-300 rounded-xl p-6 text-center hover:border-teal-500 transition-colors">
                    {payslip ? (
                      <div className="flex items-center justify-center gap-2 text-teal-600">
                        <DocumentArrowUpIcon className="h-5 w-5" />
                        <span className="font-medium">{payslip.name}</span>
                        {uploading === 'payslip' && <span className="text-sm">(Uploading...)</span>}
                        {uploadedFiles.payslip && !uploading && (
                          <span className="text-green-600 text-sm">✓</span>
                        )}
                      </div>
                    ) : existingFiles.payslip ? (
                      <div className="text-green-600">
                        <CheckCircleIcon className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm font-medium">Document uploaded</p>
                        <p className="text-xs mt-1 text-gray-600">Click to replace document</p>
                      </div>
                    ) : (
                      <div className="text-gray-500">
                        <DocumentArrowUpIcon className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm">Click to upload latest payslip</p>
                      </div>
                    )}
                  </div>
                </label>
                {payslip && (
                  <button
                    type="button"
                    onClick={() => {
                      setPayslip(null);
                      setUploadedFiles(prev => ({ ...prev, payslip: undefined }));
                    }}
                    className="p-2 text-red-600 hover:text-red-700"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Bank Statement */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                6 Months Bank Statement * <span className="text-xs font-normal text-gray-500">(PDF)</span>
                {existingFiles.bankStatement && !bankStatement && (
                  <span className="ml-2 text-xs text-green-600 font-normal">(Document uploaded)</span>
                )}
              </label>
              <div className="flex items-center gap-4">
                <label className="flex-1 cursor-pointer">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={async (e) => {
                      const file = e.target.files?.[0] || null;
                      setBankStatement(file);
                      if (file) {
                        await uploadFile(file, 'bankStatement');
                      }
                    }}
                    className="hidden"
                    disabled={Boolean(uploading)}
                  />
                  <div className="border-2 border-dashed border-teal-300 rounded-xl p-6 text-center hover:border-teal-500 transition-colors">
                    {bankStatement ? (
                      <div className="flex items-center justify-center gap-2 text-teal-600">
                        <DocumentArrowUpIcon className="h-5 w-5" />
                        <span className="font-medium">{bankStatement.name}</span>
                        {uploading === 'bankStatement' && <span className="text-sm">(Uploading...)</span>}
                        {uploadedFiles.bankStatement && !uploading && (
                          <span className="text-green-600 text-sm">✓</span>
                        )}
                      </div>
                    ) : existingFiles.bankStatement ? (
                      <div className="text-green-600">
                        <CheckCircleIcon className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm font-medium">Document uploaded</p>
                        <p className="text-xs mt-1 text-gray-600">Click to replace document</p>
                      </div>
                    ) : (
                      <div className="text-gray-500">
                        <DocumentArrowUpIcon className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm">Click to upload 6 months bank statement</p>
                      </div>
                    )}
                  </div>
                </label>
                {bankStatement && (
                  <button
                    type="button"
                    onClick={() => {
                      setBankStatement(null);
                      setUploadedFiles(prev => ({ ...prev, bankStatement: undefined }));
                    }}
                    className="p-2 text-red-600 hover:text-red-700"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={Boolean(uploading) || (!uploadedFiles.idCertifiedCopy && !existingFiles.idCertifiedCopy) || (!uploadedFiles.payslip && !existingFiles.payslip) || (!uploadedFiles.bankStatement && !existingFiles.bankStatement)}
              className="w-full bg-gradient-to-r from-teal-600 to-blue-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-teal-700 hover:to-blue-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
            >
              {uploading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Uploading...
                </span>
              ) : (
                completion?.isComplete ? 'Update Profile' : 'Save Documents & Complete Profile'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

