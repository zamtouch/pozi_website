'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { getImageUrl } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, user, isAuthenticated, isStudent, isLandlord, isStaff, isAdmin } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (isLandlord) {
        router.push('/landlord/dashboard');
      } else if (isStudent) {
        // Check profile completion for students
        checkProfileCompletion();
      } else if (isStaff || isAdmin) {
        router.push('/admin/dashboard');
      } else {
        router.push('/');
      }
    }
  }, [isAuthenticated, user, isLandlord, isStudent, isStaff, isAdmin, router]);

  const checkProfileCompletion = async () => {
    try {
      const token = localStorage.getItem('directus_token');
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
          router.push('/student/complete-profile');
        } else {
          // Profile complete, go to dashboard
          router.push('/student/dashboard');
        }
      } else {
        // If check fails, go to dashboard anyway
        router.push('/student/dashboard');
      }
    } catch (err) {
      console.error('Error checking profile completion:', err);
      // If check fails, go to dashboard anyway
      router.push('/student/dashboard');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    // Clear any previous error
    localStorage.removeItem('login_error');

    try {
      const success = await login(email, password);
      if (success) {
        // Direct check: hit /users/me and check for missing bank fields
        const token = localStorage.getItem('directus_token');
        if (token) {
          try {
            const DIRECTUS_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://app.pozi.com.na';
            const response = await fetch(`${DIRECTUS_URL}/users/me?fields=id,email,role.name,role.id,account_number,bank_id`, {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });

            if (response.ok) {
              const userData = await response.json();
              const user = userData.data;
              
              // Check if user is a student
              const roleName = (user.role?.name || user.role || '').toLowerCase();
              const isStudent = roleName.includes('student');
              
              // Check for missing bank fields
              const missingAccountNumber = !user.account_number || String(user.account_number).trim().length === 0;
              const missingBankId = !user.bank_id || user.bank_id === null || user.bank_id === undefined;
              
              console.log('🔍 Login check:', {
                isStudent,
                missingAccountNumber,
                missingBankId,
                account_number: user.account_number,
                bank_id: user.bank_id,
              });
              
              // If student and bank fields are missing, redirect to complete-profile
              if (isStudent && (missingAccountNumber || missingBankId)) {
                console.log('❌ Bank fields missing, redirecting to complete-profile');
                window.location.href = '/student/complete-profile';
                return;
              }
              
              // Otherwise, let normal redirect handle it
              if (isStudent) {
                router.push('/student/dashboard');
              }
            }
          } catch (err) {
            console.error('Error checking user data:', err);
            // Continue with normal flow if check fails
          }
        }
      } else {
        // Get error message from localStorage (set by login function)
        const errorMessage = localStorage.getItem('login_error') || 'Invalid email or password';
        setError(errorMessage);
        localStorage.removeItem('login_error'); // Clear after reading
        setLoading(false);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8">
            <Link href="/" className="inline-block mb-6">
              <h1 className="text-2xl font-bold text-green-600">POZI</h1>
            </Link>
            <h2 className="text-3xl font-light text-gray-900 mb-2">
              Welcome back
            </h2>
            <p className="text-gray-600 font-light">
              Sign in to your account to continue
            </p>
          </div>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}
            
            <div className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="you@example.com"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link href="/auth/forgot-password" className="font-medium text-green-600 hover:text-green-500">
                  Forgot password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link href="/auth/register" className="font-medium text-green-600 hover:text-green-500">
                  Sign up
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Right Side - Background Image */}
      <div className="hidden lg:block relative w-0 lg:w-1/2">
        <div className="absolute inset-0">
          <Image
            src={getImageUrl('acb4f697-9e3f-4e1c-80ed-1df02e704de4')}
            alt="Login background"
            fill
            className="object-cover"
            priority
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 to-transparent"></div>
        </div>
      </div>
    </div>
  );
}


