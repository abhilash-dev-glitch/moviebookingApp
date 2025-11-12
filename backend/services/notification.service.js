const { publishToQueue, QUEUES } = require('../config/rabbitmq');
const emailService = require('./email.service');
const smsService = require('./sms.service');

/**
 * Notification types
 */
const NOTIFICATION_TYPES = {
  BOOKING_CONFIRMATION: 'booking_confirmation',
  PAYMENT_CONFIRMATION: 'payment_confirmation',
  BOOKING_REMINDER: 'booking_reminder',
  BOOKING_CANCELLATION: 'booking_cancellation',
  WELCOME: 'welcome',
  OTP: 'otp',
};

/**
 * Send notification via queue (async)
 * @param {string} type - Notification type
 * @param {object} data - Notification data
 * @param {object} options - Notification options
 */
const queueNotification = async (type, data, options = {}) => {
  const { email = true, sms = false } = options;
  
  const notification = {
    type,
    data,
    email,
    sms,
    timestamp: new Date().toISOString(),
  };
  
  // Determine which queue to use
  let queue = QUEUES.EMAIL;
  
  if (type === NOTIFICATION_TYPES.BOOKING_CONFIRMATION) {
    queue = QUEUES.BOOKING_CONFIRMATION;
  } else if (type === NOTIFICATION_TYPES.PAYMENT_CONFIRMATION) {
    queue = QUEUES.PAYMENT_CONFIRMATION;
  } else if (type === NOTIFICATION_TYPES.BOOKING_REMINDER) {
    queue = QUEUES.BOOKING_REMINDER;
  }
  
  // Publish to queue
  const published = await publishToQueue(queue, notification);
  
  // If queue is not available, send synchronously
  if (!published) {
    console.log('⚠️  Queue not available, sending notification synchronously');
    await sendNotificationSync(type, data, options);
  }
  
  return { queued: published };
};

/**
 * Send notification synchronously (fallback)
 * @param {string} type - Notification type
 * @param {object} data - Notification data
 * @param {object} options - Notification options
 */
const sendNotificationSync = async (type, data, options = {}) => {
  const { email = true, sms = false } = options;
  const results = { email: null, sms: null };
  
  try {
    switch (type) {
      case NOTIFICATION_TYPES.BOOKING_CONFIRMATION:
        if (email) {
          results.email = await emailService.sendBookingConfirmation(data.booking, data.user);
        }
        if (sms) {
          results.sms = await smsService.sendBookingConfirmationSMS(data.booking, data.user);
        }
        break;
        
      case NOTIFICATION_TYPES.PAYMENT_CONFIRMATION:
        if (email) {
          results.email = await emailService.sendPaymentConfirmation(data.payment, data.booking, data.user);
        }
        if (sms) {
          results.sms = await smsService.sendPaymentConfirmationSMS(data.payment, data.booking, data.user);
        }
        break;
        
      case NOTIFICATION_TYPES.BOOKING_REMINDER:
        if (email) {
          results.email = await emailService.sendBookingReminder(data.booking, data.user);
        }
        if (sms) {
          results.sms = await smsService.sendBookingReminderSMS(data.booking, data.user);
        }
        break;
        
      case NOTIFICATION_TYPES.BOOKING_CANCELLATION:
        if (email) {
          results.email = await emailService.sendCancellationEmail(data.booking, data.user);
        }
        if (sms) {
          results.sms = await smsService.sendCancellationSMS(data.booking, data.user);
        }
        break;
        
      case NOTIFICATION_TYPES.WELCOME:
        if (email) {
          results.email = await emailService.sendWelcomeEmail(data.user);
        }
        break;
        
      case NOTIFICATION_TYPES.OTP:
        if (sms) {
          results.sms = await smsService.sendOTP(data.phone, data.otp);
        }
        break;
        
      default:
        console.warn(`⚠️  Unknown notification type: ${type}`);
    }
    
    return results;
  } catch (error) {
    console.error('❌ Error sending notification:', error.message);
    return { error: error.message };
  }
};

/**
 * Send booking confirmation
 */
const sendBookingConfirmation = async (booking, user, options = {}) => {
  return await queueNotification(
    NOTIFICATION_TYPES.BOOKING_CONFIRMATION,
    { booking, user },
    { email: true, sms: options.sms || false }
  );
};

/**
 * Send payment confirmation
 */
const sendPaymentConfirmation = async (payment, booking, user, options = {}) => {
  return await queueNotification(
    NOTIFICATION_TYPES.PAYMENT_CONFIRMATION,
    { payment, booking, user },
    { email: true, sms: options.sms || false }
  );
};

/**
 * Send booking reminder
 */
const sendBookingReminder = async (booking, user, options = {}) => {
  return await queueNotification(
    NOTIFICATION_TYPES.BOOKING_REMINDER,
    { booking, user },
    { email: true, sms: options.sms || false }
  );
};

/**
 * Send cancellation notification
 */
const sendCancellationNotification = async (booking, user, options = {}) => {
  return await queueNotification(
    NOTIFICATION_TYPES.BOOKING_CANCELLATION,
    { booking, user },
    { email: true, sms: options.sms || false }
  );
};

/**
 * Send welcome email
 */
const sendWelcomeNotification = async (user) => {
  return await queueNotification(
    NOTIFICATION_TYPES.WELCOME,
    { user },
    { email: true, sms: false }
  );
};

module.exports = {
  NOTIFICATION_TYPES,
  queueNotification,
  sendNotificationSync,
  sendBookingConfirmation,
  sendPaymentConfirmation,
  sendBookingReminder,
  sendCancellationNotification,
  sendWelcomeNotification,
};
