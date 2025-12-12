/**
 * Check and update field visibility in Directus users collection
 */

require('dotenv').config({ path: '.env.local' });

const DIRECTUS_BASE_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || process.env.DIRECTUS_URL || 'https://app.pozi.com.na';
const API_TOKEN = process.env.DIRECTUS_TOKEN || process.env.DIRECTUS_ADMIN_TOKEN || '';

const fields = [
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

async function checkAndUpdateFields() {
  console.log('🔍 Checking field visibility in Directus...\n');

  if (!API_TOKEN) {
    console.error('❌ Error: DIRECTUS_TOKEN or DIRECTUS_ADMIN_TOKEN not found in .env.local');
    process.exit(1);
  }

  for (const fieldName of fields) {
    try {
      // Get current field configuration
      const response = await fetch(`${DIRECTUS_BASE_URL}/fields/directus_users/${fieldName}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200) {
        const fieldData = await response.json();
        const meta = fieldData.data?.meta || {};
        
        console.log(`\n📋 Field: ${fieldName}`);
        console.log(`   Hidden: ${meta.hidden || false}`);
        console.log(`   Readonly: ${meta.readonly || false}`);
        console.log(`   Interface: ${meta.interface || 'N/A'}`);
        
        // Update field to make it visible if hidden
        if (meta.hidden) {
          console.log(`   ⚠️  Field is hidden - updating to make it visible...`);
          
          const updateResponse = await fetch(`${DIRECTUS_BASE_URL}/fields/directus_users/${fieldName}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${API_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              meta: {
                ...meta,
                hidden: false,
                readonly: false,
              },
            }),
          });

          if (updateResponse.ok) {
            console.log(`   ✅ Field is now visible`);
          } else {
            const error = await updateResponse.text();
            console.log(`   ❌ Failed to update: ${error.substring(0, 200)}`);
          }
        } else {
          console.log(`   ✅ Field is visible`);
        }
      } else {
        console.log(`\n❌ Field "${fieldName}" not found (Status: ${response.status})`);
      }
    } catch (error) {
      console.error(`\n❌ Error checking field "${fieldName}":`, error.message);
    }
  }

  console.log('\n✅ Field visibility check complete!');
  console.log('\n📝 Note: If fields are still not visible in Directus admin:');
  console.log('   1. Go to: https://app.pozi.com.na/admin');
  console.log('   2. Navigate to: Settings → Data Model → directus_users');
  console.log('   3. Check if fields are listed (they may be at the bottom)');
  console.log('   4. If not listed, click "Create Field" and check if they already exist\n');
}

checkAndUpdateFields().catch(console.error);






















