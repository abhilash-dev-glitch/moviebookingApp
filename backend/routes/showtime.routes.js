const express = require('express');
const {
  getAllShowtimes,
  getShowtime,
  createShowtime,
  updateShowtime,
  deleteShowtime,
  getAvailableSeats,
  getCurrentShowtimes,
  getUpcomingShowtimes,
  getAvailableShowtimes,
  getPastShowtimes
} = require('../controllers/showtime.controller');
const { protect, restrictTo, checkTheaterAccess, checkShowtimeAccess } = require('../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.get('/', getAllShowtimes);
router.get('/current', getCurrentShowtimes);
router.get('/upcoming', getUpcomingShowtimes);
router.get('/available', getAvailableShowtimes);
router.get('/past', getPastShowtimes);
router.get('/:id', getShowtime);
router.get('/:id/seats', getAvailableSeats);

// Protected routes
router.use(protect);

// Admin and Theater Manager can create/manage showtimes
router.post('/', restrictTo('admin', 'theaterManager'), checkTheaterAccess, createShowtime);
router.patch('/:id', restrictTo('admin', 'theaterManager'), checkShowtimeAccess, updateShowtime);
router.delete('/:id', restrictTo('admin', 'theaterManager'), checkShowtimeAccess, deleteShowtime);

module.exports = router;
