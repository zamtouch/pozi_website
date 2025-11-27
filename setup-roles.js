/**
 * Script to fetch roles from Directus and update .env.local with role IDs
 * Usage: node setup-roles.js [directus-token]
 * Or set DIRECTUS_TOKEN environment variable
 */

const fs = require('fs');
const path = require('path');

// Get token from command line argument or environment variable
const API_TOKEN = process.argv[2] || process.env.DIRECTUS_TOKEN || process.env.DIRECTUS_ADMIN_TOKEN || '';
const DIRECTUS_BASE_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || process.env.DIRECTUS_URL || 'https://app.pozi.com.na';
const ENV_FILE = path.join(__dirname, '.env.local');

async function fetchRoles() {
  if (!API_TOKEN) {
    console.error('❌ Error: Directus admin token is required');
    console.log('\nUsage:');
    console.log('  node setup-roles.js YOUR_ADMIN_TOKEN');
    console.log('\nOr set environment variable:');
    console.log('  $env:DIRECTUS_TOKEN="your-token"; node setup-roles.js');
    console.log('\nOr create .env.local with:');
    console.log('  DIRECTUS_TOKEN=your-admin-token');
    console.log('  NEXT_PUBLIC_DIRECTUS_URL=https://app.pozi.com.na');
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
        console.error('\n⚠️  Authentication failed. Please check your admin token.');
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

    console.log('\n📋 Role Identification:\n');

    if (studentRole) {
      console.log(`✅ Student Role Found: "${studentRole.name}" (${studentRole.id})`);
    } else {
      console.log(`⚠️  Student Role Not Found`);
      console.log(`   Looking for roles with "student" or "learner" in the name`);
    }

    if (landlordRole) {
      console.log(`✅ Property Owner/Landlord Role Found: "${landlordRole.name}" (${landlordRole.id})`);
    } else {
      console.log(`⚠️  Property Owner/Landlord Role Not Found`);
      console.log(`   Looking for roles with "landlord", "property", "owner", or "provider" in the name`);
    }

    // Read existing .env.local or create new content
    let envContent = '';
    if (fs.existsSync(ENV_FILE)) {
      envContent = fs.readFileSync(ENV_FILE, 'utf8');
      console.log('\n📖 Found existing .env.local file');
    } else {
      console.log('\n📝 Creating new .env.local file');
      envContent = `# Directus Configuration
NEXT_PUBLIC_DIRECTUS_URL=${DIRECTUS_BASE_URL}
DIRECTUS_TOKEN=${API_TOKEN}
DIRECTUS_ADMIN_TOKEN=${API_TOKEN}

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
PUBLIC_APP_URL=http://localhost:3000

# SendGrid Email Configuration (Required for email features)
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=no-reply@pozi.com
SENDGRID_FROM_NAME=Pozi Student Living
SENDGRID_TEMPLATE_ID=
SENDGRID_PASSWORD_RESET_TEMPLATE_ID=

# Token Configuration
TOKEN_BYTES=32
TOKEN_HASH_ALGO=sha256
TOKEN_HASH_SECRET=CHANGE_THIS_PEPPER_SECRET
TOKEN_EXPIRY_MINUTES=1440

# Role IDs
`;
    }

    // Update or add role IDs
    const roleUpdates = [];
    
    if (studentRole) {
      if (envContent.includes('STUDENT_ROLE_ID=')) {
        envContent = envContent.replace(/STUDENT_ROLE_ID=.*/g, `STUDENT_ROLE_ID=${studentRole.id}`);
        roleUpdates.push(`Updated STUDENT_ROLE_ID=${studentRole.id}`);
      } else {
        envContent += `STUDENT_ROLE_ID=${studentRole.id}\n`;
        roleUpdates.push(`Added STUDENT_ROLE_ID=${studentRole.id}`);
      }
    } else {
      if (!envContent.includes('STUDENT_ROLE_ID=')) {
        envContent += `STUDENT_ROLE_ID=\n`;
      }
      console.log('\n⚠️  Warning: Student role not found. Please create it in Directus and update .env.local');
    }

    if (landlordRole) {
      if (envContent.includes('LANDLORD_ROLE_ID=')) {
        envContent = envContent.replace(/LANDLORD_ROLE_ID=.*/g, `LANDLORD_ROLE_ID=${landlordRole.id}`);
        roleUpdates.push(`Updated LANDLORD_ROLE_ID=${landlordRole.id}`);
      } else {
        envContent += `LANDLORD_ROLE_ID=${landlordRole.id}\n`;
        roleUpdates.push(`Added LANDLORD_ROLE_ID=${landlordRole.id}`);
      }
    } else {
      if (!envContent.includes('LANDLORD_ROLE_ID=')) {
        envContent += `LANDLORD_ROLE_ID=\n`;
      }
      console.log('\n⚠️  Warning: Property Owner/Landlord role not found. Please create it in Directus and update .env.local');
    }

    // Set default role to student if found
    if (studentRole) {
      if (envContent.includes('DEFAULT_ROLE_ID=')) {
        envContent = envContent.replace(/DEFAULT_ROLE_ID=.*/g, `DEFAULT_ROLE_ID=${studentRole.id}`);
      } else {
        envContent += `DEFAULT_ROLE_ID=${studentRole.id}\n`;
      }
    } else if (!envContent.includes('DEFAULT_ROLE_ID=')) {
      envContent += `DEFAULT_ROLE_ID=\n`;
    }

    // Write updated .env.local
    fs.writeFileSync(ENV_FILE, envContent, 'utf8');
    
    console.log('\n' + '='.repeat(80));
    console.log('\n✅ .env.local file updated successfully!\n');
    
    if (roleUpdates.length > 0) {
      roleUpdates.forEach(update => console.log(`   ${update}`));
    }

    if (studentRole && landlordRole) {
      console.log('\n🎉 All required roles are configured!');
      console.log('   You can now test the authentication system.');
    } else {
      console.log('\n⚠️  Some roles are missing. Please:');
      console.log('   1. Create the missing roles in Directus');
      console.log('   2. Run this script again to update .env.local');
      console.log('\n   Or manually add the role IDs to .env.local');
    }

    console.log('\n' + '='.repeat(80));

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

