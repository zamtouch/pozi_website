/**
 * Token generation and hashing helpers.
 * 
 * These functions encapsulate how verification and reset tokens are
 * generated, hashed and formatted.
 */

import crypto from 'crypto';

const TOKEN_BYTES = parseInt(process.env.TOKEN_BYTES || '32', 10);
const TOKEN_HASH_ALGO = process.env.TOKEN_HASH_ALGO || 'sha256';
const TOKEN_HASH_SECRET = process.env.TOKEN_HASH_SECRET || 'CHANGE_THIS_PEPPER_SECRET';

/**
 * Generate a URL-safe random token.
 * 
 * Uses crypto.randomBytes() to generate TOKEN_BYTES of randomness, encodes it
 * using base64 URL encoding and trims padding. Resulting tokens are
 * cryptographically strong and safe to include in URLs.
 */
export function generateTokenPlain(): string {
  const raw = crypto.randomBytes(TOKEN_BYTES);
  return raw.toString('base64url').replace(/=/g, '');
}

/**
 * Compute a HMAC hash of a token using a secret pepper.
 * 
 * Tokens are never stored in plaintext. Instead their hashed value
 * (HMAC with TOKEN_HASH_SECRET and TOKEN_HASH_ALGO) is stored.
 */
export function tokenHash(plain: string): string {
  return crypto.createHmac(TOKEN_HASH_ALGO, TOKEN_HASH_SECRET).update(plain).digest('hex');
}

/**
 * Return the current UTC time formatted as an ISO 8601 string.
 */
export function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Add a number of minutes to the current time and return an ISO 8601 string.
 */
export function addMinutesIso(minutes: number): string {
  const dt = new Date();
  dt.setMinutes(dt.getMinutes() + minutes);
  return dt.toISOString();
}



