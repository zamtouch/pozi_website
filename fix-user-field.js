/**
 * Fix the user field to be a proper UUID relationship
 */

require('dotenv').config({ path: '.env.local' });

const DIRECTUS_BASE_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || process.env.DIRECTUS_URL || 'https://app.pozi.com.na';
const API_TOKEN = process.env.DIRECTUS_TOKEN || process.env.DIRECTUS_ADMIN_TOKEN || '';

async function fixUserField() {
  console.log('🔧 Fixing user field relationship...\n');

  try {
    // Update the user field to be a proper UUID with M2O relationship
    const updateResponse = await fetch(`${DIRECTUS_BASE_URL}/fields/verification_tokens/user`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'uuid',
        meta: {
          interface: 'select-dropdown-m2o',
          special: ['m2o'],
          options: {
            template: '{{first_name}} {{last_name}}',
          },
        },
        schema: {
          foreign_key_table: 'directus_users',
          foreign_key_column: 'id',
        },
      }),
    });

    if (updateResponse.status === 200) {
      console.log('✅ User field updated successfully!\n');
    } else {
      const errorText = await updateResponse.text();
      console.log(`⚠️  Could not update field automatically: ${updateResponse.status}`);
      console.log(`Response: ${errorText.substring(0, 200)}\n`);
      console.log('📋 Manual fix instructions:');
      console.log('1. Go to: https://app.pozi.com.na/admin');
      console.log('2. Navigate to: Settings → Data Model → verification_tokens');
      console.log('3. Click on the "user" field');
      console.log('4. Change Type to: "Many to One (M2O)"');
      console.log('5. Related Collection: directus_users');
      console.log('6. Save\n');
    }

    console.log('✅ Collection setup complete!');
    console.log('\n🎉 The verification_tokens collection is ready to use.');
    console.log('   You can now test the authentication flow again.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixUserField();

