// Script to add sample images to properties
// This will help test the image functionality

const DIRECTUS_BASE_URL = 'https://pozi2.omaridigital.com';

async function addSampleImages() {
  console.log('🖼️ Adding sample images to properties...\n');

  try {
    // First, let's check what files are available in Directus
    console.log('1️⃣ Checking available files in Directus...');
    const filesResponse = await fetch(`${DIRECTUS_BASE_URL}/files`);
    
    if (filesResponse.ok) {
      const filesData = await filesResponse.json();
      console.log(`✅ Found ${filesData.data?.length || 0} files in Directus`);
      
      if (filesData.data && filesData.data.length > 0) {
        console.log('\n📋 Available Files:');
        filesData.data.slice(0, 5).forEach(file => {
          console.log(`  - ID: ${file.id}, Filename: ${file.filename_disk}, Title: ${file.title || 'No title'}`);
        });
      }
    } else {
      console.log('❌ Could not access files collection');
    }

    // Check current property photos
    console.log('\n2️⃣ Checking current property photos...');
    const propertiesResponse = await fetch(`${DIRECTUS_BASE_URL}/items/properties`);
    const propertiesData = await propertiesResponse.json();
    
    propertiesData.data.forEach(property => {
      console.log(`\nProperty ${property.id} (${property.title}):`);
      console.log(`  Photos: ${JSON.stringify(property.photos)}`);
    });

    console.log('\n💡 To add images to properties:');
    console.log('1. Go to Directus Admin Panel');
    console.log('2. Navigate to Content → Properties');
    console.log('3. Edit each property');
    console.log('4. Upload images to the "photos" field');
    console.log('5. The photos field should be configured as a "Files" field');

  } catch (error) {
    console.error('❌ Error checking images:', error);
  }
}

// Run the check
addSampleImages();

