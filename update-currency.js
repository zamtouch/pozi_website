// Script to update currency from ZMW to NAD in Directus
// Run with: node update-currency.js

const DIRECTUS_BASE_URL = 'https://app.pozi.com.na';

async function updateCurrency() {
  console.log('💰 Updating currency from ZMW to NAD...\n');

  try {
    // Get current properties
    console.log('1️⃣ Fetching current properties...');
    const response = await fetch(`${DIRECTUS_BASE_URL}/items/properties`);
    const data = await response.json();
    
    console.log(`✅ Found ${data.data?.length || 0} properties\n`);
    
    // Show current currency
    data.data.forEach(property => {
      console.log(`🏠 Property ${property.id}: ${property.title}`);
      console.log(`   Current: ${property.price_per_month} ${property.currency}`);
    });

    console.log('\n📋 MANUAL UPDATE REQUIRED:');
    console.log('Since we cannot update via API (403 Forbidden), you need to update manually:');
    console.log('');
    console.log('1. Go to Directus Admin Panel: https://app.pozi.com.na/admin');
    console.log('2. Navigate to: Content → Properties');
    console.log('3. Edit each property:');
    console.log('   - Change "currency" field from "ZMW" to "NAD"');
    console.log('   - Save the property');
    console.log('');
    console.log('4. After updating, the prices will display as:');
    data.data.forEach(property => {
      const price = parseFloat(property.price_per_month);
      console.log(`   Property ${property.id}: N$ ${price.toLocaleString()}`);
    });

    console.log('\n🎯 Expected Results After Update:');
    console.log('✅ Prices will show as "N$ 2,500" instead of "ZMW 2,500"');
    console.log('✅ Currency symbol will be N$ (Namibian Dollar)');
    console.log('✅ Locale formatting will be for Namibia (en-NA)');

  } catch (error) {
    console.error('❌ Error updating currency:', error);
  }
}

// Run the update
updateCurrency();






