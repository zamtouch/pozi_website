'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { EyeIcon, EyeSlashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'student',
    agreeToTerms: false,
    // Person Responsible for Rent Details (only for students)
    responsibleFirstName: '',
    responsibleLastName: '',
    responsibleRelationship: '',
    responsibleEmail: '',
    responsibleIdNumber: '',
    responsibleCell: '',
    responsibleOccupation: '',
    // Bank Account Details (only for students)
    accountNumber: '',
    bankId: '',
    accountType: '1', // Default to Current/Cheque
    idNumber: '',
    idType: '1', // Default to RSA ID
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    if (!formData.agreeToTerms) {
      setError('You must agree to the terms and conditions');
      setLoading(false);
      return;
    }

    // Student-specific validation
    if (formData.userType === 'student') {
      const requiredFields = [
        { name: 'responsibleFirstName', label: 'Responsible Person First Name' },
        { name: 'responsibleLastName', label: 'Responsible Person Last Name' },
        { name: 'responsibleRelationship', label: 'Relationship to Tenant' },
        { name: 'responsibleEmail', label: 'Responsible Person Email' },
        { name: 'responsibleIdNumber', label: 'Responsible Person ID Number' },
        { name: 'responsibleCell', label: 'Responsible Person Cell Number' },
        { name: 'responsibleOccupation', label: 'Responsible Person Occupation' },
        { name: 'accountNumber', label: 'Bank Account Number' },
        { name: 'bankId', label: 'Bank' },
      ];

      for (const field of requiredFields) {
        if (!formData[field.name as keyof typeof formData]) {
          setError(`Please fill in ${field.label}`);
          setLoading(false);
          return;
        }
      }

    }

    try {
      // Use new API route for registration
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          confirm_password: formData.confirmPassword,
          first_name: formData.firstName,
          last_name: formData.lastName,
          user_type: formData.userType,
          // Person Responsible for Rent Details (students only)
          responsible_first_name: formData.userType === 'student' ? formData.responsibleFirstName : undefined,
          responsible_last_name: formData.userType === 'student' ? formData.responsibleLastName : undefined,
          responsible_relationship: formData.userType === 'student' ? formData.responsibleRelationship : undefined,
          responsible_email: formData.userType === 'student' ? formData.responsibleEmail : undefined,
          responsible_id_number: formData.userType === 'student' ? formData.responsibleIdNumber : undefined,
          responsible_cell: formData.userType === 'student' ? formData.responsibleCell : undefined,
          responsible_occupation: formData.userType === 'student' ? formData.responsibleOccupation : undefined,
          // Bank Account Details (students only)
          account_number: formData.userType === 'student' ? formData.accountNumber : undefined,
          bank_id: formData.userType === 'student' ? (formData.bankId ? parseInt(formData.bankId) : undefined) : undefined,
          account_type: formData.userType === 'student' ? (formData.accountType ? parseInt(formData.accountType) : 1) : undefined,
          id_number: formData.userType === 'student' ? formData.idNumber : undefined,
          id_type: formData.userType === 'student' ? (formData.idType ? parseInt(formData.idType) : 1) : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Show success modal
        setError('');
        
        let message = 'Account created successfully!';
        if (data.email_sent) {
          message += ' Please check your email to verify your account.';
        } else {
          message += ' Please check your email for verification instructions.';
        }
        
        setSuccessMessage(message);
        setShowSuccessModal(true);
        
        // Log verification link to console for development (not shown to user)
        if (data.verification_link) {
          console.log('Verification link (dev only):', data.verification_link);
        }
      } else {
        // Show detailed error message
        const errorMsg = data.error || 'Failed to create account. Please try again.';
        setError(errorMsg);
        console.error('Signup error:', data);
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isStudent = formData.userType === 'student';

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
              Create your account
            </h2>
            <p className="mt-3 text-gray-600">
              Or{' '}
              <Link href="/auth/login" className="font-semibold text-teal-600 hover:text-teal-700 transition-colors">
                sign in to your existing account
              </Link>
            </p>
          </div>
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <div className="text-sm font-medium text-red-800">{error}</div>
            </div>
          )}
          
          <div className="space-y-6">
            <div>
              <label htmlFor="userType" className="block text-sm font-semibold text-gray-700 mb-2">
                I am a...
              </label>
              <select
                id="userType"
                name="userType"
                value={formData.userType}
                onChange={handleChange}
                className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-base transition-all"
              >
                <option value="student">Student</option>
                <option value="landlord">Landlord / Property Owner</option>
              </select>
            </div>

            {/* Basic Information Section */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-2">
                  First name *
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                  placeholder="First name"
                />
              </div>
              
              <div>
                <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 mb-2">
                  Last name *
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                  placeholder="Last name"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email address *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                placeholder="Enter your email"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                  placeholder="Create a password (min. 8 characters)"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm password *
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Person Responsible for Rent Details - Only for Students */}
            {isStudent && (
              <>
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <h3 className="text-lg font-semibold text-teal-700 mb-4">Person Responsible for Rent Details</h3>
                  <p className="text-sm text-gray-600 mb-4">Please provide information about the person who will be responsible for rent payments.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="responsibleFirstName" className="block text-sm font-semibold text-gray-700 mb-2">
                      Name *
                    </label>
                    <input
                      id="responsibleFirstName"
                      name="responsibleFirstName"
                      type="text"
                      required={isStudent}
                      value={formData.responsibleFirstName}
                      onChange={handleChange}
                      className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                      placeholder="First name"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="responsibleLastName" className="block text-sm font-semibold text-gray-700 mb-2">
                      Surname *
                    </label>
                    <input
                      id="responsibleLastName"
                      name="responsibleLastName"
                      type="text"
                      required={isStudent}
                      value={formData.responsibleLastName}
                      onChange={handleChange}
                      className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                      placeholder="Last name"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="responsibleRelationship" className="block text-sm font-semibold text-gray-700 mb-2">
                    Relationship to tenant *
                  </label>
                  <input
                    id="responsibleRelationship"
                    name="responsibleRelationship"
                    type="text"
                    required={isStudent}
                    value={formData.responsibleRelationship}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                    placeholder="Parent, Guardian, etc."
                  />
                </div>

                <div>
                  <label htmlFor="responsibleEmail" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    id="responsibleEmail"
                    name="responsibleEmail"
                    type="email"
                    required={isStudent}
                    value={formData.responsibleEmail}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                    placeholder="example@email.com"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="responsibleIdNumber" className="block text-sm font-semibold text-gray-700 mb-2">
                      ID Number * <span className="text-xs font-normal text-gray-500">(attach certified copy)</span>
                    </label>
                    <input
                      id="responsibleIdNumber"
                      name="responsibleIdNumber"
                      type="text"
                      required={isStudent}
                      value={formData.responsibleIdNumber}
                      onChange={handleChange}
                      className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                      placeholder="ID Number"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="responsibleCell" className="block text-sm font-semibold text-gray-700 mb-2">
                      Cell *
                    </label>
                    <input
                      id="responsibleCell"
                      name="responsibleCell"
                      type="tel"
                      required={isStudent}
                      value={formData.responsibleCell}
                      onChange={handleChange}
                      className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                      placeholder="+264 81 000 0000"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="responsibleOccupation" className="block text-sm font-semibold text-gray-700 mb-2">
                    Occupation *
                  </label>
                  <input
                    id="responsibleOccupation"
                    name="responsibleOccupation"
                    type="text"
                    required={isStudent}
                    value={formData.responsibleOccupation}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                    placeholder="Occupation"
                  />
                </div>

                {/* Bank Account Details Section */}
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <h3 className="text-lg font-semibold text-teal-700 mb-4">Bank Account Details</h3>
                  <p className="text-sm text-gray-600 mb-4">Required for payment collection. Please provide your bank account information.</p>
                </div>

                <div>
                  <label htmlFor="accountNumber" className="block text-sm font-semibold text-gray-700 mb-2">
                    Bank Account Number *
                  </label>
                  <input
                    id="accountNumber"
                    name="accountNumber"
                    type="text"
                    required={isStudent}
                    value={formData.accountNumber}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                    placeholder="Enter your bank account number"
                  />
                </div>

                <div>
                  <label htmlFor="bankId" className="block text-sm font-semibold text-gray-700 mb-2">
                    Bank * <span className="text-xs font-normal text-gray-500">(Select your bank)</span>
                  </label>
                  <select
                    id="bankId"
                    name="bankId"
                    required={isStudent}
                    value={formData.bankId}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                  >
                    <option value="">Select your bank</option>
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
                  <label htmlFor="accountType" className="block text-sm font-semibold text-gray-700 mb-2">
                    Account Type <span className="text-xs font-normal text-gray-500">(Optional)</span>
                  </label>
                  <select
                    id="accountType"
                    name="accountType"
                    value={formData.accountType}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                  >
                    <option value="1">Current (Cheque)</option>
                    <option value="2">Savings</option>
                    <option value="3">Transmission</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="idNumber" className="block text-sm font-semibold text-gray-700 mb-2">
                    ID Number <span className="text-xs font-normal text-gray-500">(Optional - for mandate)</span>
                  </label>
                  <input
                    id="idNumber"
                    name="idNumber"
                    type="text"
                    value={formData.idNumber}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                    placeholder="Your ID number"
                  />
                </div>

                <div>
                  <label htmlFor="idType" className="block text-sm font-semibold text-gray-700 mb-2">
                    ID Type <span className="text-xs font-normal text-gray-500">(Optional)</span>
                  </label>
                  <select
                    id="idType"
                    name="idType"
                    value={formData.idType}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                  >
                    <option value="1">RSA ID</option>
                    <option value="2">Passport</option>
                    <option value="3">Temp ID</option>
                    <option value="4">Business</option>
                  </select>
                </div>

              </>
            )}
          </div>

          <div className="flex items-start gap-3 pt-4">
            <input
              id="agreeToTerms"
              name="agreeToTerms"
              type="checkbox"
              required
              checked={formData.agreeToTerms}
              onChange={handleChange}
              className="mt-1 h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
            />
            <label htmlFor="agreeToTerms" className="block text-sm text-gray-700">
              I agree to the{' '}
              <Link href="/terms" className="font-semibold text-teal-600 hover:text-teal-700">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="font-semibold text-teal-600 hover:text-teal-700">
                Privacy Policy
              </Link>
            </label>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-4 px-6 bg-gradient-to-r from-teal-600 to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:from-teal-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02]"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Creating account...</span>
                </>
              ) : (
                'Create account'
              )}
            </button>
          </div>
        </form>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => {
            setShowSuccessModal(false);
            router.push('/auth/login');
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-green-100 to-teal-100 mb-6">
                <CheckCircleIcon className="h-12 w-12 text-green-600" />
              </div>
              <h3 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent mb-4">
                Account Created!
              </h3>
              <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                {successMessage}
              </p>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  router.push('/auth/login');
                }}
                className="w-full bg-gradient-to-r from-teal-600 to-blue-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-teal-700 hover:to-blue-700 transition-all transform hover:scale-[1.02] shadow-lg active:scale-[0.98]"
              >
                Continue to Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


