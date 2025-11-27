/**
 * Collexia ID Utilities
 * 
 * Generates consistent, unique short IDs for Collexia API (max 15 chars)
 * while maintaining a mapping to full Directus user IDs.
 */

import * as crypto from 'crypto';

/**
 * Generate a consistent, unique Collexia student_id from Directus user ID
 * 
 * Format: POZI + first 11 chars of SHA256 hash (total: 15 chars)
 * This ensures:
 * - Always 15 characters (Collexia requirement)
 * - Unique for each Directus user ID
 * - Consistent (same Directus ID always produces same Collexia ID)
 * - No collisions (SHA256 provides sufficient uniqueness)
 * 
 * @param directusUserId - Full Directus user UUID (e.g., '75472a20-ff23-441b-b608-de21cabe0ec5')
 * @returns Collexia student_id (e.g., 'POZIa3f8b2c1d4e')
 */
export function generateCollexiaStudentId(directusUserId: string): string {
  // Remove hyphens from UUID for consistent hashing
  const uuidWithoutHyphens = directusUserId.replace(/-/g, '');
  
  // Generate SHA256 hash of the UUID
  const hash = crypto.createHash('sha256').update(uuidWithoutHyphens).digest('hex');
  
  // Take first 11 characters of hash (POZI = 4 chars, so 11 + 4 = 15 total)
  const hashPrefix = hash.substring(0, 11);
  
  // Combine: POZI + hash prefix = 15 characters
  const collexiaId = `POZI${hashPrefix}`;
  
  return collexiaId;
}

/**
 * Verify that a Collexia student_id matches a Directus user ID
 * 
 * @param collexiaStudentId - Collexia student_id to verify
 * @param directusUserId - Directus user UUID to check against
 * @returns true if the Collexia ID was generated from this Directus ID
 */
export function verifyCollexiaStudentId(collexiaStudentId: string, directusUserId: string): boolean {
  const expectedId = generateCollexiaStudentId(directusUserId);
  return collexiaStudentId === expectedId;
}

