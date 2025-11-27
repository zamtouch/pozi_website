// Script to update properties in Directus to match the expected data
// Run with: node update-properties.js

const DIRECTUS_BASE_URL = 'https://app.pozi.com.na';

async function updateProperties() {
  console.log('🔄 Updating properties in Directus...\n');

  try {
    // Update Property 1
    console.log('1️⃣ Updating Property 1...');
    const property1Update = {
      description: "Beautiful 2-bedroom apartment within walking distance of University of Zambia. Fully furnished with modern amenities including high-speed Wi-Fi, air conditioning, and secure parking. Perfect for students who want comfort and convenience.",
      approved: 1, // Set to approved so it shows on website
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
    } else {
      console.log('❌ Failed to update Property 1:', response1.status, response1.statusText);
    }

    // Update Property 2
    console.log('\n2️⃣ Updating Property 2...');
    const property2Update = {
      amenities: ["wifi", "furnished"], // Add some basic amenities
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
    } else {
      console.log('❌ Failed to update Property 2:', response2.status, response2.statusText);
    }

    // Verify updates
    console.log('\n3️⃣ Verifying updates...');
    const verifyResponse = await fetch(`${DIRECTUS_BASE_URL}/items/properties`);
    const verifyData = await verifyResponse.json();
    
    console.log('\n📊 Updated Properties:');
    verifyData.data.forEach(property => {
      console.log(`\nProperty ${property.id}:`);
      console.log(`  Title: ${property.title}`);
      console.log(`  Approved: ${property.approved}`);
      console.log(`  Featured: ${property.featured}`);
      console.log(`  Amenities: ${JSON.stringify(property.amenities)}`);
      console.log(`  Description: ${property.description.substring(0, 100)}...`);
    });

  } catch (error) {
    console.error('❌ Error updating properties:', error);
  }
}

// Run the update
updateProperties();






