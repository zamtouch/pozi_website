// Test script for new image structure (featured_image + image_1,2,3,4)
// Run with: node test-new-image-structure.js

const DIRECTUS_BASE_URL = 'https://app.pozi.com.na';

async function testNewImageStructure() {
  console.log('🖼️ Testing new image structure (featured_image + image_1,2,3,4)...\n');

  try {
    // Get properties data
    console.log('1️⃣ Fetching properties data...');
    const response = await fetch(`${DIRECTUS_BASE_URL}/items/properties`);
    const data = await response.json();
    
    console.log(`✅ Found ${data.data?.length || 0} properties\n`);
    
    // Test each property's new image structure
    data.data.forEach(property => {
      console.log(`🏠 Property ${property.id}: ${property.title}`);
      
      // Check new image fields
      console.log(`   Featured Image: ${property.featured_image || 'null'}`);
      console.log(`   Image 1: ${property.image_1 || 'null'}`);
      console.log(`   Image 2: ${property.image_2 || 'null'}`);
      console.log(`   Image 3: ${property.image_3 || 'null'}`);
      console.log(`   Image 4: ${property.image_4 || 'null'}`);
      console.log(`   Photos (legacy): ${JSON.stringify(property.photos) || 'null'}`);
      
      // Calculate total images for gallery
      const allImages = [];
      if (property.featured_image) {
        allImages.push(`${DIRECTUS_BASE_URL}/assets/${property.featured_image}`);
      }
      if (property.image_1) {
        allImages.push(`${DIRECTUS_BASE_URL}/assets/${property.image_1}`);
      }
      if (property.image_2) {
        allImages.push(`${DIRECTUS_BASE_URL}/assets/${property.image_2}`);
      }
      if (property.image_3) {
        allImages.push(`${DIRECTUS_BASE_URL}/assets/${property.image_3}`);
      }
      if (property.image_4) {
        allImages.push(`${DIRECTUS_BASE_URL}/assets/${property.image_4}`);
      }
      
      console.log(`   Total Images for Gallery: ${allImages.length}`);
      if (allImages.length > 0) {
        console.log(`   Gallery Images:`);
        allImages.forEach((url, index) => {
          console.log(`     ${index + 1}. ${url}`);
        });
      }
      
      console.log('');
    });

    console.log('🎯 New Image Structure Features:');
    console.log('✅ featured_image: Main image for property cards');
    console.log('✅ image_1: First additional image for gallery');
    console.log('✅ image_2: Second additional image for gallery');
    console.log('✅ image_3: Third additional image for gallery');
    console.log('✅ image_4: Fourth additional image for gallery');
    console.log('✅ photos: Legacy support for backward compatibility');
    
    console.log('\n📋 To add images to properties in Directus:');
    console.log('1. Go to: https://app.pozi.com.na/admin');
    console.log('2. Navigate to: Content → Properties');
    console.log('3. Edit each property');
    console.log('4. Add these fields:');
    console.log('   - featured_image (File type)');
    console.log('   - image_1 (File type)');
    console.log('   - image_2 (File type)');
    console.log('   - image_3 (File type)');
    console.log('   - image_4 (File type)');
    console.log('5. Upload images to each field');
    console.log('6. Save the properties');

  } catch (error) {
    console.error('❌ Error testing new image structure:', error);
  }
}

// Run the test
testNewImageStructure();






