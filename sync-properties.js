// Comprehensive script to sync properties with expected data
// Run with: node sync-properties.js

const DIRECTUS_BASE_URL = 'https://pozi2.omaridigital.com';

async function syncProperties() {
  console.log('🔄 Syncing properties with expected data...\n');

  try {
    // Update Property 1 (Cozy 2-bedroom flat near UNZA)
    console.log('1️⃣ Updating Property 1 (Cozy 2-bedroom flat near UNZA)...');
    const property1Update = {
      description: "Beautiful 2-bedroom apartment within walking distance of University of Zambia. Fully furnished with modern amenities including high-speed Wi-Fi, air conditioning, and secure parking. Perfect for students who want comfort and convenience.",
      approved: 1, // Set to approved so it shows on website
      university: 1, // Link to University of Zambia (ID: 1)
      // Keep existing amenities: ["wifi", "furnished", "parking", "security", "study_desk", "air_conditioning"]
    };

    const response1 = await fetch(`${DIRECTUS_BASE_URL}/items/properties/1`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(property1Update)
    });

    if (response1.ok) {
      console.log('✅ Property 1 updated successfully');
      console.log('   - Description updated');
      console.log('   - Set to approved');
      console.log('   - Linked to University of Zambia');
    } else {
      console.log('❌ Failed to update Property 1:', response1.status, response1.statusText);
    }

    // Update Property 2 (Shared accommodation near CBU)
    console.log('\n2️⃣ Updating Property 2 (Shared accommodation near CBU)...');
    const property2Update = {
      amenities: ["wifi", "furnished", "parking"], // Add some basic amenities
      university: 2, // Link to Copperbelt University (ID: 2)
    };

    const response2 = await fetch(`${DIRECTUS_BASE_URL}/items/properties/2`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(property2Update)
    });

    if (response2.ok) {
      console.log('✅ Property 2 updated successfully');
      console.log('   - Added amenities: wifi, furnished, parking');
      console.log('   - Linked to Copperbelt University');
    } else {
      console.log('❌ Failed to update Property 2:', response2.status, response2.statusText);
    }

    // Verify updates
    console.log('\n3️⃣ Verifying updates...');
    const verifyResponse = await fetch(`${DIRECTUS_BASE_URL}/items/properties`);
    const verifyData = await verifyResponse.json();
    
    console.log('\n📊 Final Properties Status:');
    verifyData.data.forEach(property => {
      console.log(`\n🏠 Property ${property.id}: ${property.title}`);
      console.log(`   ✅ Approved: ${property.approved === 1 ? 'Yes' : 'No'}`);
      console.log(`   ⭐ Featured: ${property.featured === 1 ? 'Yes' : 'No'}`);
      console.log(`   🏫 University: ${property.university || 'Not linked'}`);
      console.log(`   🎯 Amenities: ${JSON.stringify(property.amenities) || 'None'}`);
      console.log(`   📝 Description: ${property.description.substring(0, 80)}...`);
    });

    // Test the API endpoints
    console.log('\n4️⃣ Testing API endpoints...');
    
    const approvedResponse = await fetch(`${DIRECTUS_BASE_URL}/items/properties?filter[approved]=1`);
    const approvedData = await approvedResponse.json();
    console.log(`✅ Approved properties: ${approvedData.data?.length || 0}`);
    
    const featuredResponse = await fetch(`${DIRECTUS_BASE_URL}/items/properties?filter[featured]=1&filter[approved]=1`);
    const featuredData = await featuredResponse.json();
    console.log(`⭐ Featured & approved properties: ${featuredData.data?.length || 0}`);

    console.log('\n🎉 Sync completed! Your properties should now match the expected data structure.');

  } catch (error) {
    console.error('❌ Error syncing properties:', error);
  }
}

// Run the sync
syncProperties();

