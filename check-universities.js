// Script to check universities in Directus
// Run with: node check-universities.js

const DIRECTUS_BASE_URL = 'https://app.pozi.com.na';

async function checkUniversities() {
  console.log('🏫 Checking universities in Directus...\n');

  try {
    // Check if universities collection exists
    console.log('1️⃣ Checking universities collection...');
    const universitiesResponse = await fetch(`${DIRECTUS_BASE_URL}/items/universities`);
    
    if (universitiesResponse.ok) {
      const universitiesData = await universitiesResponse.json();
      console.log(`✅ Found ${universitiesData.data?.length || 0} universities`);
      
      if (universitiesData.data && universitiesData.data.length > 0) {
        console.log('\n📋 Available Universities:');
        universitiesData.data.forEach(uni => {
          console.log(`  - ID: ${uni.id}, Name: ${uni.name || 'No name'}, Slug: ${uni.slug || 'No slug'}`);
        });
      }
    } else {
      console.log('❌ Universities collection not found or not accessible');
    }

    // Check current properties and their university relationships
    console.log('\n2️⃣ Checking property university relationships...');
    const propertiesResponse = await fetch(`${DIRECTUS_BASE_URL}/items/properties`);
    const propertiesData = await propertiesResponse.json();
    
    propertiesData.data.forEach(property => {
      console.log(`\nProperty ${property.id} (${property.title}):`);
      console.log(`  University: ${property.university || 'null'}`);
      console.log(`  Address: ${property.address}`);
    });

    // Suggest university data based on addresses
    console.log('\n3️⃣ Suggested university mappings:');
    propertiesData.data.forEach(property => {
      if (property.address) {
        let suggestedUniversity = '';
        if (property.address.includes('Lusaka') || property.address.includes('UNZA')) {
          suggestedUniversity = 'University of Zambia';
        } else if (property.address.includes('Kitwe') || property.address.includes('CBU')) {
          suggestedUniversity = 'Copperbelt University';
        } else if (property.address.includes('Kabwe') || property.address.includes('Mulungushi')) {
          suggestedUniversity = 'Mulungushi University';
        } else if (property.address.includes('Windhoek') || property.address.includes('UNAM')) {
          suggestedUniversity = 'University of Namibia';
        }
        
        if (suggestedUniversity) {
          console.log(`  Property ${property.id}: Should be linked to "${suggestedUniversity}"`);
        }
      }
    });

  } catch (error) {
    console.error('❌ Error checking universities:', error);
  }
}

// Run the check
checkUniversities();






