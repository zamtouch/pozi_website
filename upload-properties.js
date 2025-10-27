const fs = require('fs');
const path = require('path');

// Directus API configuration
const DIRECTUS_BASE_URL = 'https://pozi2.omaridigital.com';
const API_TOKEN = process.env.DIRECTUS_TOKEN || ''; // Set this as environment variable

// Read the properties JSON file
const propertiesPath = path.join(__dirname, '..', '..', '..', 'Users', 'Chitalu', 'Downloads', 'properties.json');

async function uploadProperties() {
  try {
    // Read the properties file
    console.log('📖 Reading properties file...');
    const propertiesData = JSON.parse(fs.readFileSync(propertiesPath, 'utf8'));
    console.log(`✅ Found ${propertiesData.length} properties to upload`);

    // Track upload results
    const results = {
      successful: [],
      failed: [],
      errors: []
    };

    // Upload properties one by one
    for (let i = 0; i < propertiesData.length; i++) {
      const property = propertiesData[i];
      console.log(`\n📤 Uploading property ${i + 1}/${propertiesData.length}: "${property.title}"`);

      try {
        const response = await fetch(`${DIRECTUS_BASE_URL}/items/properties`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_TOKEN}`
          },
          body: JSON.stringify(property)
        });

        if (response.ok) {
          const result = await response.json();
          console.log(`✅ Successfully uploaded property ID: ${result.data.id}`);
          results.successful.push({
            originalIndex: i,
            property: property,
            directusId: result.data.id
          });
        } else {
          const errorData = await response.text();
          console.log(`❌ Failed to upload property: ${response.status} ${response.statusText}`);
          console.log(`Error details: ${errorData}`);
          
          results.failed.push({
            originalIndex: i,
            property: property,
            error: `${response.status} ${response.statusText}`,
            details: errorData
          });
          
          results.errors.push({
            property: property.title,
            error: errorData,
            status: response.status
          });
        }
      } catch (error) {
        console.log(`❌ Network error uploading property: ${error.message}`);
        results.failed.push({
          originalIndex: i,
          property: property,
          error: error.message
        });
        results.errors.push({
          property: property.title,
          error: error.message,
          status: 'NETWORK_ERROR'
        });
      }

      // Add a small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Print summary
    console.log('\n📊 UPLOAD SUMMARY');
    console.log('================');
    console.log(`✅ Successful uploads: ${results.successful.length}`);
    console.log(`❌ Failed uploads: ${results.failed.length}`);
    console.log(`📝 Total properties: ${propertiesData.length}`);

    if (results.failed.length > 0) {
      console.log('\n❌ FAILED UPLOADS:');
      results.failed.forEach((failure, index) => {
        console.log(`${index + 1}. "${failure.property.title}" - ${failure.error}`);
      });
    }

    if (results.errors.length > 0) {
      console.log('\n🔍 ERROR DETAILS:');
      results.errors.forEach((error, index) => {
        console.log(`${index + 1}. "${error.property}" (Status: ${error.status})`);
        console.log(`   Error: ${error.error}`);
        console.log('');
      });
    }

    // Save detailed results to file
    const resultsPath = path.join(__dirname, 'upload-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log(`\n💾 Detailed results saved to: ${resultsPath}`);

    return results;

  } catch (error) {
    console.error('❌ Script error:', error);
    throw error;
  }
}

// Run the upload
if (require.main === module) {
  uploadProperties()
    .then(() => {
      console.log('\n🎉 Upload process completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Upload process failed:', error);
      process.exit(1);
    });
}

module.exports = { uploadProperties };
