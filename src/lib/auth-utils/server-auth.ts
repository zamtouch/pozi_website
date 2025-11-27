/**
 * Server-side authentication utilities
 * For use in API routes and server components
 */

import { NextRequest } from 'next/server';
import { config } from '@/lib/config';
import { httpJson } from './http';

/**
 * Get the authentication token from request (cookie or header)
 */
export function getAuthToken(request: NextRequest): string | null {
  // Try cookie first (preferred method)
  const cookieToken = request.cookies.get('directus_token')?.value;
  if (cookieToken) {
    return cookieToken;
  }

  // Fallback to Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

/**
 * Get current user from request token
 */
export async function getCurrentUser(request: NextRequest) {
  const token = getAuthToken(request);
  
  if (!token) {
    return null;
  }

  try {
    const filterParams = new URLSearchParams();
    filterParams.append('filter[token][_eq]', token);
    filterParams.append('fields', 'id,email,first_name,last_name,status,role.name,role.id');
    filterParams.append('limit', '1');
    const filter = filterParams.toString();

    const userResponse = await httpJson(
      'GET',
      `${config.directus.url}/users?${filter}`,
      null,
      [`Authorization: Bearer ${config.directus.token}`]
    );

    if (userResponse.status === 200) {
      const userData = JSON.parse(userResponse.body);
      const users = userData.data || [];
      
      if (users.length > 0 && users[0].status === 'active') {
        return {
          id: users[0].id,
          email: users[0].email || '',
          first_name: users[0].first_name || '',
          last_name: users[0].last_name || '',
          status: users[0].status || '',
          role: users[0].role?.name || users[0].role || '',
          role_id: users[0].role?.id || '',
        };
      }
    }
  } catch (error) {
    console.error('Error getting current user:', error);
  }

  return null;
}

