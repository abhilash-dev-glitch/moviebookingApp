const dotenv = require('dotenv');
const app = require('./app');
const connectDB = require('./config/db');
const { connectRedis, disconnectRedis } = require('./config/redis');
const { connectRabbitMQ, closeRabbitMQ } = require('./config/rabbitmq');
const { initializeEmailService } = require('./services/email.service');
const { initializeSMSService } = require('./services/sms.service');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Connect to Redis
connectRedis();

// Connect to RabbitMQ
connectRabbitMQ();

// Initialize notification services
initializeEmailService();
initializeSMSService();

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(async () => {
    await disconnectRedis();
    await closeRabbitMQ();
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

// Handle SIGTERM
process.on('SIGTERM', async () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
  server.close(async () => {
    await disconnectRedis();
    await closeRabbitMQ();
    console.log('💥 Process terminated!');
  });
});
