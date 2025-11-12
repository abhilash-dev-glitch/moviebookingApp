require('dotenv').config();
const mailer = require('./utils/mailer');

/**
 * Test Mailer Utility
 * Run: node test-mailer.js
 */

async function testMailer() {
  console.log('🧪 Testing Mailer Utility\n');

  // Initialize mailer
  console.log('1️⃣  Initializing mailer...');
  mailer.initialize();

  // Check status
  console.log('\n2️⃣  Checking mailer status...');
  const status = mailer.getStatus();
  console.log('Status:', JSON.stringify(status, null, 2));

  if (!status.initialized) {
    console.error('❌ Mailer not initialized. Check your .env configuration.');
    process.exit(1);
  }

  // Verify SMTP connection
  console.log('\n3️⃣  Verifying SMTP connection...');
  const verifyResult = await mailer.verify();
  if (verifyResult.success) {
    console.log('✅ SMTP connection verified');
  } else {
    console.error('❌ SMTP verification failed:', verifyResult.error);
    process.exit(1);
  }

  // Get test email from environment or use default
  const testEmail = process.env.TEST_EMAIL || process.env.EMAIL_USER;

  if (!testEmail) {
    console.error('❌ No test email configured. Set TEST_EMAIL in .env');
    process.exit(1);
  }

  console.log(`\n📧 Sending test emails to: ${testEmail}\n`);

  // Test 1: Simple HTML email
  console.log('4️⃣  Test 1: Simple HTML Email');
  const test1 = await mailer.send({
    to: testEmail,
    subject: 'Test Email - Simple HTML',
    html: '<h1>Hello from Mailer Utility!</h1><p>This is a test email with HTML content.</p>',
  });
  console.log(test1.success ? '✅ Sent' : `❌ Failed: ${test1.error}`);

  // Test 2: Plain text email
  console.log('\n5️⃣  Test 2: Plain Text Email');
  const test2 = await mailer.send({
    to: testEmail,
    subject: 'Test Email - Plain Text',
    text: 'This is a plain text email without HTML formatting.',
  });
  console.log(test2.success ? '✅ Sent' : `❌ Failed: ${test2.error}`);

  // Test 3: Email with template
  console.log('\n6️⃣  Test 3: Email with Template (Welcome)');
  const test3 = await mailer.sendWithTemplate(
    testEmail,
    'Test Email - Welcome Template',
    'welcome',
    {
      userName: 'Test User',
      email: testEmail,
    }
  );
  console.log(test3.success ? '✅ Sent' : `❌ Failed: ${test3.error}`);

  // Test 4: Email with CC
  console.log('\n7️⃣  Test 4: Email with CC');
  const test4 = await mailer.send({
    to: testEmail,
    cc: testEmail, // CC to same email for testing
    subject: 'Test Email - With CC',
    html: '<p>This email has a CC recipient.</p>',
  });
  console.log(test4.success ? '✅ Sent' : `❌ Failed: ${test4.error}`);

  // Test 5: High priority email
  console.log('\n8️⃣  Test 5: High Priority Email');
  const test5 = await mailer.send({
    to: testEmail,
    subject: 'Test Email - High Priority',
    html: '<h2>⚠️ URGENT</h2><p>This is a high priority email.</p>',
    priority: 'high',
  });
  console.log(test5.success ? '✅ Sent' : `❌ Failed: ${test5.error}`);

  // Test 6: Email with custom from
  console.log('\n9️⃣  Test 6: Email with Custom From');
  const test6 = await mailer.send({
    from: 'Test Sender <test@example.com>',
    to: testEmail,
    subject: 'Test Email - Custom From',
    html: '<p>This email has a custom from address.</p>',
  });
  console.log(test6.success ? '✅ Sent' : `❌ Failed: ${test6.error}`);

  // Test 7: Bulk emails (2 recipients)
  console.log('\n🔟 Test 7: Bulk Emails');
  const bulkRecipients = [
    {
      email: testEmail,
      data: { userName: 'Recipient 1', code: 'ABC123' },
    },
    {
      email: testEmail,
      data: { userName: 'Recipient 2', code: 'XYZ789' },
    },
  ];

  const test7 = await mailer.sendBulk(
    bulkRecipients,
    'Test Email - Bulk Send',
    'welcome',
    { companyName: 'Movie Booking System' }
  );

  test7.forEach((result, index) => {
    console.log(
      `  ${result.success ? '✅' : '❌'} Recipient ${index + 1}: ${
        result.success ? 'Sent' : result.error
      }`
    );
  });

  // Test 8: Template caching
  console.log('\n1️⃣1️⃣  Test 8: Template Caching');
  console.log('Sending 3 emails with same template to test caching...');
  for (let i = 1; i <= 3; i++) {
    const start = Date.now();
    await mailer.sendWithTemplate(
      testEmail,
      `Test Email - Template Cache ${i}`,
      'welcome',
      { userName: `User ${i}`, email: testEmail }
    );
    const duration = Date.now() - start;
    console.log(`  Email ${i}: ${duration}ms`);
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('✅ All tests completed!');
  console.log('='.repeat(50));
  console.log(`\n📬 Check your inbox: ${testEmail}`);
  console.log('\nMailer Status:');
  console.log(JSON.stringify(mailer.getStatus(), null, 2));

  process.exit(0);
}

// Run tests
testMailer().catch((error) => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});
