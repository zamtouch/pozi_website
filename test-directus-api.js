// Test script for Directus API endpoints
// Run with: node test-directus-api.js

const DIRECTUS_BASE_URL = 'https://pozi2.omaridigital.com';

async function testAPI() {
  console.log('🧪 Testing Directus API endpoints...\n');

  try {
    // Test 1: Get all properties
    console.log('1️⃣ Testing: Get all properties');
    const allPropertiesResponse = await fetch(`${DIRECTUS_BASE_URL}/items/properties`);
    const allProperties = await allPropertiesResponse.json();
    console.log(`✅ Found ${allProperties.data?.length || 0} total properties`);
    
    if (allProperties.data && allProperties.data.length > 0) {
      console.log('📋 Sample property structure:');
      console.log(JSON.stringify(allProperties.data[0], null, 2));
    }
    console.log('');

    // Test 2: Get approved properties
    console.log('2️⃣ Testing: Get approved properties');
    const approvedResponse = await fetch(`${DIRECTUS_BASE_URL}/items/properties?filter[approved]=true`);
    const approvedProperties = await approvedResponse.json();
    console.log(`✅ Found ${approvedProperties.data?.length || 0} approved properties`);
    console.log('');

    // Test 3: Get featured properties
    console.log('3️⃣ Testing: Get featured properties');
    const featuredResponse = await fetch(`${DIRECTUS_BASE_URL}/items/properties?filter[featured]=true&filter[approved]=true`);
    const featuredProperties = await featuredResponse.json();
    console.log(`✅ Found ${featuredProperties.data?.length || 0} featured properties`);
    console.log('');

    // Test 4: Test amenity filters
    console.log('4️⃣ Testing: Amenity filters');
    const amenityTests = [
      { name: 'Wi-Fi', field: 'wifi' },
      { name: 'Furnished', field: 'furnished' },
      { name: 'Parking', field: 'parking' },
      { name: 'Security', field: 'security' },
      { name: 'Air Conditioning', field: 'air_conditioning' },
      { name: 'Study Desk', field: 'study_desk' }
    ];

    for (const amenity of amenityTests) {
      try {
        const response = await fetch(`${DIRECTUS_BASE_URL}/items/properties?filter[${amenity.field}]=true`);
        const data = await response.json();
        console.log(`   ${amenity.name}: ${data.data?.length || 0} properties`);
      } catch (error) {
        console.log(`   ${amenity.name}: ❌ Error - ${error.message}`);
      }
    }
    console.log('');

    // Test 5: Test combined filters
    console.log('5️⃣ Testing: Combined filters (Wi-Fi + Furnished)');
    const combinedResponse = await fetch(`${DIRECTUS_BASE_URL}/items/properties?filter[approved]=true&filter[wifi]=true&filter[furnished]=true`);
    const combinedProperties = await combinedResponse.json();
    console.log(`✅ Found ${combinedProperties.data?.length || 0} properties with Wi-Fi and Furnished`);
    console.log('');

    // Test 6: Test gallery endpoints
    console.log('6️⃣ Testing: Gallery endpoints');
    const galleryTests = ['slider', 'home'];
    
    for (const category of galleryTests) {
      try {
        const response = await fetch(`${DIRECTUS_BASE_URL}/items/gallery?filter[category]=${category}`);
        const data = await response.json();
        console.log(`   ${category}: ${data.data?.length || 0} images`);
      } catch (error) {
        console.log(`   ${category}: ❌ Error - ${error.message}`);
      }
    }
    console.log('');

    // Summary
    console.log('📊 SUMMARY:');
    console.log(`Total Properties: ${allProperties.data?.length || 0}`);
    console.log(`Approved Properties: ${approvedProperties.data?.length || 0}`);
    console.log(`Featured Properties: ${featuredProperties.data?.length || 0}`);
    
    if (approvedProperties.data && approvedProperties.data.length > 0) {
      const sample = approvedProperties.data[0];
      console.log('\n🔍 Sample approved property amenities:');
      console.log(`   Wi-Fi: ${sample.wifi || 'undefined'}`);
      console.log(`   Furnished: ${sample.furnished || 'undefined'}`);
      console.log(`   Parking: ${sample.parking || 'undefined'}`);
      console.log(`   Security: ${sample.security || 'undefined'}`);
      console.log(`   Air Conditioning: ${sample.air_conditioning || 'undefined'}`);
      console.log(`   Study Desk: ${sample.study_desk || 'undefined'}`);
    }

  } catch (error) {
    console.error('❌ Error testing API:', error);
  }
}

// Run the test
testAPI();

