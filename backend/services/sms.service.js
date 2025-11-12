const twilio = require('twilio');

let twilioClient = null;

const initializeSMSService = () => {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!accountSid || !authToken) {
      console.warn('⚠️  Twilio credentials not configured');
      console.warn('⚠️  SMS notifications will be disabled');
      return;
    }
    
    twilioClient = twilio(accountSid, authToken);
    console.log('✅ SMS service initialized');
  } catch (error) {
    console.error('❌ Failed to initialize SMS service:', error.message);
    console.warn('⚠️  SMS notifications will be disabled');
  }
};

/**
 * Send SMS
 * @param {string} to - Phone number
 * @param {string} message - SMS message
 */
const sendSMS = async (to, message) => {
  try {
    if (!twilioClient) {
      console.warn('⚠️  SMS service not available');
      return { success: false, error: 'SMS service not configured' };
    }
    
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;
    
    if (!fromNumber) {
      console.error('❌ Twilio phone number not configured');
      return { success: false, error: 'Twilio phone number not configured' };
    }
    
    const result = await twilioClient.messages.create({
      body: message,
      from: fromNumber,
      to: to,
    });
    
    console.log(`✅ SMS sent to ${to}: ${result.sid}`);
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error('❌ Failed to send SMS:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send booking confirmation SMS
 */
const sendBookingConfirmationSMS = async (booking, user) => {
  const message = `Hi ${user.name}! Your booking for "${booking.showtime.movie.title}" at ${booking.showtime.theater.name} on ${new Date(booking.showtime.startTime).toLocaleString()} is confirmed. Seats: ${booking.seats.map(s => `${s.row}${s.seat}`).join(', ')}. Booking ID: ${booking._id}`;
  
  return await sendSMS(user.phone, message);
};

/**
 * Send payment confirmation SMS
 */
const sendPaymentConfirmationSMS = async (payment, booking, user) => {
  const message = `Payment of ₹${payment.amount} received for booking ${booking._id}. Transaction ID: ${payment.transactionId}. Enjoy your movie!`;
  
  return await sendSMS(user.phone, message);
};

/**
 * Send booking reminder SMS
 */
const sendBookingReminderSMS = async (booking, user) => {
  const message = `Reminder: Your movie "${booking.showtime.movie.title}" is tomorrow at ${new Date(booking.showtime.startTime).toLocaleString()}. ${booking.showtime.theater.name}. Seats: ${booking.seats.map(s => `${s.row}${s.seat}`).join(', ')}. See you there!`;
  
  return await sendSMS(user.phone, message);
};

/**
 * Send cancellation SMS
 */
const sendCancellationSMS = async (booking, user) => {
  const message = `Your booking ${booking._id} for "${booking.showtime.movie.title}" has been cancelled. Refund of ₹${booking.totalAmount} will be processed within 5-7 business days.`;
  
  return await sendSMS(user.phone, message);
};

/**
 * Send OTP SMS
 */
const sendOTP = async (phone, otp) => {
  const message = `Your Movie Booking OTP is: ${otp}. Valid for 10 minutes. Do not share this code with anyone.`;
  
  return await sendSMS(phone, message);
};

module.exports = {
  initializeSMSService,
  sendSMS,
  sendBookingConfirmationSMS,
  sendPaymentConfirmationSMS,
  sendBookingReminderSMS,
  sendCancellationSMS,
  sendOTP,
};
