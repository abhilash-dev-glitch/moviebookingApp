const express = require('express');
const {
  getAllBookings,
  getMyBookings,
  getBooking,
  createBooking,
  updatePaymentStatus,
  cancelBooking,
  getLockedSeats,
  checkSeatsAvailability,
} = require('../controllers/booking.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

const router = express.Router();

// Public routes (seat availability checking)
router.get('/showtime/:showtimeId/locked-seats', getLockedSeats);
router.post('/check-seats', checkSeatsAvailability);

// All routes below are protected
router.use(protect);

// User routes
router.get('/my-bookings', getMyBookings);
router.post('/', createBooking);
router.get('/:id', getBooking);
router.patch('/:id/payment', updatePaymentStatus);
router.delete('/:id', cancelBooking);

// Admin only routes
router.get('/', restrictTo('admin'), getAllBookings);

module.exports = router;
