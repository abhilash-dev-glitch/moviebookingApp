const mongoose = require('mongoose');
const { cleanupAllExpiredShows } = require('../utils/seatLockHelper');

// Load environment variables
require('dotenv').config();

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected for cleanup worker');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Cleanup function
const runCleanup = async () => {
  try {
    console.log('🧹 Starting cleanup of expired show locks...');
    const cleaned = await cleanupAllExpiredShows();
    
    if (cleaned > 0) {
      console.log(`✅ Cleanup completed: ${cleaned} locks released`);
    } else {
      console.log('✅ Cleanup completed: No expired locks found');
    }
  } catch (error) {
    console.error('❌ Cleanup error:', error);
  }
};

// Main worker function
const startCleanupWorker = async () => {
  console.log('🚀 Starting Cleanup Worker...');
  console.log('⏰ Cleanup will run every 30 minutes');
  
  await connectDB();
  
  // Run cleanup immediately on start
  await runCleanup();
  
  // Run cleanup every 30 minutes
  setInterval(async () => {
    await runCleanup();
  }, 30 * 60 * 1000); // 30 minutes
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down cleanup worker gracefully');
  mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down cleanup worker gracefully');
  mongoose.connection.close();
  process.exit(0);
});

// Start the worker
startCleanupWorker().catch((error) => {
  console.error('❌ Failed to start cleanup worker:', error);
  process.exit(1);
});
