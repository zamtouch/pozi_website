// Test script for property images with featured_image
// Run with: node test-property-images.js

const DIRECTUS_BASE_URL = 'https://pozi2.omaridigital.com';

async function testPropertyImages() {
  console.log('🖼️ Testing property images with featured_image...\n');

  try {
    // Get properties data
    console.log('1️⃣ Fetching properties data...');
    const response = await fetch(`${DIRECTUS_BASE_URL}/items/properties`);
    const data = await response.json();
    
    console.log(`✅ Found ${data.data?.length || 0} properties\n`);
    
    // Analyze each property's image structure
    data.data.forEach(property => {
      console.log(`🏠 Property ${property.id}: ${property.title}`);
      console.log(`   Featured Image: ${property.featured_image || 'null'}`);
      console.log(`   Photos Array: ${JSON.stringify(property.photos) || 'null'}`);
      
      // Show what the main image URL would be
      let mainImageUrl = '/placeholder-property.svg';
      if (property.featured_image) {
        mainImageUrl = `${DIRECTUS_BASE_URL}/assets/${property.featured_image}`;
      } else if (property.photos && property.photos[0]) {
        mainImageUrl = `${DIRECTUS_BASE_URL}/assets/${property.photos[0]}`;
      }
      
      console.log(`   Main Image URL: ${mainImageUrl}`);
      
      // Show all images that would be available for detail page
      const allImages = [];
      if (property.featured_image) {
        allImages.push(`${DIRECTUS_BASE_URL}/assets/${property.featured_image}`);
      }
      if (property.photos && Array.isArray(property.photos)) {
        property.photos.forEach(photo => {
          const imageUrl = `${DIRECTUS_BASE_URL}/assets/${photo}`;
          if (!allImages.includes(imageUrl)) {
            allImages.push(imageUrl);
          }
        });
      }
      
      console.log(`   All Images for Detail Page: ${allImages.length} images`);
      allImages.forEach((url, index) => {
        console.log(`     ${index + 1}. ${url}`);
      });
      
      console.log('');
    });

    console.log('💡 To add featured images to properties:');
    console.log('1. Go to Directus Admin Panel');
    console.log('2. Navigate to Content → Properties');
    console.log('3. Edit each property');
    console.log('4. Add a "featured_image" field (File type)');
    console.log('5. Upload the main property image');
    console.log('6. Optionally add more images to the "photos" field for the gallery');

  } catch (error) {
    console.error('❌ Error testing property images:', error);
  }
}

// Run the test
testPropertyImages();

