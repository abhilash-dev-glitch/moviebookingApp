const express = require('express');
const {
  getAllBookings,
  getMyBookings,
  getMyTheatersBookings,
  getBooking,
  createBooking,
  updatePaymentStatus,
  cancelBooking,
  getLockedSeats,
  checkSeatsAvailability,
  lockSeat,
  unlockSeat,
} = require('../controllers/booking.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.get('/showtime/:showtimeId/locked-seats', getLockedSeats);
router.post('/check-seats', checkSeatsAvailability);

// All routes below are protected
router.use(protect);

// Admin only routes (specific routes first)
router.get('/', restrictTo('admin'), getAllBookings);

// User routes (specific routes before parameterized routes)
router.get('/my-bookings', getMyBookings);

// Theater Manager routes (specific routes before parameterized routes)
router.get('/my-theaters-bookings', restrictTo('theaterManager', 'admin'), getMyTheatersBookings);

// Booking operations
router.post('/', createBooking);
router.post('/lock-seat', lockSeat);
router.post('/unlock-seat', unlockSeat);

// Parameterized routes (MUST come last)
router.get('/:id', getBooking);
router.patch('/:id/payment', updatePaymentStatus);
router.delete('/:id', cancelBooking);

module.exports = router;