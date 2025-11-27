/**
 * Script to create .env.local file with all required environment variables
 * Usage: node create-env-file.js [directus-token]
 */

const fs = require('fs');
const path = require('path');

const ENV_FILE = path.join(__dirname, '.env.local');
const DIRECTUS_BASE_URL = 'https://app.pozi.com.na';

// Get token from command line argument or environment variable
const API_TOKEN = process.argv[2] || process.env.DIRECTUS_TOKEN || process.env.DIRECTUS_ADMIN_TOKEN || '';

function createEnvFile() {
  let envContent = `# =============================================================================
# DIRECTUS CONFIGURATION (Required)
# =============================================================================
# Your Directus instance URL
NEXT_PUBLIC_DIRECTUS_URL=${DIRECTUS_BASE_URL}
DIRECTUS_URL=${DIRECTUS_BASE_URL}

# Directus Admin Static Token (Required for server-side operations)
# Get this from: Settings > Access Tokens > Create Token (with Admin role)
DIRECTUS_TOKEN=${API_TOKEN || 'your-directus-admin-token-here'}
DIRECTUS_ADMIN_TOKEN=${API_TOKEN || 'your-directus-admin-token-here'}
NEXT_PUBLIC_DIRECTUS_TOKEN=

# =============================================================================
# APPLICATION URLs
# =============================================================================
# Public URL of your application (used for email links)
NEXT_PUBLIC_APP_URL=http://localhost:3000
PUBLIC_APP_URL=http://localhost:3000

# =============================================================================
# SENDGRID EMAIL CONFIGURATION (Required for email features)
# =============================================================================
# Your SendGrid API Key
# Get this from: https://app.sendgrid.com/settings/api_keys
SENDGRID_API_KEY=your-sendgrid-api-key-here

# Email sender configuration
SENDGRID_FROM_EMAIL=no-reply@pozi.com
SENDGRID_FROM_NAME=Pozi Student Living

# SendGrid Dynamic Template IDs
# Create templates in SendGrid and copy the template IDs (format: d-xxxxxxxxxxxxx)
SENDGRID_TEMPLATE_ID=your-verification-email-template-id-here
SENDGRID_PASSWORD_RESET_TEMPLATE_ID=your-password-reset-email-template-id-here

# =============================================================================
# TOKEN CONFIGURATION (Optional - has defaults)
# =============================================================================
# Number of random bytes for token generation (default: 32)
TOKEN_BYTES=32

# Hash algorithm for token hashing (default: sha256)
TOKEN_HASH_ALGO=sha256

# Secret pepper for token hashing (CHANGE THIS IN PRODUCTION!)
# Generate a strong random string for production use
TOKEN_HASH_SECRET=CHANGE_THIS_PEPPER_SECRET_TO_A_STRONG_RANDOM_STRING

# Token expiry time in minutes (default: 1440 = 24 hours)
TOKEN_EXPIRY_MINUTES=1440

# =============================================================================
# ROLE IDs (Required - get these from your Directus instance)
# =============================================================================
# Run: node setup-roles.js YOUR_ADMIN_TOKEN to automatically fetch and set these
# Or manually get from Directus: Settings > Roles & Permissions > Copy Role ID

# Student role UUID
STUDENT_ROLE_ID=

# Property Owner/Landlord role UUID
LANDLORD_ROLE_ID=

# Default role UUID (usually same as STUDENT_ROLE_ID)
DEFAULT_ROLE_ID=

# =============================================================================
# NODE ENVIRONMENT
# =============================================================================
NODE_ENV=development
`;

  // Check if .env.local already exists
  if (fs.existsSync(ENV_FILE)) {
    console.log('⚠️  .env.local file already exists!');
    console.log('   The file will be backed up to .env.local.backup');
    fs.copyFileSync(ENV_FILE, ENV_FILE + '.backup');
  }

  // Write the new .env.local file
  fs.writeFileSync(ENV_FILE, envContent, 'utf8');
  
  console.log('✅ .env.local file created successfully!\n');
  console.log('📝 Next steps:');
  console.log('   1. Open .env.local and fill in your credentials:');
  console.log('      - DIRECTUS_TOKEN: Your Directus admin token');
  console.log('      - SENDGRID_API_KEY: Your SendGrid API key');
  console.log('      - SENDGRID_TEMPLATE_ID: Your verification email template ID');
  console.log('      - SENDGRID_PASSWORD_RESET_TEMPLATE_ID: Your password reset template ID');
  console.log('\n   2. Run the role setup script to fetch role IDs:');
  console.log('      node setup-roles.js YOUR_ADMIN_TOKEN');
  console.log('\n   3. Or manually add role IDs from Directus:');
  console.log('      - Go to Settings > Roles & Permissions');
  console.log('      - Copy the UUID for Student and Property Owner roles');
  console.log('      - Add them to .env.local\n');
  
  if (API_TOKEN) {
    console.log('🔑 Directus token was provided, now fetching roles...\n');
    // Import and run the setup-roles script
    require('./setup-roles.js');
  } else {
    console.log('💡 Tip: You can create the file and fetch roles in one command:');
    console.log('   node create-env-file.js YOUR_ADMIN_TOKEN\n');
  }
}

createEnvFile();

