const mailer = require('../utils/mailer');
const { getTargetEmail } = require('../utils/notificationHelper');

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
  const targetEmail = getTargetEmail(user.email);
  
  const movie = booking.showtime.movie;
  const data = {
    userName: user.name,
    bookingId: booking._id,
    movieTitle: movie.title,
    moviePoster: movie.poster || null,
    movieGenre: movie.genre || null,
    movieDuration: movie.duration || null,
    movieLanguage: movie.language || null,
    movieDescription: movie.description ? (movie.description.length > 150 ? movie.description.substring(0, 150) + '...' : movie.description) : null,
    theaterName: booking.showtime.theater.name,
    showtime: new Date(booking.showtime.startTime).toLocaleString(),
    seats: booking.seats.map(s => `${s.row}${s.seat}`).join(', '),
    totalAmount: booking.totalAmount,
    bookingDate: new Date(booking.createdAt).toLocaleString(),
  };

  // If targetEmail is an array (admin emails), add original email to data
  if (Array.isArray(targetEmail)) {
    data.originalEmail = user.email;
    data.redirectNote = `This email was sent to admins because the user email (${user.email}) is from an untrusted domain.`;
  }

  return await mailer.sendWithTemplate(
    targetEmail,
    `🎬 Booking Confirmed: ${movie.title}`,
    'booking-confirmation',
    data
  );
};

/**
 * Send payment confirmation email
 */
const sendPaymentConfirmation = async (payment, booking, user) => {
  const targetEmail = getTargetEmail(user.email);
  
  const movie = booking.showtime.movie;
  const data = {
    userName: user.name,
    bookingId: booking._id,
    paymentId: payment._id,
    transactionId: payment.transactionId,
    amount: payment.amount,
    paymentMethod: payment.gateway,
    paymentDate: new Date(payment.createdAt).toLocaleString(),
    movieTitle: movie.title,
    moviePoster: movie.poster || null,
    theaterName: booking.showtime.theater.name,
    showtime: new Date(booking.showtime.startTime).toLocaleString(),
    seats: booking.seats.map(s => `${s.row}${s.seat}`).join(', '),
  };

  return await mailer.sendWithTemplate(
    targetEmail,
    `✅ Payment Confirmed: ${movie.title}`,
    'payment-confirmation',
    data
  );
};

/**
 * Send booking reminder email
 */
const sendBookingReminder = async (booking, user) => {
  const targetEmail = getTargetEmail(user.email);
  
  const data = {
    userName: user.name,
    movieTitle: booking.showtime.movie.title,
    theaterName: booking.showtime.theater.name,
    showtime: new Date(booking.showtime.startTime).toLocaleString(),
    seats: booking.seats.map(s => `${s.row}${s.seat}`).join(', '),
    bookingId: booking._id,
  };

  return await mailer.sendWithTemplate(
    targetEmail,
    'Reminder: Your Movie Show is Tomorrow!',
    'booking-reminder',
    data
  );
};

/**
 * Send cancellation email
 */
const sendCancellationEmail = async (booking, user) => {
  const targetEmail = getTargetEmail(user.email);
  
  const movie = booking.showtime.movie;
  const data = {
    userName: user.name,
    bookingId: booking._id,
    movieTitle: movie.title,
    moviePoster: movie.poster || null,
    theaterName: booking.showtime.theater.name,
    showtime: new Date(booking.showtime.startTime).toLocaleString(),
    refundAmount: booking.totalAmount,
    cancellationDate: new Date().toLocaleString(),
  };

  // If targetEmail is an array (admin emails), add original email to data
  if (Array.isArray(targetEmail)) {
    data.originalEmail = user.email;
    data.redirectNote = `This email was sent to admins because the user email (${user.email}) is from an untrusted domain.`;
  }

  return await mailer.sendWithTemplate(
    targetEmail,
    'Booking Cancellation Confirmation',
    'booking-cancellation',
    data
  );
};

/**
 * Send welcome email
 */
const sendWelcomeEmail = async (user) => {
  const targetEmail = getTargetEmail(user.email);
  
  const data = {
    userName: user.name,
    email: user.email,
  };

  return await mailer.sendWithTemplate(
    targetEmail,
    'Welcome to CineGo - Movie Booking Made Easy!',
    'welcome',
    data
  );
};

/**
 * Send profile update confirmation email
 */
const sendProfileUpdateEmail = async (user, updatedFields) => {
  const targetEmail = getTargetEmail(user.email);
  
  const data = {
    userName: user.name,
    updatedFields: Object.keys(updatedFields).join(', '),
    updateDate: new Date().toLocaleString(),
  };

  return await mailer.sendWithTemplate(
    targetEmail,
    'Profile Updated Successfully',
    'profile-update',
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
  sendProfileUpdateEmail,
};
