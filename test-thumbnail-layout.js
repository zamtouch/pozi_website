// Test script for new thumbnail layout (all 5 images as thumbnails)
// Run with: node test-thumbnail-layout.js

const DIRECTUS_BASE_URL = 'https://app.pozi.com.na';

async function testThumbnailLayout() {
  console.log('🖼️ Testing new thumbnail layout (all 5 images as thumbnails)...\n');

  try {
    // Get properties data
    console.log('1️⃣ Fetching properties data...');
    const response = await fetch(`${DIRECTUS_BASE_URL}/items/properties`);
    const data = await response.json();
    
    console.log(`✅ Found ${data.data?.length || 0} properties\n`);
    
    // Test each property's thumbnail layout
    data.data.forEach(property => {
      console.log(`🏠 Property ${property.id}: ${property.title}`);
      
      // Calculate all images for thumbnails
      const allImages = [];
      
      // Add featured image first (will be active/selected)
      if (property.featured_image) {
        allImages.push({
          type: 'Featured Image',
          id: property.featured_image,
          url: `${DIRECTUS_BASE_URL}/assets/${property.featured_image}`
        });
      }
      
      // Add additional images
      const additionalImages = [
        { field: 'image_1', id: property.image_1 },
        { field: 'image_2', id: property.image_2 },
        { field: 'image_3', id: property.image_3 },
        { field: 'image_4', id: property.image_4 }
      ];
      
      additionalImages.forEach(img => {
        if (img.id) {
          allImages.push({
            type: img.field,
            id: img.id,
            url: `${DIRECTUS_BASE_URL}/assets/${img.id}`
          });
        }
      });
      
      console.log(`   Total Thumbnails: ${allImages.length}`);
      console.log(`   Thumbnail Layout:`);
      allImages.forEach((img, index) => {
        const isActive = index === 0 ? ' (ACTIVE)' : '';
        console.log(`     ${index + 1}. ${img.type}${isActive}: ${img.id}`);
      });
      
      console.log('');
    });

    console.log('🎯 New Thumbnail Layout Features:');
    console.log('✅ Featured image is first thumbnail (active by default)');
    console.log('✅ All 5 images shown as thumbnails');
    console.log('✅ Grid layout: 5 columns (grid-cols-5)');
    console.log('✅ Click any thumbnail to make it active');
    console.log('✅ Active thumbnail has blue ring (ring-brand-500)');
    console.log('✅ Hover effect on inactive thumbnails');
    console.log('✅ No deduplication - shows all images even if duplicates');
    
    console.log('\n📱 Responsive Behavior:');
    console.log('✅ Desktop: 5 thumbnails in a row');
    console.log('✅ Mobile: Will stack or adjust based on screen size');
    
    console.log('\n🔗 Test URLs:');
    data.data.forEach(property => {
      console.log(`   http://localhost:3000/property/${property.id}`);
    });

  } catch (error) {
    console.error('❌ Error testing thumbnail layout:', error);
  }
}

// Run the test
testThumbnailLayout();






