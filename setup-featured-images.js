// Script to help set up featured images in Directus
// Run with: node setup-featured-images.js

const DIRECTUS_BASE_URL = 'https://pozi2.omaridigital.com';

async function setupFeaturedImages() {
  console.log('🖼️ Setting up featured images for properties...\n');

  try {
    // Check current properties
    console.log('1️⃣ Checking current properties...');
    const response = await fetch(`${DIRECTUS_BASE_URL}/items/properties`);
    const data = await response.json();
    
    console.log(`✅ Found ${data.data?.length || 0} properties\n`);
    
    data.data.forEach(property => {
      console.log(`🏠 Property ${property.id}: ${property.title}`);
      console.log(`   Current featured_image: ${property.featured_image || 'null'}`);
      console.log(`   Current photos: ${JSON.stringify(property.photos) || 'null'}`);
      console.log(`   Status: ${property.featured_image ? '✅ Has featured image' : '❌ No featured image'}`);
      console.log('');
    });

    // Check available files that could be used as featured images
    console.log('2️⃣ Checking available files in Directus...');
    const filesResponse = await fetch(`${DIRECTUS_BASE_URL}/files`);
    
    if (filesResponse.ok) {
      const filesData = await filesResponse.json();
      console.log(`✅ Found ${filesData.data?.length || 0} files in Directus`);
      
      if (filesData.data && filesData.data.length > 0) {
        console.log('\n📋 Available Files (first 10):');
        filesData.data.slice(0, 10).forEach((file, index) => {
          console.log(`   ${index + 1}. ID: ${file.id}, Filename: ${file.filename_disk || 'Unknown'}`);
        });
      }
    }

    console.log('\n📋 NEXT STEPS:');
    console.log('1. Go to Directus Admin Panel: https://pozi2.omaridigital.com/admin');
    console.log('2. Navigate to: Settings → Data Model → Properties collection');
    console.log('3. Add a new field:');
    console.log('   - Field Name: featured_image');
    console.log('   - Field Type: File');
    console.log('   - Allow multiple files: No');
    console.log('4. Go to: Content → Properties');
    console.log('5. Edit each property and upload a featured image');
    console.log('6. Save the properties');
    console.log('\n🎯 After setup, your properties will show real images instead of placeholders!');

  } catch (error) {
    console.error('❌ Error setting up featured images:', error);
  }
}

// Run the setup
setupFeaturedImages();

