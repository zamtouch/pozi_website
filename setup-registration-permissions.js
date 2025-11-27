/**
 * Setup script to ensure proper permissions for registration fields
 * Sets permissions for the new student registration fields in Directus
 */

require('dotenv').config({ path: '.env.local' });

const DIRECTUS_BASE_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || process.env.DIRECTUS_URL || 'https://app.pozi.com.na';
const API_TOKEN = process.env.DIRECTUS_TOKEN || process.env.DIRECTUS_ADMIN_TOKEN || '';

async function setupPermissions() {
  console.log('🔐 Setting up permissions for registration fields...\n');

  if (!API_TOKEN) {
    console.error('❌ Error: DIRECTUS_TOKEN or DIRECTUS_ADMIN_TOKEN not found in .env.local');
    console.error('   Please add your Directus admin token to .env.local\n');
    process.exit(1);
  }

  try {
    // Get all roles to set permissions for each
    console.log('📋 Fetching roles...');
    const rolesResponse = await fetch(`${DIRECTUS_BASE_URL}/roles`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!rolesResponse.ok) {
      console.error('❌ Failed to fetch roles');
      process.exit(1);
    }

    const rolesData = await rolesResponse.json();
    const roles = rolesData.data || [];
    
    console.log(`✅ Found ${roles.length} roles\n`);

    // Fields that need permissions
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

    // For each role, set permissions to allow reading/writing these fields
    for (const role of roles) {
      console.log(`🔧 Setting permissions for role: ${role.name} (${role.id})...`);
      
      // Set read permission
      try {
        const readPermResponse = await fetch(`${DIRECTUS_BASE_URL}/permissions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            collection: 'directus_users',
            role: role.id,
            action: 'read',
            fields: ['*'], // Allow reading all fields
          }),
        });

        if (readPermResponse.ok || readPermResponse.status === 409) {
          console.log(`   ✅ Read permission set (or already exists)`);
        } else {
          console.log(`   ⚠️  Could not set read permission (Status: ${readPermResponse.status})`);
        }
      } catch (error) {
        console.log(`   ⚠️  Error setting read permission:`, error.message);
      }

      // Set update permission (users can update their own data)
      try {
        const updatePermResponse = await fetch(`${DIRECTUS_BASE_URL}/permissions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            collection: 'directus_users',
            role: role.id,
            action: 'update',
            fields: ['*'], // Allow updating all fields
            permissions: {
              _and: [
                {
                  id: {
                    _eq: '$CURRENT_USER',
                  },
                },
              ],
            },
          }),
        });

        if (updatePermResponse.ok || updatePermResponse.status === 409) {
          console.log(`   ✅ Update permission set (or already exists)`);
        } else {
          console.log(`   ⚠️  Could not set update permission (Status: ${updatePermResponse.status})`);
        }
      } catch (error) {
        console.log(`   ⚠️  Error setting update permission:`, error.message);
      }
    }

    // Also ensure admin can create users with these fields
    console.log('\n🔧 Setting admin permissions for user creation...');
    try {
      const createPermResponse = await fetch(`${DIRECTUS_BASE_URL}/permissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collection: 'directus_users',
          role: null, // Admin role
          action: 'create',
          fields: ['*'], // Allow creating with all fields
        }),
      });

      if (createPermResponse.ok || createPermResponse.status === 409) {
        console.log('✅ Admin create permission set (or already exists)');
      } else {
        console.log(`⚠️  Could not set admin create permission (Status: ${createPermResponse.status})`);
      }
    } catch (error) {
      console.log(`⚠️  Error setting admin create permission:`, error.message);
    }

    // Check files collection permissions (for file uploads)
    console.log('\n🔧 Checking files collection permissions...');
    try {
      const filesPermResponse = await fetch(`${DIRECTUS_BASE_URL}/permissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collection: 'directus_files',
          role: null, // Admin role
          action: 'create',
          fields: ['*'],
        }),
      });

      if (filesPermResponse.ok || filesPermResponse.status === 409) {
        console.log('✅ Files collection create permission set (or already exists)');
      } else {
        console.log(`⚠️  Could not set files create permission (Status: ${filesPermResponse.status})`);
      }
    } catch (error) {
      console.log(`⚠️  Error setting files permission:`, error.message);
    }

    console.log('\n✅ Permissions setup complete!');
    console.log('\n📝 Note: Permissions may need manual adjustment in Directus admin panel');
    console.log('   Go to: Settings → Roles & Permissions\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

setupPermissions();





