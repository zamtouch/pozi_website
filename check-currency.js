// Check currency data from API
// Run with: node check-currency.js

const DIRECTUS_BASE_URL = 'https://app.pozi.com.na';

async function checkCurrency() {
  console.log('💰 Checking currency data from API...\n');

  try {
    // Get properties data
    const response = await fetch(`${DIRECTUS_BASE_URL}/items/properties`);
    const data = await response.json();
    
    console.log(`✅ Found ${data.data?.length || 0} properties\n`);
    
    // Check currency for each property
    data.data.forEach(property => {
      console.log(`🏠 Property ${property.id}: ${property.title}`);
      console.log(`   Price: ${property.price_per_month} ${property.currency}`);
      console.log(`   Currency: ${property.currency}`);
      console.log('');
    });

    console.log('💡 Currency Information:');
    console.log('✅ Current currency in API:', data.data[0]?.currency || 'Not found');
    console.log('✅ Should be: NAD (Namibian Dollars)');
    
    if (data.data[0]?.currency === 'ZMW') {
      console.log('⚠️  Currency needs to be updated from ZMW to NAD in Directus');
    } else if (data.data[0]?.currency === 'NAD') {
      console.log('✅ Currency is already correct (NAD)');
    } else {
      console.log('❓ Unknown currency format');
    }

  } catch (error) {
    console.error('❌ Error checking currency:', error);
  }
}

// Run the check
checkCurrency();






