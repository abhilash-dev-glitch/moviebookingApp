#!/usr/bin/env node

require('dotenv').config();

console.log('🔍 Testing Environment Variables\n');

console.log('EMAIL Configuration:');
console.log('  EMAIL_USER:', process.env.EMAIL_USER || '❌ NOT SET');
console.log('  EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✅ SET (hidden)' : '❌ NOT SET');
console.log('  EMAIL_FROM:', process.env.EMAIL_FROM || '❌ NOT SET');
console.log('  FALLBACK_EMAIL:', process.env.FALLBACK_EMAIL || '❌ NOT SET');

console.log('\nTWILIO Configuration:');
console.log('  TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? '✅ SET (hidden)' : '❌ NOT SET');
console.log('  TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? '✅ SET (hidden)' : '❌ NOT SET');
console.log('  TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER || '❌ NOT SET');
console.log('  FALLBACK_PHONE:', process.env.FALLBACK_PHONE || '❌ NOT SET');

console.log('\nRabbitMQ Configuration:');
console.log('  RABBITMQ_URL:', process.env.RABBITMQ_URL ? '✅ SET (hidden)' : '❌ NOT SET');

console.log('\n✅ Environment test completed!');
