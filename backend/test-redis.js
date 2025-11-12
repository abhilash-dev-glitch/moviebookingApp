const Redis = require('ioredis');
require('dotenv').config();

console.log('Testing Redis connection...');
console.log('REDIS_URL:', process.env.REDIS_URL ? '✓ Set' : '✗ Not set');

if (!process.env.REDIS_URL) {
  console.error('❌ REDIS_URL is not set in .env file');
  process.exit(1);
}

// Parse the URL to show details (without showing password)
try {
  const url = new URL(process.env.REDIS_URL);
  console.log('\nConnection Details:');
  console.log('  Protocol:', url.protocol);
  console.log('  Host:', url.hostname);
  console.log('  Port:', url.port);
  console.log('  Username:', url.username);
  console.log('  Password:', url.password ? '***' + url.password.slice(-4) : 'Not set');
} catch (err) {
  console.error('❌ Invalid REDIS_URL format:', err.message);
  process.exit(1);
}

console.log('\nAttempting connection...\n');

const redis = new Redis(process.env.REDIS_URL, {
  connectTimeout: 10000,
  retryStrategy: (times) => {
    if (times > 3) {
      console.error('❌ Failed after 3 attempts');
      return null;
    }
    console.log(`⏳ Retry attempt ${times}/3...`);
    return Math.min(times * 1000, 3000);
  },
});

redis.on('connect', () => {
  console.log('✅ Connected to Redis');
});

redis.on('ready', async () => {
  console.log('✅ Redis is ready');
  
  try {
    // Test basic operations
    console.log('\nTesting basic operations...');
    
    await redis.set('test_key', 'Hello Redis Cloud!');
    console.log('✓ SET operation successful');
    
    const value = await redis.get('test_key');
    console.log('✓ GET operation successful:', value);
    
    await redis.del('test_key');
    console.log('✓ DEL operation successful');
    
    console.log('\n🎉 All tests passed! Redis Cloud is working correctly.\n');
    
    redis.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    redis.disconnect();
    process.exit(1);
  }
});

redis.on('error', (err) => {
  console.error('❌ Redis error:', err.message);
  
  if (err.message.includes('ENOTFOUND')) {
    console.error('\n💡 Troubleshooting:');
    console.error('   - Check if the hostname is correct');
    console.error('   - Verify your internet connection');
    console.error('   - Check if Redis Cloud instance is active');
  } else if (err.message.includes('ECONNREFUSED')) {
    console.error('\n💡 Troubleshooting:');
    console.error('   - Redis server might be down');
    console.error('   - Check the port number');
  } else if (err.message.includes('WRONGPASS') || err.message.includes('NOAUTH')) {
    console.error('\n💡 Troubleshooting:');
    console.error('   - Check if the password is correct');
    console.error('   - Verify the username (should be "default")');
  } else if (err.message.includes('ETIMEDOUT')) {
    console.error('\n💡 Troubleshooting:');
    console.error('   - Connection timeout - check your internet');
    console.error('   - Firewall might be blocking the connection');
    console.error('   - Check if your IP is whitelisted in Redis Cloud');
  }
});

redis.on('close', () => {
  console.log('⚠️  Connection closed');
});

// Timeout after 15 seconds
setTimeout(() => {
  console.error('\n❌ Connection timeout after 15 seconds');
  redis.disconnect();
  process.exit(1);
}, 15000);
