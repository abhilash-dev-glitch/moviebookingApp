#!/usr/bin/env node

require('dotenv').config();
const { initializeSMSService, sendSMS } = require('./services/sms.service');
const { getTargetPhone, validateNotificationConfig } = require('./utils/notificationHelper');

/**
 * Test SMS Service
 * Run: node test-sms.js
 */

async function testSMS() {
  console.log('📱 Testing SMS Service\n');

  // Initialize SMS service
  console.log('1️⃣  Initializing SMS service...');
  initializeSMSService();

  // Check configuration
  console.log('\n2️⃣  Checking configuration...');
  const config = validateNotificationConfig();
  console.log('Configuration:', JSON.stringify(config, null, 2));

  if (!config.sms.configured) {
    console.error('\n❌ SMS service not configured properly');
    console.log('\nPlease check:');
    console.log('- TWILIO_ACCOUNT_SID is set');
    console.log('- TWILIO_AUTH_TOKEN is set');
    console.log('- TWILIO_PHONE_NUMBER is set (not placeholder)');
    process.exit(1);
  }

  // Test phone numbers
  const testNumbers = [
    '+916282204782', // Valid number
    '6282204782', // Valid without country code
    '123', // Invalid
    'invalid', // Invalid
  ];

  console.log('\n3️⃣  Testing phone number validation...\n');
  testNumbers.forEach(phone => {
    const target = getTargetPhone(phone, false);
    console.log(`${phone.padEnd(20)} → ${target}`);
  });

  // Send test SMS
  console.log('\n4️⃣  Sending test SMS...\n');
  
  const testPhone = process.env.FALLBACK_PHONE || '+916282204782';
  const testMessage = 'Hello from CineGo! This is a test SMS from your movie booking system. 🎬';

  console.log(`Sending to: ${testPhone}`);
  console.log(`Message: ${testMessage}\n`);

  const result = await sendSMS(testPhone, testMessage);

  if (result.success) {
    console.log('✅ SMS sent successfully!');
    console.log(`Message SID: ${result.sid}`);
    console.log(`Sent to: ${result.to}`);
  } else {
    console.log('❌ Failed to send SMS');
    console.log(`Error: ${result.error}`);
  }

  console.log('\n✅ SMS test completed!');
}

// Run tests
testSMS().catch(error => {
  console.error('\n❌ Test failed:', error.message);
  process.exit(1);
});
