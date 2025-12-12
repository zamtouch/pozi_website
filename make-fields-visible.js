/**
 * Ensure all student registration fields are visible in Directus admin UI
 * This script updates field metadata to ensure they appear in the admin panel
 */

require('dotenv').config({ path: '.env.local' });

const DIRECTUS_BASE_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || process.env.DIRECTUS_URL || 'https://app.pozi.com.na';
const API_TOKEN = process.env.DIRECTUS_TOKEN || process.env.DIRECTUS_ADMIN_TOKEN || '';

const fields = [
  { name: 'responsible_first_name', label: 'Responsible First Name', interface: 'input' },
  { name: 'responsible_last_name', label: 'Responsible Last Name', interface: 'input' },
  { name: 'responsible_relationship', label: 'Relationship to Tenant', interface: 'input' },
  { name: 'responsible_email', label: 'Responsible Email', interface: 'input' },
  { name: 'responsible_id_number', label: 'Responsible ID Number', interface: 'input' },
  { name: 'responsible_cell', label: 'Responsible Cell', interface: 'input' },
  { name: 'responsible_occupation', label: 'Responsible Occupation', interface: 'input' },
  { name: 'id_certified_copy', label: 'ID Certified Copy', interface: 'file-image' },
  { name: 'payslip', label: 'Payslip', interface: 'file-image' },
  { name: 'bank_statement_6months', label: '6 Months Bank Statement', interface: 'file-image' },
];

async function makeFieldsVisible() {
  console.log('🔧 Ensuring fields are visible in Directus admin UI...\n');

  if (!API_TOKEN) {
    console.error('❌ Error: DIRECTUS_TOKEN or DIRECTUS_ADMIN_TOKEN not found');
    process.exit(1);
  }

  for (const field of fields) {
    try {
      // First, get current field configuration
      const getResponse = await fetch(`${DIRECTUS_BASE_URL}/fields/directus_users/${field.name}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      if (getResponse.status === 200) {
        const fieldData = await getResponse.json();
        const currentMeta = fieldData.data?.meta || {};
        
        // Update field to ensure it's visible and properly configured
        const updatedMeta = {
          ...currentMeta,
          hidden: false,
          readonly: false,
          interface: field.interface,
          width: 'full',
          note: field.label,
          required: false,
        };

        const updateResponse = await fetch(`${DIRECTUS_BASE_URL}/fields/directus_users/${field.name}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            meta: updatedMeta,
          }),
        });

        if (updateResponse.ok) {
          console.log(`✅ ${field.name.padEnd(30)} - Updated and visible`);
        } else {
          const error = await updateResponse.text();
          console.log(`⚠️  ${field.name.padEnd(30)} - Update failed: ${error.substring(0, 100)}`);
        }
      } else {
        console.log(`❌ ${field.name.padEnd(30)} - Field not found (Status: ${getResponse.status})`);
      }
    } catch (error) {
      console.error(`❌ ${field.name.padEnd(30)} - Error: ${error.message}`);
    }
  }

  console.log('\n✅ Field visibility update complete!');
  console.log('\n📋 Next Steps:');
  console.log('   1. Go to: https://app.pozi.com.na/admin');
  console.log('   2. Navigate to: Settings → Data Model → directus_users');
  console.log('   3. You should now see all fields listed');
  console.log('   4. If still not visible, refresh the page or clear browser cache');
  console.log('\n📝 To see fields when editing users:');
  console.log('   1. Go to: Content → Users');
  console.log('   2. Click on a user to edit');
  console.log('   3. Fields should appear in the form');
  console.log('   4. If not, go to Settings → Data Model → directus_users → Layout');
  console.log('   5. Add the fields to the layout if they\'re missing\n');
}

makeFieldsVisible().catch(console.error);






















