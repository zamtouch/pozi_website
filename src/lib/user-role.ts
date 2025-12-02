/**
 * User Role Utilities
 * 
 * Helper functions to determine and work with user roles throughout the platform.
 * Use these utilities to check user roles in any component or page.
 */

import { useAuth } from './auth';

/**
 * Get the user's role type as a string
 * Returns: 'student' | 'graduate' | 'landlord' | 'staff' | 'admin' | 'unknown'
 */
export function getUserRoleType(): 'student' | 'graduate' | 'landlord' | 'staff' | 'admin' | 'unknown' {
  // This function can be used outside of React components
  // For use inside components, use useUserRole() hook instead
  if (typeof window === 'undefined') return 'unknown';
  
  const userData = localStorage.getItem('user_data');
  if (!userData) return 'unknown';
  
  try {
    const user = JSON.parse(userData);
    const role = (user.role?.name || user.role || '').toLowerCase();
    
    if (role.includes('student')) return 'student';
    if (role.includes('graduate')) return 'graduate';
    if (role.includes('landlord') || role.includes('property') || role.includes('owner')) return 'landlord';
    if (role.includes('staff')) return 'staff';
    if (role.includes('admin') || role.includes('administrator')) return 'admin';
    
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * React hook to get user role information
 * Use this in any component to access role information
 * 
 * @example
 * ```tsx
 * const { roleType, isStudent, isGraduate, isLandlord, displayName } = useUserRole();
 * 
 * if (isStudent) {
 *   // Show student-specific content
 * }
 * ```
 */
export function useUserRole() {
  const { user, isStudent, isGraduate, isLandlord, isStaff, isAdmin } = useAuth();
  
  // Determine role type
  let roleType: 'student' | 'graduate' | 'landlord' | 'staff' | 'admin' | 'unknown' = 'unknown';
  if (isStudent) roleType = 'student';
  else if (isGraduate) roleType = 'graduate';
  else if (isLandlord) roleType = 'landlord';
  else if (isStaff) roleType = 'staff';
  else if (isAdmin) roleType = 'admin';
  
  // Get display name for the role
  const displayName = isStudent ? 'Student' 
    : isGraduate ? 'Graduate'
    : isLandlord ? 'Property Owner'
    : isStaff ? 'Staff'
    : isAdmin ? 'Administrator'
    : 'User';
  
  // Check if user is a tenant (student or graduate)
  const isTenant = isStudent || isGraduate;
  
  return {
    roleType,
    displayName,
    isStudent,
    isGraduate,
    isLandlord,
    isStaff,
    isAdmin,
    isTenant,
    // Raw role from user object
    rawRole: user?.role,
  };
}

/**
 * Get the dashboard route for a user based on their role
 */
export function getDashboardRoute(roleType: 'student' | 'graduate' | 'landlord' | 'staff' | 'admin' | 'unknown'): string {
  switch (roleType) {
    case 'student':
    case 'graduate':
      return '/student/dashboard';
    case 'landlord':
      return '/landlord/dashboard';
    case 'staff':
    case 'admin':
      return '/admin/dashboard';
    default:
      return '/';
  }
}

