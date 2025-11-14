require('dotenv').config();
const mongoose = require('mongoose');
const { initializeEmailService } = require('./services/email.service');
const emailService = require('./services/email.service');

/**
 * Test cancellation email
 */
const testCancellationEmail = async () => {
  try {
    console.log('🧪 Testing Cancellation Email...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected\n');
    
    // Initialize email service
    initializeEmailService();
    console.log('✅ Email service initialized\n');
    
    // Load all required models (needed for populate to work)
    const Booking = require('./models/Booking');
    require('./models/Showtime');
    require('./models/Movie');
    require('./models/Theater');
    require('./models/User');
    
    // Get a real booking from database (try cancelled first, then any paid booking)
    let booking = await Booking.findOne({ paymentStatus: 'cancelled' })
      .populate({
        path: 'showtime',
        populate: {
          path: 'movie theater',
          select: 'title name location',
        },
      })
      .populate('user', 'name email');
    
    if (!booking) {
      console.log('⚠️  No cancelled booking found, using a paid booking for testing...\n');
      booking = await Booking.findOne({ paymentStatus: 'paid' })
        .populate({
          path: 'showtime',
          populate: {
            path: 'movie theater',
            select: 'title name location',
          },
        })
        .populate('user', 'name email');
    }
    
    if (!booking) {
      console.log('❌ No bookings found in database');
      console.log('💡 Please create a booking first, then run this test again');
      process.exit(1);
    }
    
    console.log('📧 Sending cancellation email to:', booking.user.email);
    console.log('🎬 Movie:', booking.showtime.movie.title);
    console.log('🏢 Theater:', booking.showtime.theater.name);
    console.log('💰 Refund Amount: ₹', booking.totalAmount);
    console.log('\n⏳ Sending email...\n');
    
    // Send cancellation email
    const result = await emailService.sendCancellationEmail(booking, booking.user);
    
    if (result.success) {
      console.log('✅ Cancellation email sent successfully!');
      console.log('📬 Message ID:', result.messageId);
      console.log('📧 Sent to:', result.to);
    } else {
      console.log('❌ Failed to send cancellation email');
      console.log('Error:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

// Run test
testCancellationEmail();
