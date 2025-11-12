const mailer = require('../utils/mailer');

/**
 * Initialize email service
 */
const initializeEmailService = () => {
  mailer.initialize();
};

/**
 * Send booking confirmation email
 */
const sendBookingConfirmation = async (booking, user) => {
  const data = {
    userName: user.name,
    bookingId: booking._id,
    movieTitle: booking.showtime.movie.title,
    theaterName: booking.showtime.theater.name,
    showtime: new Date(booking.showtime.startTime).toLocaleString(),
    seats: booking.seats.map(s => `${s.row}${s.seat}`).join(', '),
    totalAmount: booking.totalAmount,
    bookingDate: new Date(booking.createdAt).toLocaleString(),
  };

  return await mailer.sendWithTemplate(
    user.email,
    'Booking Confirmation - Movie Ticket',
    'booking-confirmation',
    data
  );
};

/**
 * Send payment confirmation email
 */
const sendPaymentConfirmation = async (payment, booking, user) => {
  const data = {
    userName: user.name,
    bookingId: booking._id,
    paymentId: payment._id,
    transactionId: payment.transactionId,
    amount: payment.amount,
    paymentMethod: payment.gateway,
    paymentDate: new Date(payment.createdAt).toLocaleString(),
    movieTitle: booking.showtime.movie.title,
    theaterName: booking.showtime.theater.name,
    showtime: new Date(booking.showtime.startTime).toLocaleString(),
    seats: booking.seats.map(s => `${s.row}${s.seat}`).join(', '),
  };

  return await mailer.sendWithTemplate(
    user.email,
    'Payment Confirmation - Movie Ticket',
    'payment-confirmation',
    data
  );
};

/**
 * Send booking reminder email
 */
const sendBookingReminder = async (booking, user) => {
  const data = {
    userName: user.name,
    movieTitle: booking.showtime.movie.title,
    theaterName: booking.showtime.theater.name,
    showtime: new Date(booking.showtime.startTime).toLocaleString(),
    seats: booking.seats.map(s => `${s.row}${s.seat}`).join(', '),
    bookingId: booking._id,
  };

  return await mailer.sendWithTemplate(
    user.email,
    'Reminder: Your Movie Show is Tomorrow!',
    'booking-reminder',
    data
  );
};

/**
 * Send cancellation email
 */
const sendCancellationEmail = async (booking, user) => {
  const data = {
    userName: user.name,
    bookingId: booking._id,
    movieTitle: booking.showtime.movie.title,
    theaterName: booking.showtime.theater.name,
    showtime: new Date(booking.showtime.startTime).toLocaleString(),
    refundAmount: booking.totalAmount,
    cancellationDate: new Date().toLocaleString(),
  };

  return await mailer.sendWithTemplate(
    user.email,
    'Booking Cancellation Confirmation',
    'booking-cancellation',
    data
  );
};

/**
 * Send welcome email
 */
const sendWelcomeEmail = async (user) => {
  const data = {
    userName: user.name,
    email: user.email,
  };

  return await mailer.sendWithTemplate(
    user.email,
    'Welcome to Movie Booking System!',
    'welcome',
    data
  );
};

module.exports = {
  initializeEmailService,
  sendBookingConfirmation,
  sendPaymentConfirmation,
  sendBookingReminder,
  sendCancellationEmail,
  sendWelcomeEmail,
};
