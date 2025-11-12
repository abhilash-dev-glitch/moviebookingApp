const express = require('express');
const {
  getAllTheaters,
  getTheater,
  createTheater,
  updateTheater,
  deleteTheater,
  getTheaterShowtimes,
  getTheatersNearby,
} = require('../controllers/theater.controller');
const { protect, restrictTo, checkTheaterAccess } = require('../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.get('/', getAllTheaters);
router.get('/nearby', getTheatersNearby);
router.get('/:id', getTheater);
router.get('/:id/showtimes', getTheaterShowtimes);

// Protected routes
router.use(protect);

// Admin only - create new theaters
router.post('/', restrictTo('admin'), createTheater);

// Admin and Theater Manager - update/delete their theaters
router.patch('/:id', restrictTo('admin', 'theaterManager'), checkTheaterAccess, updateTheater);
router.delete('/:id', restrictTo('admin'), deleteTheater);

module.exports = router;
