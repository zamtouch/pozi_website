const fs = require('fs');
const path = require('path');

// Directus API configuration
const DIRECTUS_BASE_URL = 'https://app.pozi.com.na';
const API_TOKEN = process.env.DIRECTUS_TOKEN || ''; // Set this as environment variable

// Read the properties JSON file
const propertiesPath = path.join(__dirname, '..', '..', '..', 'Users', 'Chitalu', 'Downloads', 'properties.json');

// Function to get authentication token if not provided
async function getAuthToken() {
  if (API_TOKEN) {
    return API_TOKEN;
  }

  console.log('🔐 No API token provided. Attempting to authenticate...');
  
  try {
    // Try to get a token using admin credentials (you'll need to set these)
    const response = await fetch(`${DIRECTUS_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: process.env.DIRECTUS_EMAIL || 'admin@pozi.com',
        password: process.env.DIRECTUS_PASSWORD || 'admin123'
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Authentication successful');
      return data.data.access_token;
    } else {
      console.log('❌ Authentication failed. Please set DIRECTUS_TOKEN environment variable.');
      return null;
    }
  } catch (error) {
    console.log('❌ Authentication error:', error.message);
    return null;
  }
}

// Function to validate property data
function validateProperty(property) {
  const errors = [];
  
  // Required fields
  if (!property.title) errors.push('Missing title');
  if (!property.description) errors.push('Missing description');
  if (!property.price_per_month) errors.push('Missing price_per_month');
  if (!property.currency) errors.push('Missing currency');
  if (!property.address) errors.push('Missing address');
  if (property.rooms_available === undefined) errors.push('Missing rooms_available');
  if (property.total_rooms === undefined) errors.push('Missing total_rooms');
  if (!property.university) errors.push('Missing university');

  // Data type validations
  if (property.price_per_month && isNaN(parseFloat(property.price_per_month))) {
    errors.push('Invalid price_per_month format');
  }
  
  if (property.rooms_available !== undefined && !Number.isInteger(property.rooms_available)) {
    errors.push('rooms_available must be an integer');
  }
  
  if (property.total_rooms !== undefined && !Number.isInteger(property.total_rooms)) {
    errors.push('total_rooms must be an integer');
  }

  return errors;
}

// Function to clean and prepare property data
function prepareProperty(property) {
  const cleaned = { ...property };
  
  // Convert string numbers to actual numbers
  if (cleaned.price_per_month) {
    cleaned.price_per_month = parseFloat(cleaned.price_per_month).toFixed(5);
  }
  
  if (cleaned.distance_from_campus) {
    cleaned.distance_from_campus = parseInt(cleaned.distance_from_campus);
  }
  
  if (cleaned.latitude) {
    cleaned.latitude = parseFloat(cleaned.latitude);
  }
  
  if (cleaned.longitude) {
    cleaned.longitude = parseFloat(cleaned.longitude);
  }

  // Ensure boolean fields are properly set
  cleaned.approved = cleaned.approved ? 1 : 0;
  cleaned.featured = cleaned.featured ? 1 : 0;

  // Handle null amenities
  if (cleaned.amenities === null) {
    cleaned.amenities = [];
  }

  return cleaned;
}

async function uploadProperties() {
  try {
    // Get authentication token
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Unable to authenticate with Directus API');
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
      validationErrors: []
    };

    // Upload properties one by one
    for (let i = 0; i < propertiesData.length; i++) {
      const property = propertiesData[i];
      console.log(`\n📤 Processing property ${i + 1}/${propertiesData.length}: "${property.title}"`);

      // Validate property data
      const validationErrors = validateProperty(property);
      if (validationErrors.length > 0) {
        console.log(`❌ Validation failed: ${validationErrors.join(', ')}`);
        results.validationErrors.push({
          originalIndex: i,
          property: property,
          errors: validationErrors
        });
        continue;
      }

      // Prepare property data
      const cleanedProperty = prepareProperty(property);

      try {
        const response = await fetch(`${DIRECTUS_BASE_URL}/items/properties`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(cleanedProperty)
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
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Print summary
    console.log('\n📊 UPLOAD SUMMARY');
    console.log('================');
    console.log(`✅ Successful uploads: ${results.successful.length}`);
    console.log(`❌ Failed uploads: ${results.failed.length}`);
    console.log(`⚠️  Validation errors: ${results.validationErrors.length}`);
    console.log(`📝 Total properties: ${propertiesData.length}`);

    if (results.validationErrors.length > 0) {
      console.log('\n⚠️  VALIDATION ERRORS:');
      results.validationErrors.forEach((error, index) => {
        console.log(`${index + 1}. "${error.property.title}" - ${error.errors.join(', ')}`);
      });
    }

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
