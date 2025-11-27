/**
 * Update user's token field with the current cookie token
 * This fixes the issue where the cookie token doesn't match the database
 */

require('dotenv').config({ path: '.env.local' });

const DIRECTUS_BASE_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || process.env.DIRECTUS_URL || 'https://app.pozi.com.na';
const API_TOKEN = process.env.DIRECTUS_TOKEN || process.env.DIRECTUS_ADMIN_TOKEN || '';

// Get token from command line argument or use the provided one
const COOKIE_TOKEN = process.argv[2] || 'IET_yEGLfbnxVroGhzoHSxTm0OaD0MmwymnuY80try0';

async function updateUserToken() {
  console.log('🔧 Updating user token field...\n');

  if (!API_TOKEN) {
    console.error('❌ Error: DIRECTUS_TOKEN not found in .env.local');
    process.exit(1);
  }

  if (!COOKIE_TOKEN) {
    console.error('❌ Error: No token provided');
    console.error('Usage: node update-user-token.js <token>');
    process.exit(1);
  }

  try {
    // First, find the user with this token (if it exists)
    console.log('🔍 Checking if token exists in database...');
    const checkParams = new URLSearchParams();
    checkParams.append('filter[token][_eq]', COOKIE_TOKEN);
    checkParams.append('fields', 'id,email,first_name,last_name');
    checkParams.append('limit', '1');

    const checkResponse = await fetch(`${DIRECTUS_BASE_URL}/users?${checkParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (checkResponse.ok) {
      const checkData = await checkResponse.json();
      if (checkData.data && checkData.data.length > 0) {
        console.log('✅ Token already exists in database for user:', checkData.data[0].email);
        console.log('   User ID:', checkData.data[0].id);
        return;
      }
    }

    // Token doesn't exist, need to find user by email or update all users
    // Let's get the current user from the session endpoint or properties
    console.log('🔍 Token not found in database. Finding user from properties...');
    
    // Get properties and find which user owns property 6
    const propertiesResponse = await fetch(`${DIRECTUS_BASE_URL}/items/properties?filter[id][_eq]=6&fields=owner.*`, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (propertiesResponse.ok) {
      const propsData = await propertiesResponse.json();
      if (propsData.data && propsData.data.length > 0) {
        const owner = propsData.data[0].owner;
        if (owner && owner.id) {
          const userId = owner.id;
          console.log('✅ Found user from property 6:');
          console.log('   User ID:', userId);
          console.log('   Email:', owner.email);
          console.log('   Name:', owner.first_name, owner.last_name);
          console.log('   Current token:', owner.token ? owner.token.substring(0, 10) + '...' : 'null');

          // Update the user's token
          console.log('\n💾 Updating user token...');
          const updateResponse = await fetch(`${DIRECTUS_BASE_URL}/users/${userId}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${API_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              token: COOKIE_TOKEN,
            }),
          });

          if (updateResponse.ok) {
            console.log('✅ Token updated successfully!');
            console.log('   New token:', COOKIE_TOKEN.substring(0, 10) + '...');
          } else {
            const errorText = await updateResponse.text();
            console.error('❌ Failed to update token:', updateResponse.status);
            console.error('Response:', errorText.substring(0, 500));
          }
        } else {
          console.error('❌ Property 6 has no owner');
        }
      } else {
        console.error('❌ Property 6 not found');
      }
    } else {
      console.error('❌ Failed to fetch property 6');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

updateUserToken();

