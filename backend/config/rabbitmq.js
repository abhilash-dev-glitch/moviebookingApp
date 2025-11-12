const amqp = require('amqplib');

let connection = null;
let channel = null;

// Queue names
const QUEUES = {
  EMAIL: 'email_notifications',
  SMS: 'sms_notifications',
  BOOKING_CONFIRMATION: 'booking_confirmation',
  BOOKING_REMINDER: 'booking_reminder',
  PAYMENT_CONFIRMATION: 'payment_confirmation',
};

/**
 * Connect to RabbitMQ
 */
const connectRabbitMQ = async () => {
  try {
    const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost';
    
    console.log('🔗 Connecting to RabbitMQ...');
    connection = await amqp.connect(rabbitmqUrl);
    
    channel = await connection.createChannel();
    
    // Assert queues exist
    await Promise.all(
      Object.values(QUEUES).map(queue => 
        channel.assertQueue(queue, { durable: true })
      )
    );
    
    console.log('✅ RabbitMQ connected successfully');
    console.log(`📬 Queues initialized: ${Object.keys(QUEUES).join(', ')}`);
    
    // Handle connection errors
    connection.on('error', (err) => {
      console.error('❌ RabbitMQ connection error:', err.message);
    });
    
    connection.on('close', () => {
      console.log('⚠️  RabbitMQ connection closed');
      // Attempt to reconnect after 5 seconds
      setTimeout(connectRabbitMQ, 5000);
    });
    
    return { connection, channel };
  } catch (error) {
    console.error('❌ Failed to connect to RabbitMQ:', error.message);
    console.warn('⚠️  Application will continue without message queue');
    console.warn('⚠️  Notifications will be sent synchronously');
    return { connection: null, channel: null };
  }
};

/**
 * Get RabbitMQ channel
 */
const getChannel = () => {
  if (!channel) {
    console.warn('⚠️  RabbitMQ channel not available');
  }
  return channel;
};

/**
 * Publish message to queue
 * @param {string} queue - Queue name
 * @param {object} message - Message object
 */
const publishToQueue = async (queue, message) => {
  try {
    if (!channel) {
      console.warn('⚠️  RabbitMQ not available, skipping queue publish');
      return false;
    }
    
    const messageBuffer = Buffer.from(JSON.stringify(message));
    
    channel.sendToQueue(queue, messageBuffer, {
      persistent: true, // Survive RabbitMQ restart
      contentType: 'application/json',
      timestamp: Date.now(),
    });
    
    console.log(`📤 Message published to queue: ${queue}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to publish to queue ${queue}:`, error.message);
    return false;
  }
};

/**
 * Consume messages from queue
 * @param {string} queue - Queue name
 * @param {function} callback - Message handler
 */
const consumeFromQueue = async (queue, callback) => {
  try {
    if (!channel) {
      console.warn('⚠️  RabbitMQ not available, cannot consume messages');
      return;
    }
    
    await channel.assertQueue(queue, { durable: true });
    
    // Prefetch 1 message at a time
    channel.prefetch(1);
    
    console.log(`📥 Waiting for messages in queue: ${queue}`);
    
    channel.consume(
      queue,
      async (msg) => {
        if (msg !== null) {
          try {
            const content = JSON.parse(msg.content.toString());
            console.log(`📨 Received message from ${queue}:`, content.type || 'notification');
            
            await callback(content);
            
            // Acknowledge message
            channel.ack(msg);
            console.log(`✅ Message processed successfully`);
          } catch (error) {
            console.error(`❌ Error processing message:`, error.message);
            
            // Reject and requeue the message
            channel.nack(msg, false, true);
          }
        }
      },
      { noAck: false }
    );
  } catch (error) {
    console.error(`❌ Failed to consume from queue ${queue}:`, error.message);
  }
};

/**
 * Close RabbitMQ connection
 */
const closeRabbitMQ = async () => {
  try {
    if (channel) {
      await channel.close();
      console.log('✅ RabbitMQ channel closed');
    }
    if (connection) {
      await connection.close();
      console.log('✅ RabbitMQ connection closed');
    }
  } catch (error) {
    console.error('❌ Error closing RabbitMQ:', error.message);
  }
};

module.exports = {
  connectRabbitMQ,
  getChannel,
  publishToQueue,
  consumeFromQueue,
  closeRabbitMQ,
  QUEUES,
};
