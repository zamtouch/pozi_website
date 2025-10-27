const fs = require('fs');
const path = require('path');

// Directus API configuration
const DIRECTUS_BASE_URL = 'https://pozi2.omaridigital.com';
const API_TOKEN = process.env.DIRECTUS_TOKEN || ''; // Set this as environment variable
const BATCH_SIZE = 5; // Upload 5 properties at a time

// Read the properties JSON file
const propertiesPath = path.join(__dirname, '..', '..', '..', 'Users', 'Chitalu', 'Downloads', 'properties.json');

async function uploadPropertiesBatch() {
  try {
    // Get authentication token
    if (!API_TOKEN) {
      console.log('❌ Please set DIRECTUS_TOKEN environment variable');
      console.log('Example: set DIRECTUS_TOKEN=your_token_here');
      process.exit(1);
    }

    // Read the properties file
    console.log('📖 Reading properties file...');
    const propertiesData = JSON.parse(fs.readFileSync(propertiesPath, 'utf8'));
    console.log(`✅ Found ${propertiesData.length} properties to upload`);

    // Track upload results
    const results = {
      successful: [],
      failed: [],
      errors: [],
      totalProcessed: 0
    };

    // Process properties in batches
    for (let i = 0; i < propertiesData.length; i += BATCH_SIZE) {
      const batch = propertiesData.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(propertiesData.length / BATCH_SIZE);
      
      console.log(`\n📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} properties)`);

      // Process each property in the batch
      for (let j = 0; j < batch.length; j++) {
        const property = batch[j];
        const globalIndex = i + j;
        
        console.log(`  📤 Uploading property ${globalIndex + 1}/${propertiesData.length}: "${property.title}"`);

        try {
          // Clean the property data
          const cleanedProperty = {
            ...property,
            price_per_month: parseFloat(property.price_per_month).toFixed(5),
            distance_from_campus: property.distance_from_campus ? parseInt(property.distance_from_campus) : null,
            latitude: property.latitude ? parseFloat(property.latitude) : null,
            longitude: property.longitude ? parseFloat(property.longitude) : null,
            approved: property.approved ? 1 : 0,
            featured: property.featured ? 1 : 0,
            amenities: property.amenities || []
          };

          const response = await fetch(`${DIRECTUS_BASE_URL}/items/properties`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${API_TOKEN}`
            },
            body: JSON.stringify(cleanedProperty)
          });

          if (response.ok) {
            const result = await response.json();
            console.log(`    ✅ Successfully uploaded property ID: ${result.data.id}`);
            results.successful.push({
              originalIndex: globalIndex,
              property: property,
              directusId: result.data.id
            });
          } else {
            const errorData = await response.text();
            console.log(`    ❌ Failed to upload property: ${response.status} ${response.statusText}`);
            console.log(`    Error details: ${errorData}`);
            
            results.failed.push({
              originalIndex: globalIndex,
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
          console.log(`    ❌ Network error uploading property: ${error.message}`);
          results.failed.push({
            originalIndex: globalIndex,
            property: property,
            error: error.message
          });
          results.errors.push({
            property: property.title,
            error: error.message,
            status: 'NETWORK_ERROR'
          });
        }

        results.totalProcessed++;
      }

      // Add delay between batches
      if (i + BATCH_SIZE < propertiesData.length) {
        console.log(`  ⏳ Waiting 2 seconds before next batch...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Print summary
    console.log('\n📊 UPLOAD SUMMARY');
    console.log('================');
    console.log(`✅ Successful uploads: ${results.successful.length}`);
    console.log(`❌ Failed uploads: ${results.failed.length}`);
    console.log(`📝 Total processed: ${results.totalProcessed}`);
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
  uploadPropertiesBatch()
    .then(() => {
      console.log('\n🎉 Upload process completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Upload process failed:', error);
      process.exit(1);
    });
}

module.exports = { uploadPropertiesBatch };
