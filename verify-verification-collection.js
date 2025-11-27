/**
 * Script to verify verification_tokens collection and test permissions
 */

require('dotenv').config({ path: '.env.local' });

const DIRECTUS_BASE_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || process.env.DIRECTUS_URL || 'https://app.pozi.com.na';
const API_TOKEN = process.env.DIRECTUS_TOKEN || process.env.DIRECTUS_ADMIN_TOKEN || '';

async function verifyCollection() {
  console.log('🔍 Verifying verification_tokens collection...\n');

  try {
    // Test 1: Check if collection exists and is accessible
    console.log('Test 1: Checking collection access...');
    const collectionResponse = await fetch(`${DIRECTUS_BASE_URL}/collections/verification_tokens`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (collectionResponse.status === 200) {
      console.log('✅ Collection is accessible\n');
    } else {
      console.log(`❌ Collection access failed: ${collectionResponse.status}\n`);
      return;
    }

    // Test 2: Check fields
    console.log('Test 2: Verifying fields...');
    const fieldsResponse = await fetch(`${DIRECTUS_BASE_URL}/fields/verification_tokens`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (fieldsResponse.status === 200) {
      const fieldsData = await fieldsResponse.json();
      const fields = fieldsData.data || [];
      console.log(`✅ Found ${fields.length} field(s):`);
      fields.forEach(field => {
        console.log(`   - ${field.field} (${field.type})`);
      });
      console.log('');
    }

    // Test 3: Test write permission (create a test item)
    console.log('Test 3: Testing write permissions...');
    const testItemResponse = await fetch(`${DIRECTUS_BASE_URL}/items/verification_tokens`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: '00000000-0000-0000-0000-000000000000', // Dummy UUID for test
        token_hash: 'test_hash_' + Date.now(),
        purpose: 'email_verify',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        used: false,
      }),
    });

    if (testItemResponse.status === 200 || testItemResponse.status === 201) {
      const testData = await testItemResponse.json();
      const testId = testData.data?.id;
      console.log('✅ Write permission works!');
      
      // Clean up test item
      if (testId) {
        await fetch(`${DIRECTUS_BASE_URL}/items/verification_tokens/${testId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${API_TOKEN}`,
          },
        });
        console.log('✅ Test item cleaned up\n');
      }
    } else if (testItemResponse.status === 403) {
      console.log('❌ Write permission denied!');
      console.log('\n⚠️  Permission Issue Detected!\n');
      console.log('The admin token does not have write permissions for verification_tokens collection.');
      console.log('\n📋 To fix this:\n');
      console.log('1. Go to: https://app.pozi.com.na/admin');
      console.log('2. Navigate to: Settings → Roles & Permissions');
      console.log('3. Click on the role that your admin token belongs to (likely "Administrator")');
      console.log('4. Find "verification_tokens" collection');
      console.log('5. Set permissions:');
      console.log('   - Create: ✅ Allow');
      console.log('   - Read: ✅ Allow');
      console.log('   - Update: ✅ Allow');
      console.log('   - Delete: ✅ Allow');
      console.log('6. Click "Save"\n');
      
      const errorText = await testItemResponse.text();
      console.log(`Error details: ${errorText.substring(0, 200)}\n`);
    } else {
      const errorText = await testItemResponse.text();
      console.log(`⚠️  Unexpected response: ${testItemResponse.status}`);
      console.log(`Response: ${errorText.substring(0, 200)}\n`);
    }

    console.log('='.repeat(80));
    console.log('\n✅ Verification complete!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyCollection();

