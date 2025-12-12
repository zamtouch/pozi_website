/**
 * Update team photo in Directus team collection
 * Usage: node update-team-photo.js
 */

require('dotenv').config({ path: '.env.local' });

const DIRECTUS_BASE_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || process.env.DIRECTUS_URL || 'https://app.pozi.com.na';
const API_TOKEN = process.env.DIRECTUS_TOKEN || process.env.DIRECTUS_ADMIN_TOKEN || '';

const TEAM_PHOTO_UUID = '7b167a4a-1aad-44a0-9330-5592c7b5baac';

async function updateTeamPhoto() {
  console.log('🖼️  Updating team photo in Directus...\n');

  if (!API_TOKEN) {
    console.error('❌ Error: DIRECTUS_TOKEN or DIRECTUS_ADMIN_TOKEN not found in .env.local');
    process.exit(1);
  }

  if (!TEAM_PHOTO_UUID) {
    console.error('❌ Error: Team photo UUID not provided');
    process.exit(1);
  }

  try {
    // First, check if the file exists in Directus
    console.log('📋 Checking if file exists in Directus...');
    const fileCheckResponse = await fetch(`${DIRECTUS_BASE_URL}/files/${TEAM_PHOTO_UUID}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (fileCheckResponse.status !== 200) {
      console.error(`❌ File with UUID ${TEAM_PHOTO_UUID} not found in Directus`);
      const errorData = await fileCheckResponse.text();
      console.error('Error:', errorData);
      process.exit(1);
    }

    const fileData = await fileCheckResponse.json();
    console.log(`✅ File found: ${fileData.data?.filename || 'Unknown filename'}\n`);

    // Check if team collection has a team_photo field or if we need to use image field
    // First, let's try to get all team items to see the structure
    console.log('📋 Fetching team items...');
    const teamResponse = await fetch(`${DIRECTUS_BASE_URL}/items/team?limit=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (teamResponse.status !== 200) {
      console.error('❌ Failed to fetch team items');
      const errorData = await teamResponse.text();
      console.error('Error:', errorData);
      process.exit(1);
    }

    const teamData = await teamResponse.json();
    console.log('✅ Team collection accessible\n');

    // Check what fields exist in the team collection
    console.log('📋 Checking team collection fields...');
    const fieldsResponse = await fetch(`${DIRECTUS_BASE_URL}/fields/team`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (fieldsResponse.status === 200) {
      const fieldsData = await fieldsResponse.json();
      const fieldNames = fieldsData.data?.map(f => f.field) || [];
      console.log('Available fields:', fieldNames.join(', '));
      
      // Try to update team_photo field first, if it exists
      const hasTeamPhotoField = fieldNames.includes('team_photo');
      const hasPhotoField = fieldNames.includes('photo');
      
      if (hasTeamPhotoField) {
        console.log('\n📝 Updating team_photo field...');
        await updateTeamField('team_photo');
      } else if (hasPhotoField) {
        console.log('\n📝 Updating photo field...');
        await updateTeamField('photo');
      } else {
        console.log('\n⚠️  No team_photo or photo field found. Creating team_photo field...');
        // Try to create the field first
        await createTeamPhotoField();
        await updateTeamField('team_photo');
      }
    } else {
      console.log('⚠️  Could not fetch fields. Attempting to update team_photo field directly...');
      await updateTeamField('team_photo');
    }

  } catch (error) {
    console.error('❌ Error updating team photo:', error.message);
    process.exit(1);
  }
}

async function createTeamPhotoField() {
  try {
    // Create team_photo field in team collection
    const createFieldResponse = await fetch(`${DIRECTUS_BASE_URL}/fields/team`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        field: 'team_photo',
        type: 'uuid',
        schema: {
          name: 'team_photo',
          table: 'team',
        },
        meta: {
          interface: 'file-image',
          special: ['file'],
          width: 'full',
        },
      }),
    });

    if (createFieldResponse.ok) {
      console.log('✅ Created team_photo field');
    } else {
      const error = await createFieldResponse.text();
      console.log('⚠️  Could not create field (may already exist):', error.substring(0, 200));
    }
  } catch (error) {
    console.log('⚠️  Error creating field:', error.message);
  }
}

async function updateTeamField(fieldName) {
  try {
    // First, get all team items
    const teamResponse = await fetch(`${DIRECTUS_BASE_URL}/items/team`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (teamResponse.status !== 200) {
      throw new Error('Failed to fetch team items');
    }

    const teamData = await teamResponse.json();
    const teamItems = teamData.data || [];

    if (teamItems.length === 0) {
      console.log('⚠️  No team items found. Creating a default team item...');
      // Create a default team item with the photo
      const createResponse = await fetch(`${DIRECTUS_BASE_URL}/items/team`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [fieldName]: TEAM_PHOTO_UUID,
          status: 'published',
        }),
      });

      if (createResponse.ok) {
        console.log('✅ Created team item with photo');
      } else {
        const error = await createResponse.text();
        throw new Error(`Failed to create team item: ${error}`);
      }
    } else {
      // Update the first team item (or you might want to update all)
      // For now, let's update the first published item
      const publishedItem = teamItems.find(item => item.status === 'published') || teamItems[0];
      
      if (publishedItem) {
        console.log(`📝 Updating team item ID: ${publishedItem.id}`);
        const updateResponse = await fetch(`${DIRECTUS_BASE_URL}/items/team/${publishedItem.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            [fieldName]: TEAM_PHOTO_UUID,
          }),
        });

        if (updateResponse.ok) {
          console.log(`✅ Successfully updated team item ${publishedItem.id} with photo UUID: ${TEAM_PHOTO_UUID}`);
        } else {
          const error = await updateResponse.text();
          throw new Error(`Failed to update team item: ${error}`);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error updating team field:', error.message);
    throw error;
  }
}

// Run the script
updateTeamPhoto()
  .then(() => {
    console.log('\n✅ Team photo update complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

