/**
 * Script to fetch roles from Directus and identify Student and Property Owner roles
 * This script reads from .env.local file if available
 */

require('dotenv').config({ path: '.env.local' });

const DIRECTUS_BASE_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || process.env.DIRECTUS_URL || 'https://app.pozi.com.na';
const API_TOKEN = process.env.DIRECTUS_TOKEN || process.env.DIRECTUS_ADMIN_TOKEN || process.env.NEXT_PUBLIC_DIRECTUS_TOKEN || '';

async function fetchRoles() {
  if (!API_TOKEN) {
    console.error('❌ Error: DIRECTUS_TOKEN or DIRECTUS_ADMIN_TOKEN not found');
    console.log('\nPlease set the token in your .env.local file:');
    console.log('  DIRECTUS_TOKEN=your-admin-token');
    console.log('\nOr set it as an environment variable:');
    console.log('  Windows PowerShell: $env:DIRECTUS_TOKEN="your-token"');
    console.log('  Windows CMD: set DIRECTUS_TOKEN=your-token');
    process.exit(1);
  }

  if (!DIRECTUS_BASE_URL) {
    console.error('❌ Error: NEXT_PUBLIC_DIRECTUS_URL not found');
    console.log('\nPlease set the Directus URL in your .env.local file:');
    console.log('  NEXT_PUBLIC_DIRECTUS_URL=https://your-directus-instance.com');
    process.exit(1);
  }

  try {
    console.log('🔍 Fetching roles from Directus...');
    console.log(`📍 Directus URL: ${DIRECTUS_BASE_URL}`);
    console.log(`🔑 Token: ${API_TOKEN.substring(0, 10)}...${API_TOKEN.substring(API_TOKEN.length - 5)}\n`);

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
      if (response.status === 401) {
        console.error('\n⚠️  Authentication failed. Please check your DIRECTUS_TOKEN.');
      }
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

    // If roles are missing, provide instructions to create them
    if (!studentRole || !landlordRole) {
      console.log('\n📌 To create missing roles in Directus:');
      console.log('   1. Go to Settings > Roles & Permissions');
      console.log('   2. Click "Create Role"');
      console.log('   3. Name it "Student" or "Property Owner"');
      console.log('   4. Set appropriate permissions');
      console.log('   5. Copy the Role ID and add it to .env.local');
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

fetchRoles();

