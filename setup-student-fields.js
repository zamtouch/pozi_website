/**
 * Setup script to add student registration fields to Directus users collection
 * Adds fields for "Person Responsible for Rent Details" and file attachments
 */

require('dotenv').config({ path: '.env.local' });

const DIRECTUS_BASE_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || process.env.DIRECTUS_URL || 'https://app.pozi.com.na';
const API_TOKEN = process.env.DIRECTUS_TOKEN || process.env.DIRECTUS_ADMIN_TOKEN || '';

// Fields to add for Person Responsible for Rent Details
const responsibleFields = [
  { field: 'responsible_first_name', type: 'string', label: 'Responsible First Name' },
  { field: 'responsible_last_name', type: 'string', label: 'Responsible Last Name' },
  { field: 'responsible_relationship', type: 'string', label: 'Relationship to Tenant' },
  { field: 'responsible_email', type: 'string', label: 'Responsible Email Address' },
  { field: 'responsible_id_number', type: 'string', label: 'Responsible ID Number' },
  { field: 'responsible_cell', type: 'string', label: 'Responsible Cell Number' },
  { field: 'responsible_occupation', type: 'string', label: 'Responsible Occupation' },
];

// File attachment fields
const fileFields = [
  { field: 'id_certified_copy', type: 'uuid', label: 'ID Certified Copy', interface: 'file-image' },
  { field: 'payslip', type: 'uuid', label: 'Payslip', interface: 'file-image' },
  { field: 'bank_statement_6months', type: 'uuid', label: '6 Months Bank Statement', interface: 'file-image' },
];

async function checkFieldExists(fieldName) {
  try {
    const response = await fetch(`${DIRECTUS_BASE_URL}/fields/directus_users/${fieldName}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

async function createField(fieldConfig) {
  const { field, type, label, interface = 'input' } = fieldConfig;
  
  const isFileField = type === 'uuid' && interface.includes('file');
  
  const fieldData = {
    field,
    type,
    meta: {
      interface: isFileField ? 'file-image' : 'input',
      width: 'full',
      hidden: false,
      readonly: false,
      note: label,
    },
    schema: {
      is_nullable: true,
    },
  };

  if (type === 'string') {
    fieldData.schema.max_length = 255;
  }

  try {
    const response = await fetch(`${DIRECTUS_BASE_URL}/fields/directus_users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fieldData),
    });

    if (response.status === 200 || response.status === 201) {
      return { success: true };
    } else {
      const errorText = await response.text();
      return { success: false, error: errorText };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function setupStudentFields() {
  console.log('🔧 Setting up student registration fields in Directus users table...\n');

  if (!API_TOKEN) {
    console.error('❌ Error: DIRECTUS_TOKEN or DIRECTUS_ADMIN_TOKEN not found in .env.local');
    console.error('   Please add your Directus admin token to .env.local\n');
    process.exit(1);
  }

  try {
    // Setup responsible person fields
    console.log('📝 Setting up Person Responsible for Rent fields...\n');
    for (const fieldConfig of responsibleFields) {
      const exists = await checkFieldExists(fieldConfig.field);
      if (exists) {
        console.log(`✅ Field "${fieldConfig.field}" already exists`);
      } else {
        console.log(`📝 Creating field "${fieldConfig.field}"...`);
        const result = await createField(fieldConfig);
        if (result.success) {
          console.log(`✅ Field "${fieldConfig.field}" created successfully`);
        } else {
          console.error(`❌ Failed to create field "${fieldConfig.field}":`, result.error);
        }
      }
    }

    console.log('\n📎 Setting up file attachment fields...\n');
    for (const fieldConfig of fileFields) {
      const exists = await checkFieldExists(fieldConfig.field);
      if (exists) {
        console.log(`✅ Field "${fieldConfig.field}" already exists`);
      } else {
        console.log(`📝 Creating field "${fieldConfig.field}"...`);
        const result = await createField(fieldConfig);
        if (result.success) {
          console.log(`✅ Field "${fieldConfig.field}" created successfully`);
        } else {
          console.error(`❌ Failed to create field "${fieldConfig.field}":`, result.error);
        }
      }
    }

    console.log('\n✅ Student fields setup complete!');
    console.log('\n🎉 All fields are now ready to use in the registration form.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

setupStudentFields();

