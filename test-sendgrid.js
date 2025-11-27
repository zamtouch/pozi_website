/**
 * Test SendGrid email sending to debug email issues
 */

require('dotenv').config({ path: '.env.local' });

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;
const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME;
const SENDGRID_TEMPLATE_ID = process.env.SENDGRID_TEMPLATE_ID;

async function testSendGrid() {
  console.log('🔍 Testing SendGrid Configuration...\n');
  console.log('='.repeat(80));

  // Check configuration
  console.log('\n📋 Configuration Check:\n');
  console.log(`SENDGRID_API_KEY: ${SENDGRID_API_KEY ? SENDGRID_API_KEY.substring(0, 10) + '...' + SENDGRID_API_KEY.substring(SENDGRID_API_KEY.length - 5) : '❌ MISSING'}`);
  console.log(`SENDGRID_FROM_EMAIL: ${SENDGRID_FROM_EMAIL || '❌ MISSING'}`);
  console.log(`SENDGRID_FROM_NAME: ${SENDGRID_FROM_NAME || '❌ MISSING'}`);
  console.log(`SENDGRID_TEMPLATE_ID: ${SENDGRID_TEMPLATE_ID || '❌ MISSING'}`);

  if (!SENDGRID_API_KEY) {
    console.log('\n❌ ERROR: SENDGRID_API_KEY is missing from .env.local');
    console.log('   Please add your SendGrid API key to .env.local');
    process.exit(1);
  }

  if (!SENDGRID_TEMPLATE_ID) {
    console.log('\n❌ ERROR: SENDGRID_TEMPLATE_ID is missing from .env.local');
    console.log('   Please add your SendGrid template ID to .env.local');
    process.exit(1);
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n📧 Testing Email Send...\n');

  // Test sending an email
  const testEmail = process.argv[2] || 'test@example.com';
  const testLink = 'http://localhost:3000/auth/verify?t=test_token_12345';

  const payload = {
    personalizations: [{
      to: [{ email: testEmail }],
      dynamic_template_data: {
        first_name: 'Test',
        link: testLink,
      },
    }],
    from: {
      email: SENDGRID_FROM_EMAIL,
      name: SENDGRID_FROM_NAME || SENDGRID_FROM_EMAIL,
    },
    reply_to: {
      email: SENDGRID_FROM_EMAIL,
      name: SENDGRID_FROM_NAME || SENDGRID_FROM_EMAIL,
    },
    template_id: SENDGRID_TEMPLATE_ID,
    tracking_settings: {
      click_tracking: { enable: false, enable_text: false },
      open_tracking: { enable: true },
    },
    categories: ['auth', 'verification'],
    custom_args: { app: 'auth-api', type: 'verify' },
  };

  try {
    console.log(`Sending test email to: ${testEmail}`);
    console.log(`Using template: ${SENDGRID_TEMPLATE_ID}`);
    console.log(`From: ${SENDGRID_FROM_EMAIL} (${SENDGRID_FROM_NAME})\n`);

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const messageId = response.headers.get('x-message-id') || undefined;

    if (response.status >= 200 && response.status < 300) {
      console.log('✅ Email sent successfully!');
      console.log(`   Message ID: ${messageId || 'N/A'}`);
      console.log(`   Status: ${response.status}`);
      console.log(`\n📬 Check ${testEmail} for the test email.\n`);
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.log(`❌ Email send failed!`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Status Text: ${response.statusText}\n`);

      if (errorData.errors && Array.isArray(errorData.errors)) {
        console.log('📋 Error Details:\n');
        errorData.errors.forEach((error, index) => {
          console.log(`   Error ${index + 1}:`);
          console.log(`   - Message: ${error.message || 'Unknown error'}`);
          if (error.field) console.log(`   - Field: ${error.field}`);
          if (error.help) console.log(`   - Help: ${error.help}`);
          console.log('');
        });
      } else {
        console.log('📋 Error Response:');
        console.log(JSON.stringify(errorData, null, 2));
      }

      // Common error solutions
      console.log('\n' + '='.repeat(80));
      console.log('\n💡 Common Solutions:\n');
      
      if (response.status === 401) {
        console.log('❌ Authentication failed - Invalid API Key');
        console.log('   - Verify your SENDGRID_API_KEY is correct');
        console.log('   - Check that the API key has "Mail Send" permissions');
        console.log('   - Generate a new API key if needed\n');
      }
      
      if (response.status === 403) {
        console.log('❌ Permission denied');
        console.log('   - Check that your SendGrid account has sending permissions');
        console.log('   - Verify your account is not in trial mode restrictions');
        console.log('   - Check if your account needs verification\n');
      }
      
      if (response.status === 400) {
        console.log('❌ Bad Request');
        console.log('   - Verify SENDGRID_TEMPLATE_ID is correct');
        console.log('   - Check that the template exists in your SendGrid account');
        console.log('   - Ensure template has required variables: {{first_name}}, {{link}}');
        console.log('   - Verify SENDGRID_FROM_EMAIL is verified in SendGrid\n');
      }

      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Network Error:', error.message);
    console.log('\n💡 Check your internet connection and try again.\n');
    process.exit(1);
  }
}

testSendGrid();

