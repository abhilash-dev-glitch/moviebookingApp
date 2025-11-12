const ngrok = require('@ngrok/ngrok');

async function startNgrok() {
  try {
    // Connect to ngrok
    const listener = await ngrok.connect({
      addr: 5000, // Match your backend port
      authtoken: process.env.NGROK_AUTHTOKEN, // Use the token from .env
      region: 'us' // Optional: specify a region (us, eu, ap, au, sa, jp, in)
    });

    console.log('\n🌐 ngrok tunnel started!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📍 Public URL: ${listener.url()}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ Use this URL in Stripe webhook:');
    console.log(`   ${listener.url()}/api/v1/webhooks/stripe\n`);
    console.log('⚠️  Keep this terminal running while testing webhooks');
    console.log('⚠️  Press Ctrl+C to stop\n');

  } catch (error) {
    console.error('❌ Error starting ngrok:', error.message);
    if (error.code === 'ERR_NGROK_4018') {
      console.error('\n🔑 Please make sure:');
      console.error('1. You have a valid ngrok account');
      console.error('2. Your NGROK_AUTHTOKEN is correct in the .env file');
      console.error('3. The token is not expired\n');
      console.error('Get your authtoken from: https://dashboard.ngrok.com/get-started/your-authtoken');
    }
    process.exit(1);
  }
}

// Start ngrok
startNgrok();