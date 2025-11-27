/**
 * Script to fetch roles from Directus and identify Student and Property Owner roles
 * This will help configure the authentication system
 */

const DIRECTUS_BASE_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://app.pozi.com.na';
const API_TOKEN = process.env.DIRECTUS_TOKEN || process.env.DIRECTUS_ADMIN_TOKEN || '';

async function fetchRoles() {
  if (!API_TOKEN) {
    console.error('❌ Error: DIRECTUS_TOKEN or DIRECTUS_ADMIN_TOKEN environment variable is required');
    console.log('\nPlease set the token in your environment:');
    console.log('  Windows PowerShell: $env:DIRECTUS_TOKEN="your-token"');
    console.log('  Windows CMD: set DIRECTUS_TOKEN=your-token');
    console.log('  Linux/Mac: export DIRECTUS_TOKEN=your-token');
    process.exit(1);
  }

  try {
    console.log('🔍 Fetching roles from Directus...');
    console.log(`📍 Directus URL: ${DIRECTUS_BASE_URL}\n`);

    const response = await fetch(`${DIRECTUS_BASE_URL}/roles`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error fetching roles: ${response.status} ${response.statusText}`);
      console.error(`Response: ${errorText}`);
      process.exit(1);
    }

    const data = await response.json();
    const roles = data.data || [];

    if (roles.length === 0) {
      console.log('⚠️  No roles found in Directus');
      process.exit(1);
    }

    console.log(`✅ Found ${roles.length} role(s):\n`);
    console.log('='.repeat(80));

    // Display all roles
    roles.forEach((role, index) => {
      console.log(`\n${index + 1}. Role: ${role.name || 'Unnamed'}`);
      console.log(`   ID: ${role.id}`);
      console.log(`   Admin Access: ${role.admin_access ? 'Yes' : 'No'}`);
      console.log(`   App Access: ${role.app_access ? 'Yes' : 'No'}`);
      if (role.description) {
        console.log(`   Description: ${role.description}`);
      }
    });

    console.log('\n' + '='.repeat(80));

    // Try to identify Student and Property Owner roles
    const studentRole = roles.find(r => 
      r.name && (
        r.name.toLowerCase().includes('student') ||
        r.name.toLowerCase().includes('learner')
      )
    );

    const landlordRole = roles.find(r => 
      r.name && (
        r.name.toLowerCase().includes('landlord') ||
        r.name.toLowerCase().includes('property') ||
        r.name.toLowerCase().includes('owner') ||
        r.name.toLowerCase().includes('provider')
      )
    );

    console.log('\n📋 Recommended Role Configuration:\n');

    if (studentRole) {
      console.log(`✅ Student Role Found:`);
      console.log(`   STUDENT_ROLE_ID=${studentRole.id}`);
    } else {
      console.log(`⚠️  Student Role Not Found`);
      console.log(`   Please create a role named "Student" or similar in Directus`);
    }

    if (landlordRole) {
      console.log(`\n✅ Property Owner/Landlord Role Found:`);
      console.log(`   LANDLORD_ROLE_ID=${landlordRole.id}`);
    } else {
      console.log(`\n⚠️  Property Owner/Landlord Role Not Found`);
      console.log(`   Please create a role named "Property Owner", "Landlord", or similar in Directus`);
    }

    // Generate .env.local content
    console.log('\n' + '='.repeat(80));
    console.log('\n📝 Add these to your .env.local file:\n');
    console.log('# Role IDs');
    if (studentRole) {
      console.log(`STUDENT_ROLE_ID=${studentRole.id}`);
    } else {
      console.log(`STUDENT_ROLE_ID=your-student-role-id-here`);
    }
    if (landlordRole) {
      console.log(`LANDLORD_ROLE_ID=${landlordRole.id}`);
    } else {
      console.log(`LANDLORD_ROLE_ID=your-landlord-role-id-here`);
    }
    if (studentRole) {
      console.log(`DEFAULT_ROLE_ID=${studentRole.id}`);
    } else {
      console.log(`DEFAULT_ROLE_ID=your-default-role-id-here`);
    }

    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fetchRoles();

