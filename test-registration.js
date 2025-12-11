/**
 * Test script to verify registration flow
 * Tests the signup API and file upload endpoints
 */

require('dotenv').config({ path: '.env.local' });

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://pozi.com.na';
const DIRECTUS_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || process.env.DIRECTUS_URL || 'https://app.pozi.com.na';
const API_TOKEN = process.env.DIRECTUS_TOKEN || process.env.DIRECTUS_ADMIN_TOKEN || '';

async function testRegistrationFlow() {
  console.log('🧪 Testing Registration Flow\n');
  console.log('=' .repeat(50));

  // Test 1: Check if fields exist in Directus
  console.log('\n1️⃣ Checking if required fields exist in Directus...\n');
  
  const requiredFields = [
    'responsible_first_name',
    'responsible_last_name',
    'responsible_relationship',
    'responsible_email',
    'responsible_id_number',
    'responsible_cell',
    'responsible_occupation',
    'id_certified_copy',
    'payslip',
    'bank_statement_6months',
  ];

  let allFieldsExist = true;
  for (const field of requiredFields) {
    try {
      const response = await fetch(`${DIRECTUS_URL}/fields/directus_users/${field}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200) {
        console.log(`✅ Field "${field}" exists`);
      } else {
        console.log(`❌ Field "${field}" does NOT exist (Status: ${response.status})`);
        allFieldsExist = false;
      }
    } catch (error) {
      console.log(`❌ Error checking field "${field}":`, error.message);
      allFieldsExist = false;
    }
  }

  if (!allFieldsExist) {
    console.log('\n⚠️  Some fields are missing. Please run: node setup-student-fields.js\n');
  }

  // Test 2: Check API endpoints
  console.log('\n2️⃣ Checking API endpoints...\n');
  
  // Check register-upload endpoint
  try {
    const uploadTest = await fetch(`${API_BASE}/api/auth/register-upload`, {
      method: 'POST',
      body: new FormData(), // Empty form data to test endpoint exists
    });
    console.log(`✅ Register upload endpoint exists (Status: ${uploadTest.status})`);
  } catch (error) {
    console.log(`❌ Register upload endpoint error:`, error.message);
  }

  // Check signup endpoint
  try {
    const signupTest = await fetch(`${API_BASE}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true }),
    });
    console.log(`✅ Signup endpoint exists (Status: ${signupTest.status})`);
  } catch (error) {
    console.log(`❌ Signup endpoint error:`, error.message);
  }

  // Test 3: Check permissions
  console.log('\n3️⃣ Checking permissions...\n');
  
  if (!API_TOKEN) {
    console.log('⚠️  No API token found. Cannot check permissions.');
  } else {
    try {
      // Check if we can read users collection
      const usersResponse = await fetch(`${DIRECTUS_URL}/users?limit=1`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      if (usersResponse.ok) {
        console.log('✅ Can read users collection');
      } else {
        console.log(`❌ Cannot read users collection (Status: ${usersResponse.status})`);
      }

      // Check if we can create files
      const filesResponse = await fetch(`${DIRECTUS_URL}/files?limit=1`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      if (filesResponse.ok) {
        console.log('✅ Can access files collection');
      } else {
        console.log(`❌ Cannot access files collection (Status: ${filesResponse.status})`);
      }
    } catch (error) {
      console.log(`❌ Permission check error:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('\n✅ Registration flow test complete!\n');
  console.log('📋 Next steps:');
  console.log('   1. Run: node setup-student-fields.js (if fields are missing)');
  console.log('   2. Run: node setup-registration-permissions.js (to set permissions)');
  console.log('   3. Test registration at: https://pozi.com.na/auth/register\n');
}

testRegistrationFlow().catch(console.error);



















