/**
 * Environment configuration for the application.
 * 
 * All configuration values are read from environment variables
 * with sensible defaults for development.
 */

export const config = {
  directus: {
    url: process.env.NEXT_PUBLIC_DIRECTUS_URL || process.env.DIRECTUS_URL || '',
    token: process.env.NEXT_PUBLIC_DIRECTUS_TOKEN || process.env.DIRECTUS_TOKEN || process.env.DIRECTUS_ADMIN_TOKEN || '',
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || process.env.PUBLIC_APP_URL || 'https://pozi.com.na',
  },
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY || '',
    fromEmail: process.env.SENDGRID_FROM_EMAIL || 'no-reply@pozi.com',
    fromName: process.env.SENDGRID_FROM_NAME || 'Pozi Student Living',
    templateId: process.env.SENDGRID_TEMPLATE_ID || '',
    passwordResetTemplateId: process.env.SENDGRID_PASSWORD_RESET_TEMPLATE_ID || '',
  },
  auth: {
    tokenBytes: parseInt(process.env.TOKEN_BYTES || '32', 10),
    tokenHashAlgo: process.env.TOKEN_HASH_ALGO || 'sha256',
    tokenHashSecret: process.env.TOKEN_HASH_SECRET || 'CHANGE_THIS_PEPPER_SECRET',
    tokenExpiryMinutes: parseInt(process.env.TOKEN_EXPIRY_MINUTES || '1440', 10), // 24 hours
  },
  roles: {
    student: process.env.STUDENT_ROLE_ID || '',
    graduate: process.env.GRADUATE_ROLE_ID || '',
    landlord: process.env.LANDLORD_ROLE_ID || '',
    default: process.env.DEFAULT_ROLE_ID || process.env.STUDENT_ROLE_ID || '',
  },
  collexia: {
    apiUrl: process.env.COLLEXIA_API_URL || process.env.NEXT_PUBLIC_COLLEXIA_API_URL || 'https://collexia.pozi.com.na',
  },
};

// Validate required configuration
if (!config.directus.url) {
  console.warn('⚠️  WARNING: NEXT_PUBLIC_DIRECTUS_URL is not set. Directus API calls will fail.');
}

if (!config.directus.token) {
  console.warn('⚠️  WARNING: DIRECTUS_TOKEN or DIRECTUS_ADMIN_TOKEN is not set. Admin operations will fail.');
}

