'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie, setCookie, deleteCookie } from './auth-utils/cookies';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  status: string;
  role: string;
  role_id?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isStudent: boolean;
  isLandlord: boolean;
  isStaff: boolean;
  isAdmin: boolean;
  // Legacy support for candidate/employer naming
  isCandidate: boolean;
  isEmployer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'directus_token'; // Keep for backward compatibility

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Normalize role name for consistent checking
  const normalizeRole = (role: string | undefined): string => {
    if (!role) return '';
    return role.toLowerCase().trim();
  };

  // Check if user is authenticated on mount - use session endpoint
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      console.log('🔍 Checking session...');
      
      // Check if we have a cookie or localStorage token
      const cookieToken = getCookie('directus_token');
      const localStorageToken = localStorage.getItem(STORAGE_KEY);
      const token = cookieToken || localStorageToken;
      
      console.log('🔍 Token check:', {
        hasCookie: !!cookieToken,
        hasLocalStorage: !!localStorageToken,
        hasToken: !!token,
      });
      
      if (token) {
        // Token exists - try to get user info from session endpoint (non-blocking)
        // If it fails, we'll still consider user authenticated based on cookie presence
        try {
          const response = await fetch('/api/auth/session', {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store',
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.authenticated && data.user) {
              setUser(data.user);
              console.log('✅ Session restored - User:', data.user.email, 'Role:', data.user.role);
              // Sync token to localStorage for backward compatibility
              if (!localStorageToken && cookieToken) {
                localStorage.setItem(STORAGE_KEY, cookieToken);
              }
              // Check profile completion for students on session restore
              const roleName = normalizeRole(data.user?.role);
              if (roleName.includes('student')) {
                checkProfileCompletionForStudent(token);
              }
              setIsLoading(false);
              return;
            }
          }
        } catch (error) {
          console.log('⚠️ Session endpoint failed, but cookie exists - continuing with cookie-based auth');
        }
        
        // Cookie/token exists but we couldn't fetch user info
        // Still consider authenticated - token will be validated on API calls
        // Create a minimal user object from localStorage if available
        const storedUser = localStorage.getItem('user_data');
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            console.log('✅ Restored user from localStorage');
            // Check profile completion for students
            const roleName = normalizeRole(userData?.role);
            if (roleName.includes('student')) {
              checkProfileCompletionForStudent(token);
            }
          } catch (e) {
            // If we can't parse, create a minimal user object
            setUser({
              id: 'unknown',
              email: '',
              first_name: '',
              last_name: '',
              status: 'active',
              role: '',
            });
            console.log('✅ Cookie present - user authenticated (minimal user object)');
          }
        } else {
          // Create minimal user object - full user data will be fetched on first API call
          setUser({
            id: 'unknown',
            email: '',
            first_name: '',
            last_name: '',
            status: 'active',
            role: '',
          });
          console.log('✅ Cookie present - user authenticated (will fetch user data on demand)');
        }
        
        // Sync token to localStorage if needed
        if (!localStorageToken && cookieToken) {
          localStorage.setItem(STORAGE_KEY, cookieToken);
        }
      } else {
        // No token found - clear everything
        console.log('❌ No token found, clearing session');
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem('user_data');
        deleteCookie('directus_token');
        setUser(null);
      }
    } catch (error) {
      console.error('❌ Session check error:', error);
      // On error, check if cookie exists
      const cookieToken = getCookie('directus_token');
      if (cookieToken) {
        // Cookie exists, consider authenticated
        setUser({
          id: 'unknown',
          email: '',
          first_name: '',
          last_name: '',
          status: 'active',
          role: '',
        });
        console.log('✅ Cookie present despite error - user authenticated');
      } else {
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const validateToken = async (token: string) => {
    try {
      console.log('🔍 Validating token...');
      const response = await fetch('/api/auth/validate-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📋 Validate token response:', {
          success: data.success,
          hasUser: !!data.user,
          role: data.user?.role,
        });
        
        if (data.success && data.user) {
          setUser(data.user);
          console.log('✅ Token validated - User:', data.user.email, 'Role:', data.user.role);
          // Sync token to localStorage if not already there
          if (!localStorage.getItem(STORAGE_KEY)) {
            localStorage.setItem(STORAGE_KEY, token);
          }
        } else {
          console.log('❌ Token validation failed - invalid token');
          localStorage.removeItem(STORAGE_KEY);
          deleteCookie('directus_token');
          setUser(null);
        }
      } else {
        let errorData: any = {};
        let errorText = '';
        try {
          errorData = await response.json();
          errorText = errorData.error || errorData.message || 'Unknown error';
        } catch (e) {
          errorText = await response.text().catch(() => `HTTP ${response.status}`);
        }
        
        console.error('❌ Token validation failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          errorData: errorData,
        });
        
        // Only clear session if it's a 401 (unauthorized) or 403 (forbidden)
        // For other errors (500, etc.), keep the token and let the user try again
        if (response.status === 401 || response.status === 403) {
          console.log('🔒 Clearing session due to authentication failure');
          localStorage.removeItem(STORAGE_KEY);
          deleteCookie('directus_token');
          setUser(null);
        } else {
          console.log('⚠️ Server error during validation, keeping token for retry');
        }
      }
    } catch (error) {
      console.error('❌ Token validation error:', error);
      localStorage.removeItem(STORAGE_KEY);
      deleteCookie('directus_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const checkProfileCompletionForStudent = async (token: string) => {
    try {
      const completionResponse = await fetch('/api/profile/completion', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (completionResponse.ok) {
        const completionData = await completionResponse.json();
        if (completionData.completion && !completionData.completion.isComplete) {
          // Store profile completion status in localStorage for redirect
          localStorage.setItem('profile_incomplete', 'true');
          localStorage.setItem('profile_missing_fields', JSON.stringify(completionData.completion.missingFields));
          localStorage.setItem('profile_completion_percentage', completionData.completion.percentage.toString());
          console.log('⚠️ Profile incomplete - missing:', completionData.completion.missingFields);
        } else {
          localStorage.removeItem('profile_incomplete');
          localStorage.removeItem('profile_missing_fields');
          localStorage.removeItem('profile_completion_percentage');
          console.log('✅ Profile complete');
        }
      }
    } catch (err) {
      console.error('Error checking profile completion:', err);
      // Don't block if check fails
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: include cookies
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.static_token) {
        // Cookie is set automatically by the server (httpOnly)
        // Also store in localStorage for backward compatibility and client-side access
        localStorage.setItem(STORAGE_KEY, data.static_token);
        setCookie('directus_token', data.static_token, 30); // Client-side cookie as backup
        
        // Store user data in localStorage for quick restoration
        if (data.user) {
          localStorage.setItem('user_data', JSON.stringify(data.user));
          setUser(data.user);
        }
        
        // Log role for debugging
        console.log('Login successful - User role:', data.user?.role);
        console.log('Normalized role:', normalizeRole(data.user?.role));
        
        // Check profile completion for students immediately after login
        const roleName = normalizeRole(data.user?.role);
        if (roleName.includes('student')) {
          await checkProfileCompletionForStudent(data.static_token);
        }
        
        return true;
      } else {
        // Store error message for display
        const errorMessage = data.error || 'Invalid email or password';
        console.error('Login failed:', errorMessage);
        // Store error in localStorage so login page can access it
        localStorage.setItem('login_error', errorMessage);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      localStorage.setItem('login_error', 'An error occurred. Please try again.');
      return false;
    }
  };

  const logout = async () => {
    try {
      // Call logout API to clear server-side cookie
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout API error:', error);
    }
    
    // Clear client-side storage
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('user_data');
    deleteCookie('directus_token');
    setUser(null);
    router.push('/auth/login');
  };

  const normalizedRole = normalizeRole(user?.role);
  
  // Role checking - customized for student rentals
  const isStudent = normalizedRole === 'student' || normalizedRole.includes('student');
  // Property Admin, Property Owner, Landlord all map to landlord
  const isLandlord = normalizedRole === 'landlord' 
    || normalizedRole === 'property_owner' 
    || normalizedRole === 'property admin'
    || normalizedRole.includes('landlord')
    || normalizedRole.includes('property');
  const isStaff = normalizedRole === 'staff' || normalizedRole.includes('staff');
  const isAdmin = normalizedRole === 'administrator' || normalizedRole === 'admin' || normalizedRole.includes('admin');

  // Legacy support for candidate/employer naming (maps to student/landlord)
  const isCandidate = isStudent;
  const isEmployer = isLandlord;

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    isStudent,
    isLandlord,
    isStaff,
    isAdmin,
    isCandidate,
    isEmployer,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

