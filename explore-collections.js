/**
 * Explore Directus collections to understand the data structure
 */

require('dotenv').config({ path: '.env.local' });

const DIRECTUS_BASE_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || process.env.DIRECTUS_URL || 'https://app.pozi.com.na';
const API_TOKEN = process.env.DIRECTUS_TOKEN || process.env.DIRECTUS_ADMIN_TOKEN || '';

async function exploreCollections() {
  console.log('🔍 Exploring Directus collections...\n');

  if (!API_TOKEN) {
    console.error('❌ Error: DIRECTUS_TOKEN not found in .env.local');
    process.exit(1);
  }

  try {
    // Get all collections
    const collectionsRes = await fetch(`${DIRECTUS_BASE_URL}/collections`, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    const collectionsData = await collectionsRes.json();
    const collections = collectionsData.data || [];

    console.log('📋 Available Collections:');
    collections
      .filter(c => !c.collection.startsWith('directus_'))
      .forEach(c => {
        console.log(`  - ${c.collection} (${c.meta?.display_template || 'no template'})`);
      });

    // Get properties collection fields
    console.log('\n🏠 Properties Collection Fields:\n');
    const propertiesFieldsRes = await fetch(`${DIRECTUS_BASE_URL}/fields/properties`, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (propertiesFieldsRes.ok) {
      const fieldsData = await propertiesFieldsRes.json();
      const fields = fieldsData.data || [];

      fields.forEach(field => {
        console.log(`  ${field.field}:`);
        console.log(`    Type: ${field.type}`);
        if (field.schema) {
          console.log(`    Schema: ${JSON.stringify(field.schema, null, 6).replace(/\n/g, '\n    ')}`);
        }
        if (field.meta?.special) {
          console.log(`    Special: ${field.meta.special.join(', ')}`);
        }
        console.log('');
      });
    } else {
      console.log('⚠️  Could not fetch properties fields');
    }

    // Get a sample property
    console.log('\n📄 Sample Property Data:\n');
    const sampleRes = await fetch(`${DIRECTUS_BASE_URL}/items/properties?limit=1&fields=*.*`, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (sampleRes.ok) {
      const sampleData = await sampleRes.json();
      if (sampleData.data && sampleData.data.length > 0) {
        console.log(JSON.stringify(sampleData.data[0], null, 2));
      } else {
        console.log('No properties found');
      }
    } else {
      console.log('⚠️  Could not fetch sample property');
    }

    // Check if there's a user/owner relationship
    console.log('\n👤 Checking user relationships...\n');
    const usersFieldsRes = await fetch(`${DIRECTUS_BASE_URL}/fields/directus_users`, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (usersFieldsRes.ok) {
      const userFields = await usersFieldsRes.json();
      const fields = userFields.data || [];
      const propertyRelated = fields.filter(f => 
        f.field.includes('property') || 
        f.meta?.special?.includes('m2m') ||
        f.meta?.special?.includes('o2m')
      );
      
      if (propertyRelated.length > 0) {
        console.log('User fields related to properties:');
        propertyRelated.forEach(f => {
          console.log(`  - ${f.field} (${f.type})`);
        });
      } else {
        console.log('No direct user-property relationship found in users collection');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

exploreCollections();

