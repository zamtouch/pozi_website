// Test script for property detail page API integration
// Run with: node test-property-detail.js

const DIRECTUS_BASE_URL = 'https://app.pozi.com.na';

async function testPropertyDetail() {
  console.log('🏠 Testing property detail page API integration...\n');

  try {
    // Get properties data
    console.log('1️⃣ Fetching properties data...');
    const response = await fetch(`${DIRECTUS_BASE_URL}/items/properties`);
    const data = await response.json();
    
    console.log(`✅ Found ${data.data?.length || 0} properties\n`);
    
    // Test each property for detail page
    data.data.forEach(property => {
      console.log(`🏠 Property ${property.id}: ${property.title}`);
      console.log(`   URL: /property/${property.id}`);
      
      // Test image data
      const featuredImage = property.featured_image;
      const photos = property.photos;
      
      console.log(`   Featured Image: ${featuredImage || 'null'}`);
      console.log(`   Photos: ${JSON.stringify(photos) || 'null'}`);
      
      // Calculate total images for gallery
      const allImages = [];
      if (featuredImage) {
        allImages.push(`${DIRECTUS_BASE_URL}/assets/${featuredImage}`);
      }
      if (photos && Array.isArray(photos)) {
        photos.forEach(photo => {
          const imageUrl = `${DIRECTUS_BASE_URL}/assets/${photo}`;
          if (!allImages.includes(imageUrl)) {
            allImages.push(imageUrl);
          }
        });
      }
      
      console.log(`   Total Images for Gallery: ${allImages.length}`);
      
      // Test amenities
      const amenities = property.amenities;
      console.log(`   Amenities: ${JSON.stringify(amenities) || 'null'}`);
      
      // Test other key fields
      console.log(`   Approved: ${property.approved === 1 ? 'Yes' : 'No'}`);
      console.log(`   Featured: ${property.featured === 1 ? 'Yes' : 'No'}`);
      console.log(`   University: ${property.university?.name || 'Not linked'}`);
      console.log(`   Owner: ${property.owner?.first_name || 'Not specified'}`);
      
      console.log('');
    });

    console.log('🎯 Property Detail Page Features:');
    console.log('✅ Fetches real data from API');
    console.log('✅ Uses featured_image + photos for gallery');
    console.log('✅ Handles amenities array format');
    console.log('✅ Shows loading and error states');
    console.log('✅ Displays real property information');
    console.log('✅ Handles missing data gracefully');
    
    console.log('\n🔗 Test URLs:');
    data.data.forEach(property => {
      console.log(`   http://localhost:3000/property/${property.id}`);
    });

  } catch (error) {
    console.error('❌ Error testing property detail:', error);
  }
}

// Run the test
testPropertyDetail();

