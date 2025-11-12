const express = require('express');
const {
  getAllMovies,
  getMovie,
  createMovie,
  updateMovie,
  deleteMovie,
  getMovieShowtimes,
  uploadMoviePoster,
  deleteMoviePoster,
} = require('../controllers/movie.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const { uploadSingle } = require('../middleware/upload.middleware');

const router = express.Router();

// Public routes
router.get('/', getAllMovies);
router.get('/:id', getMovie);
router.get('/:id/showtimes', getMovieShowtimes);

// Protected routes (Admin and Theater Manager)
router.use(protect);
router.use(restrictTo('admin', 'theaterManager'));

router.post('/', createMovie);
router.patch('/:id', updateMovie);
router.delete('/:id', deleteMovie);

// Poster upload routes
router.post('/:id/poster', uploadSingle('poster'), uploadMoviePoster);
router.delete('/:id/poster', deleteMoviePoster);

module.exports = router;
