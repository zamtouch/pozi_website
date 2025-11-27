/**
 * Script to check and create the verification_tokens collection in Directus
 * This collection is required for email verification and password reset functionality
 */

require('dotenv').config({ path: '.env.local' });

const DIRECTUS_BASE_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || process.env.DIRECTUS_URL || 'https://app.pozi.com.na';
const API_TOKEN = process.env.DIRECTUS_TOKEN || process.env.DIRECTUS_ADMIN_TOKEN || '';

async function setupVerificationTokensCollection() {
  if (!API_TOKEN) {
    console.error('❌ Error: DIRECTUS_TOKEN or DIRECTUS_ADMIN_TOKEN not found in .env.local');
    console.log('\nPlease make sure your .env.local file has the DIRECTUS_TOKEN set.');
    process.exit(1);
  }

  try {
    console.log('🔍 Checking verification_tokens collection in Directus...');
    console.log(`📍 Directus URL: ${DIRECTUS_BASE_URL}\n`);

    // Check if collection exists
    const checkResponse = await fetch(`${DIRECTUS_BASE_URL}/collections/verification_tokens`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (checkResponse.status === 200) {
      const collection = await checkResponse.json();
      console.log('✅ verification_tokens collection already exists!');
      console.log(`   Collection: ${collection.data.collection}`);
      console.log(`   Meta: ${JSON.stringify(collection.data.meta, null, 2)}\n`);

      // Check fields
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
        console.log(`📋 Found ${fields.length} field(s) in the collection:\n`);
        
        const requiredFields = ['id', 'user', 'token_hash', 'purpose', 'expires_at', 'used', 'used_at'];
        const existingFieldNames = fields.map(f => f.field);
        
        requiredFields.forEach(fieldName => {
          if (existingFieldNames.includes(fieldName)) {
            console.log(`   ✅ ${fieldName}`);
          } else {
            console.log(`   ❌ ${fieldName} - MISSING`);
          }
        });

        // Check if we need to create missing fields
        const missingFields = requiredFields.filter(f => !existingFieldNames.includes(f));
        if (missingFields.length > 0) {
          console.log(`\n⚠️  Missing fields detected. Please create them manually in Directus or run this script with --create-fields flag.`);
        } else {
          console.log('\n✅ All required fields are present!');
        }
      }
    } else if (checkResponse.status === 403) {
      console.error('❌ Permission denied. The admin token may not have sufficient permissions.');
      console.log('\nPlease ensure:');
      console.log('   1. The token has Admin role or full permissions');
      console.log('   2. The token is a static token (not a temporary access token)');
      process.exit(1);
    } else if (checkResponse.status === 404) {
      console.log('⚠️  verification_tokens collection does not exist.');
      console.log('\n📝 Creating verification_tokens collection...\n');

      // Create the collection
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
            display_template: null,
            hidden: false,
            singleton: false,
            translations: null,
            archive_field: null,
            archive_app_filter: true,
            archive_value: null,
            unarchive_value: null,
            sort_field: null,
          },
          schema: {
            name: 'verification_tokens',
          },
        }),
      });

      if (createCollectionResponse.status === 200 || createCollectionResponse.status === 201) {
        console.log('✅ Collection created successfully!\n');
      } else {
        const error = await createCollectionResponse.text();
        console.error(`❌ Failed to create collection: ${createCollectionResponse.status}`);
        console.error(`Error: ${error}`);
        process.exit(1);
      }

      // Now create the fields
      console.log('📝 Creating required fields...\n');

      const fields = [
        {
          field: 'id',
          type: 'uuid',
          meta: {
            hidden: false,
            interface: 'input',
            readonly: true,
          },
          schema: {
            is_primary_key: true,
            has_auto_increment: false,
          },
        },
        {
          field: 'user',
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
        },
        {
          field: 'token_hash',
          type: 'string',
          meta: {
            interface: 'input',
            width: 'full',
          },
          schema: {
            max_length: 255,
          },
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
          schema: {
            max_length: 50,
          },
        },
        {
          field: 'expires_at',
          type: 'timestamp',
          meta: {
            interface: 'datetime',
            width: 'half',
          },
          schema: {},
        },
        {
          field: 'used',
          type: 'boolean',
          meta: {
            interface: 'boolean',
            width: 'half',
          },
          schema: {
            default_value: false,
          },
        },
        {
          field: 'used_at',
          type: 'timestamp',
          meta: {
            interface: 'datetime',
            width: 'half',
            required: false,
          },
          schema: {
            is_nullable: true,
          },
        },
      ];

      for (const field of fields) {
        try {
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
          } else {
            const errorText = await fieldResponse.text();
            if (fieldResponse.status === 403) {
              console.log(`   ⚠️  Permission denied for field: ${field.field}`);
              console.log(`      You may need to create this field manually in Directus`);
            } else {
              console.log(`   ⚠️  Failed to create field: ${field.field} (${fieldResponse.status})`);
              console.log(`      Error: ${errorText.substring(0, 100)}`);
            }
          }
        } catch (error) {
          console.log(`   ❌ Error creating field ${field.field}: ${error.message}`);
        }
      }

      console.log('\n✅ Collection setup complete!');
      console.log('\n📋 Next steps:');
      console.log('   1. Go to Directus Admin Panel → verification_tokens collection');
      console.log('   2. Verify all fields are created correctly');
      console.log('   3. Set permissions for the collection if needed');
      console.log('   4. Test the authentication flow again\n');
    } else {
      const errorText = await checkResponse.text();
      console.error(`❌ Unexpected error: ${checkResponse.status}`);
      console.error(`Error: ${errorText}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('fetch')) {
      console.error('\n⚠️  Network error. Please check:');
      console.error('   - Directus URL is correct');
      console.error('   - You have internet connection');
      console.error('   - Directus instance is accessible');
    }
    process.exit(1);
  }
}

setupVerificationTokensCollection();

