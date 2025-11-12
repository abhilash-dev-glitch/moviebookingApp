// config/redis.js
const Redis = require('ioredis');
require('dotenv').config();

let redisClient = null;

const commonOptions = {
  retryStrategy: (times) => {
    if (times > 3) {
      console.warn('⚠️  Redis connection failed after 3 attempts. Running without Redis.');
      return null;
    }
    return Math.min(times * 1000, 3000);
  },
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  enableReadyCheck: true,
  connectTimeout: 10000, // 10 seconds
  commandTimeout: 5000,
};

const connectRedis = async () => {
  if (redisClient) return redisClient; // already connected

  try {
    if (process.env.REDIS_URL) {
      console.log('🔗 Connecting to Redis Cloud...');
      console.log('Using URL:', process.env.REDIS_URL); // debug
      redisClient = new Redis(process.env.REDIS_URL, commonOptions);
    } else {
      console.log('🔗 Connecting to Local Redis...');
      redisClient = new Redis({
        ...commonOptions,
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
      });
    }

    redisClient.on('connect', () => {
      console.log('✅ Redis connected successfully');
      console.log(`📍 Connected to: ${process.env.REDIS_URL ? 'Redis Cloud' : 'Local Redis'}`);
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis is ready to accept commands');
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis error:', err.message);
      if (err.message.includes('WRONGPASS')) {
        console.error('   ❌ Authentication failed. Check your REDIS_URL or password.');
      } else if (err.message.includes('ENOTFOUND')) {
        console.error('   ❌ Host not found. Check your REDIS_URL.');
      } else if (err.message.includes('ECONNREFUSED')) {
        console.error('   ❌ Connection refused. Is Redis running?');
      }
    });

    redisClient.on('close', () => {
      console.warn('⚠️  Redis connection closed');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('❌ Failed to initialize Redis:', error.message);
    console.warn('⚠️  Application will run without Redis.');
    redisClient = null;
    return null;
  }
};

const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call connectRedis() first.');
  }
  return redisClient;
};

const disconnectRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('✅ Redis disconnected');
  }
};

module.exports = {
  connectRedis,
  getRedisClient,
  disconnectRedis,
};
