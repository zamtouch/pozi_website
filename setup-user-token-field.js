/**
 * Setup script to ensure the 'token' field exists in Directus users table
 * This field stores the static authentication token for each user
 */

require('dotenv').config({ path: '.env.local' });

const DIRECTUS_BASE_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || process.env.DIRECTUS_URL || 'https://app.pozi.com.na';
const API_TOKEN = process.env.DIRECTUS_TOKEN || process.env.DIRECTUS_ADMIN_TOKEN || '';

async function setupUserTokenField() {
  console.log('🔧 Setting up token field in Directus users table...\n');

  if (!API_TOKEN) {
    console.error('❌ Error: DIRECTUS_TOKEN or DIRECTUS_ADMIN_TOKEN not found in .env.local');
    console.error('   Please add your Directus admin token to .env.local\n');
    process.exit(1);
  }

  try {
    // Check if the token field already exists
    console.log('🔍 Checking if token field exists...');
    const checkResponse = await fetch(`${DIRECTUS_BASE_URL}/fields/directus_users/token`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (checkResponse.status === 200) {
      const fieldData = await checkResponse.json();
      console.log('✅ Token field already exists!');
      console.log(`   Type: ${fieldData.data?.type || 'unknown'}`);
      console.log(`   Schema: ${JSON.stringify(fieldData.data?.schema || {}, null, 2)}\n`);
      return;
    }

    if (checkResponse.status !== 404) {
      const errorText = await checkResponse.text();
      console.error(`❌ Unexpected error checking field: ${checkResponse.status}`);
      console.error(`Response: ${errorText.substring(0, 200)}\n`);
      process.exit(1);
    }

    // Field doesn't exist, create it
    console.log('📝 Token field not found. Creating it...\n');

    const createResponse = await fetch(`${DIRECTUS_BASE_URL}/fields/directus_users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        field: 'token',
        type: 'string',
        meta: {
          interface: 'input',
          width: 'full',
          hidden: true, // Hide from admin UI for security
          readonly: false,
        },
        schema: {
          max_length: 255,
          is_nullable: true,
        },
      }),
    });

    if (createResponse.status === 200 || createResponse.status === 201) {
      console.log('✅ Token field created successfully!\n');
    } else {
      const errorText = await createResponse.text();
      console.error(`❌ Failed to create token field: ${createResponse.status}`);
      console.error(`Response: ${errorText.substring(0, 500)}\n`);
      
      console.log('📋 Manual setup instructions:');
      console.log('1. Go to: https://app.pozi.com.na/admin');
      console.log('2. Navigate to: Settings → Data Model → directus_users');
      console.log('3. Click "Create Field"');
      console.log('4. Field Name: token');
      console.log('5. Type: String');
      console.log('6. Max Length: 255');
      console.log('7. Check "Hidden" (to hide from admin UI)');
      console.log('8. Save\n');
      process.exit(1);
    }

    // Set field permissions (allow admin to read/write)
    console.log('🔐 Setting field permissions...');
    try {
      const permissionsResponse = await fetch(`${DIRECTUS_BASE_URL}/permissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collection: 'directus_users',
          role: null, // Admin role
          action: 'read',
          fields: ['*'], // Allow reading all fields including token
        }),
      });

      if (permissionsResponse.status === 200 || permissionsResponse.status === 201) {
        console.log('✅ Permissions set successfully!\n');
      } else {
        console.log('⚠️  Could not set permissions automatically (this is usually OK)\n');
      }
    } catch (permError) {
      console.log('⚠️  Could not set permissions automatically (this is usually OK)\n');
    }

    console.log('✅ Token field setup complete!');
    console.log('\n🎉 The token field is now ready to use.');
    console.log('   Users can now have static tokens stored for session management.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

setupUserTokenField();

