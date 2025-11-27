/**
 * Script to create verification_tokens collection in Directus
 * Handles permission issues and provides manual setup instructions
 */

require('dotenv').config({ path: '.env.local' });

const DIRECTUS_BASE_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || process.env.DIRECTUS_URL || 'https://app.pozi.com.na';
const API_TOKEN = process.env.DIRECTUS_TOKEN || process.env.DIRECTUS_ADMIN_TOKEN || '';

async function createVerificationCollection() {
  if (!API_TOKEN) {
    console.error('❌ Error: DIRECTUS_TOKEN not found in .env.local');
    process.exit(1);
  }

  console.log('🔍 Setting up verification_tokens collection...\n');

  try {
    // Step 1: Create the collection
    console.log('Step 1: Creating collection...');
    const createCollectionResponse = await fetch(`${DIRECTUS_BASE_URL}/collections`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        collection: 'verification_tokens',
        meta: {
          collection: 'verification_tokens',
          icon: 'vpn_key',
          note: 'Stores verification and password reset tokens',
          hidden: false,
          singleton: false,
        },
        schema: {
          name: 'verification_tokens',
        },
      }),
    });

    if (createCollectionResponse.status === 200 || createCollectionResponse.status === 201) {
      console.log('✅ Collection created successfully!\n');
    } else if (createCollectionResponse.status === 403) {
      console.log('⚠️  Permission denied. You may need to create the collection manually.\n');
      console.log('📋 Manual Setup Instructions:');
      console.log('   1. Go to: https://app.pozi.com.na/admin');
      console.log('   2. Navigate to: Settings → Data Model');
      console.log('   3. Click "Create Collection"');
      console.log('   4. Collection Name: verification_tokens');
      console.log('   5. Click "Continue"\n');
    } else {
      const errorText = await createCollectionResponse.text();
      if (errorText.includes('already exists') || createCollectionResponse.status === 409) {
        console.log('✅ Collection already exists!\n');
      } else {
        console.log(`⚠️  Status: ${createCollectionResponse.status}`);
        console.log(`Response: ${errorText.substring(0, 200)}\n`);
      }
    }

    // Step 2: Create fields
    console.log('Step 2: Creating fields...\n');

    const fields = [
      {
        field: 'id',
        type: 'uuid',
        meta: { interface: 'input', readonly: true },
        schema: { is_primary_key: true },
      },
      {
        field: 'user',
        type: 'uuid',
        meta: {
          interface: 'select-dropdown-m2o',
          special: ['m2o'],
          options: { template: '{{first_name}} {{last_name}}' },
        },
        schema: {
          foreign_key_table: 'directus_users',
          foreign_key_column: 'id',
        },
      },
      {
        field: 'token_hash',
        type: 'string',
        meta: { interface: 'input', width: 'full' },
        schema: { max_length: 255 },
      },
      {
        field: 'purpose',
        type: 'string',
        meta: {
          interface: 'select-dropdown',
          options: {
            choices: [
              { text: 'Email Verification', value: 'email_verify' },
              { text: 'Password Reset', value: 'password_reset' },
            ],
          },
        },
        schema: { max_length: 50 },
      },
      {
        field: 'expires_at',
        type: 'timestamp',
        meta: { interface: 'datetime', width: 'half' },
      },
      {
        field: 'used',
        type: 'boolean',
        meta: { interface: 'boolean', width: 'half' },
        schema: { default_value: false },
      },
      {
        field: 'used_at',
        type: 'timestamp',
        meta: { interface: 'datetime', width: 'half', required: false },
        schema: { is_nullable: true },
      },
    ];

    for (const field of fields) {
      try {
        // Skip id field if collection already exists (it's auto-created)
        if (field.field === 'id') {
          console.log(`   ⏭️  Skipping ${field.field} (auto-created)`);
          continue;
        }

        const fieldResponse = await fetch(`${DIRECTUS_BASE_URL}/fields/verification_tokens`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(field),
        });

        if (fieldResponse.status === 200 || fieldResponse.status === 201) {
          console.log(`   ✅ Created field: ${field.field}`);
        } else if (fieldResponse.status === 403) {
          console.log(`   ⚠️  Permission denied for: ${field.field}`);
        } else {
          const errorText = await fieldResponse.text();
          if (errorText.includes('already exists') || fieldResponse.status === 409) {
            console.log(`   ✅ Field already exists: ${field.field}`);
          } else {
            console.log(`   ⚠️  Failed to create ${field.field}: ${fieldResponse.status}`);
          }
        }
      } catch (error) {
        console.log(`   ❌ Error creating ${field.field}: ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n📋 Manual Setup Instructions (if automated setup failed):\n');
    console.log('1. Go to Directus Admin: https://app.pozi.com.na/admin');
    console.log('2. Settings → Data Model → Create Collection');
    console.log('3. Collection Name: verification_tokens');
    console.log('4. Add the following fields:\n');
    console.log('   Field Name        | Type      | Required | Notes');
    console.log('   ------------------|-----------|----------|-------------------');
    console.log('   id                | UUID      | Yes      | Primary Key (auto)');
    console.log('   user              | UUID      | Yes      | M2O → directus_users');
    console.log('   token_hash        | String    | Yes      | Max 255 chars');
    console.log('   purpose           | String    | Yes      | Enum: email_verify, password_reset');
    console.log('   expires_at        | Timestamp | Yes      |');
    console.log('   used              | Boolean   | Yes      | Default: false');
    console.log('   used_at           | Timestamp | No       | Nullable\n');
    console.log('5. Set permissions: Settings → Roles & Permissions');
    console.log('   - Ensure Admin role has full access');
    console.log('   - Set appropriate permissions for other roles\n');
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createVerificationCollection();

