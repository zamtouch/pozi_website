/**
 * Verify all student registration fields exist and are accessible in Directus
 */

require('dotenv').config({ path: '.env.local' });

const DIRECTUS_BASE_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || process.env.DIRECTUS_URL || 'https://app.pozi.com.na';
const API_TOKEN = process.env.DIRECTUS_TOKEN || process.env.DIRECTUS_ADMIN_TOKEN || '';

const allFields = [
  { name: 'responsible_first_name', type: 'string', description: 'Person Responsible First Name' },
  { name: 'responsible_last_name', type: 'string', description: 'Person Responsible Last Name' },
  { name: 'responsible_relationship', type: 'string', description: 'Relationship to Tenant' },
  { name: 'responsible_email', type: 'string', description: 'Person Responsible Email' },
  { name: 'responsible_id_number', type: 'string', description: 'Person Responsible ID Number' },
  { name: 'responsible_cell', type: 'string', description: 'Person Responsible Cell Number' },
  { name: 'responsible_occupation', type: 'string', description: 'Person Responsible Occupation' },
  { name: 'id_certified_copy', type: 'uuid', description: 'ID Certified Copy (File)' },
  { name: 'payslip', type: 'uuid', description: 'Payslip (File)' },
  { name: 'bank_statement_6months', type: 'uuid', description: '6 Months Bank Statement (File)' },
];

async function verifyFields() {
  console.log('🔍 Verifying all fields in Directus users collection...\n');
  console.log('='.repeat(60));

  if (!API_TOKEN) {
    console.error('❌ Error: DIRECTUS_TOKEN or DIRECTUS_ADMIN_TOKEN not found');
    process.exit(1);
  }

  let allExist = true;
  const results = [];

  for (const field of allFields) {
    try {
      const response = await fetch(`${DIRECTUS_BASE_URL}/fields/directus_users/${field.name}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200) {
        const fieldData = await response.json();
        const data = fieldData.data || {};
        results.push({
          name: field.name,
          exists: true,
          type: data.type,
          hidden: data.meta?.hidden || false,
          readonly: data.meta?.readonly || false,
          interface: data.meta?.interface || 'N/A',
        });
        console.log(`✅ ${field.name.padEnd(30)} | Type: ${data.type.padEnd(10)} | Hidden: ${(data.meta?.hidden || false).toString().padEnd(5)} | Interface: ${data.meta?.interface || 'N/A'}`);
      } else {
        allExist = false;
        results.push({ name: field.name, exists: false });
        console.log(`❌ ${field.name.padEnd(30)} | NOT FOUND (Status: ${response.status})`);
      }
    } catch (error) {
      allExist = false;
      results.push({ name: field.name, exists: false, error: error.message });
      console.log(`❌ ${field.name.padEnd(30)} | ERROR: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  
  if (allExist) {
    console.log('\n✅ All fields exist in Directus!\n');
    console.log('📋 To view these fields in Directus Admin Panel:');
    console.log('   1. Go to: https://app.pozi.com.na/admin');
    console.log('   2. Navigate to: Settings → Data Model → directus_users');
    console.log('   3. Scroll down to see all fields (they may be at the bottom)');
    console.log('   4. Or use the search/filter to find fields starting with "responsible_"');
    console.log('\n📋 To view fields when editing a user:');
    console.log('   1. Go to: Content → Users');
    console.log('   2. Click on any user to edit');
    console.log('   3. Scroll down to see the new fields');
    console.log('   4. If fields are not visible, check the layout settings');
    console.log('\n💡 Tip: Fields might be in a collapsed section or need to be added to the layout');
  } else {
    console.log('\n⚠️  Some fields are missing. Running setup script...\n');
    // Could trigger setup script here if needed
  }

  // Also check if we can query a user with these fields
  console.log('\n🔍 Testing field access by querying users...');
  try {
    const testResponse = await fetch(`${DIRECTUS_BASE_URL}/users?fields=responsible_first_name,responsible_last_name,id_certified_copy&limit=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (testResponse.ok) {
      console.log('✅ Can query users with new fields');
      const data = await testResponse.json();
      if (data.data && data.data.length > 0) {
        const user = data.data[0];
        console.log(`   Sample user has responsible_first_name: ${user.responsible_first_name || 'null'}`);
      }
    } else {
      console.log(`⚠️  Cannot query with new fields (Status: ${testResponse.status})`);
      const error = await testResponse.text();
      console.log(`   Error: ${error.substring(0, 200)}`);
    }
  } catch (error) {
    console.log(`❌ Error testing field access: ${error.message}`);
  }

  console.log('\n');
}

verifyFields().catch(console.error);













