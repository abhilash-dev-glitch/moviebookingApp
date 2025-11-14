#!/usr/bin/env node

require('dotenv').config();
const mailer = require('./utils/mailer');
const { validateNotificationConfig } = require('./utils/notificationHelper');

/**
 * Check Notification System Status
 * Run: node check-notification-status.js
 */

async function checkStatus() {
  console.log('🔍 Checking Notification System Status\n');

  // 1. Check environment variables
  console.log('1️⃣  Environment Variables:');
  console.log('   EMAIL_USER:', process.env.EMAIL_USER ? '✅ Set' : '❌ Not set');
  console.log('   EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✅ Set' : '❌ Not set');
  console.log('   TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? '✅ Set' : '❌ Not set');
  console.log('   TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? '✅ Set' : '❌ Not set');
  console.log('   TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER || '❌ Not set');
  console.log('   FALLBACK_EMAIL:', process.env.FALLBACK_EMAIL || '❌ Not set');
  console.log('   FALLBACK_PHONE:', process.env.FALLBACK_PHONE || '❌ Not set');
  console.log('   RABBITMQ_URL:', process.env.RABBITMQ_URL ? '✅ Set' : '❌ Not set');

  // 2. Check notification configuration
  console.log('\n2️⃣  Notification Configuration:');
  const config = validateNotificationConfig();
  console.log('   Email configured:', config.email.configured ? '✅ Yes' : '❌ No');
  console.log('   Email fallback:', config.email.fallback);
  console.log('   SMS configured:', config.sms.configured ? '✅ Yes' : '❌ No');
  console.log('   SMS fallback:', config.sms.fallback);

  // 3. Initialize and check mailer
  console.log('\n3️⃣  Email Service:');
  mailer.initialize();
  const mailerStatus = mailer.getStatus();
  console.log('   Initialized:', mailerStatus.initialized ? '✅ Yes' : '❌ No');
  console.log('   Has transporter:', mailerStatus.hasTransporter ? '✅ Yes' : '❌ No');
  console.log('   Cached templates:', mailerStatus.cachedTemplates);

  // 4. Verify SMTP connection
  console.log('\n4️⃣  SMTP Connection:');
  const verifyResult = await mailer.verify();
  if (verifyResult.success) {
    console.log('   ✅ SMTP connection verified');
  } else {
    console.log('   ❌ SMTP verification failed:', verifyResult.error);
  }

  // 5. Check RabbitMQ connection
  console.log('\n5️⃣  RabbitMQ Status:');
  try {
    const { connectToRabbitMQ, getConnectionStatus } = require('./config/rabbitmq');
    await connectToRabbitMQ();
    const rabbitStatus = getConnectionStatus();
    console.log('   Connected:', rabbitStatus.connected ? '✅ Yes' : '❌ No');
    console.log('   Channel ready:', rabbitStatus.channelReady ? '✅ Yes' : '❌ No');
  } catch (error) {
    console.log('   ❌ RabbitMQ error:', error.message);
    console.log('   ⚠️  Notifications will be sent synchronously (fallback mode)');
  }

  // 6. Test email templates
  console.log('\n6️⃣  Email Templates:');
  const templates = [
    'welcome',
    'booking-confirmation',
    'payment-confirmation',
    'booking-reminder',
    'booking-cancellation',
    'profile-update'
  ];
  
  for (const template of templates) {
    try {
      await mailer.loadTemplate(template, { userName: 'Test User' });
      console.log(`   ✅ ${template}.hbs`);
    } catch (error) {
      console.log(`   ❌ ${template}.hbs - ${error.message}`);
    }
  }

  // 7. Summary
  console.log('\n📊 Summary:');
  const allGood = 
    config.email.configured &&
    mailerStatus.initialized &&
    mailerStatus.hasTransporter &&
    verifyResult.success;

  if (allGood) {
    console.log('   ✅ Notification system is ready!');
    console.log('   ✅ Emails will be sent to:', config.email.fallback, '(for mock emails)');
    if (config.sms.configured) {
      console.log('   ✅ SMS will be sent to:', config.sms.fallback, '(for invalid phones)');
    } else {
      console.log('   ⚠️  SMS not configured (update TWILIO_PHONE_NUMBER)');
    }
  } else {
    console.log('   ⚠️  Some issues detected. Check the details above.');
  }

  console.log('\n✅ Status check completed!');
  process.exit(0);
}

// Run check
checkStatus().catch(error => {
  console.error('\n❌ Status check failed:', error.message);
  console.error(error.stack);
  process.exit(1);
});
