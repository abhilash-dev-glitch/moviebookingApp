require('dotenv').config();
const mongoose = require('mongoose');
const { connectRabbitMQ, consumeFromQueue, QUEUES } = require('../config/rabbitmq');
const { sendNotificationSync } = require('../services/notification.service');
const { initializeEmailService } = require('../services/email.service');
const { initializeSMSService } = require('../services/sms.service');

/**
 * Process notification message
 */
const processNotification = async (message) => {
  const { type, data, email, sms } = message;
  
  console.log(`🔔 Processing notification: ${type}`);
  
  try {
    const result = await sendNotificationSync(type, data, { email, sms });
    
    if (result.email) {
      console.log(`✅ Email sent: ${result.email.success ? 'Success' : 'Failed'}`);
    }
    
    if (result.sms) {
      console.log(`✅ SMS sent: ${result.sms.success ? 'Success' : 'Failed'}`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error processing notification:', error.message);
    throw error;
  }
};

/**
 * Start notification worker
 */
const startWorker = async () => {
  try {
    console.log('🚀 Starting Notification Worker...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');
    
    // Initialize services
    initializeEmailService();
    initializeSMSService();
    
    // Connect to RabbitMQ
    await connectRabbitMQ();
    
    // Start consuming from all queues
    await consumeFromQueue(QUEUES.EMAIL, processNotification);
    await consumeFromQueue(QUEUES.SMS, processNotification);
    await consumeFromQueue(QUEUES.BOOKING_CONFIRMATION, processNotification);
    await consumeFromQueue(QUEUES.BOOKING_REMINDER, processNotification);
    await consumeFromQueue(QUEUES.PAYMENT_CONFIRMATION, processNotification);
    
    console.log('✅ Notification Worker started successfully');
    console.log('📬 Listening for messages...');
  } catch (error) {
    console.error('❌ Failed to start notification worker:', error.message);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⚠️  Shutting down notification worker...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⚠️  Shutting down notification worker...');
  await mongoose.connection.close();
  process.exit(0);
});

// Start the worker
startWorker();
