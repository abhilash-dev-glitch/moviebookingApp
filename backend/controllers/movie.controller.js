const Movie = require('../models/Movie');
const Showtime = require('../models/Showtime');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');
const { uploadBufferToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

// @desc    Get all movies
// @route   GET /api/v1/movies
// @access  Public
exports.getAllMovies = async (req, res, next) => {
  try {
    // Execute query
    const features = new APIFeatures(Movie.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const movies = await features.query;

    res.status(200).json({
      status: 'success',
      results: movies.length,
      data: {
        movies,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single movie
// @route   GET /api/v1/movies/:id
// @access  Public
exports.getMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return next(new AppError('No movie found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        movie,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new movie
// @route   POST /api/v1/movies
// @access  Private/Admin
exports.createMovie = async (req, res, next) => {
  try {
    const newMovie = await Movie.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        movie: newMovie,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update movie
// @route   PATCH /api/v1/movies/:id
// @access  Private/Admin
exports.updateMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!movie) {
      return next(new AppError('No movie found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        movie,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete movie
// @route   DELETE /api/v1/movies/:id
// @access  Private/Admin
exports.deleteMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);

    if (!movie) {
      return next(new AppError('No movie found with that ID', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get movie showtimes
// @route   GET /api/v1/movies/:id/showtimes
// @access  Public
exports.getMovieShowtimes = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return next(new AppError('No movie found with that ID', 404));
    }

    const showtimes = await Showtime.find({
      movie: req.params.id,
      startTime: { $gte: new Date() },
    })
      .populate('theater', 'name location')
      .sort('startTime');

    res.status(200).json({
      status: 'success',
      results: showtimes.length,
      data: {
        showtimes,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload movie poster
// @route   POST /api/v1/movies/:id/poster
// @access  Private/Admin
exports.uploadMoviePoster = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('Please upload a file', 400));
    }

    // Get movie
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return next(new AppError('Movie not found', 404));
    }

    // Delete old poster from Cloudinary if exists
    if (movie.poster && movie.posterPublicId) {
      try {
        await deleteFromCloudinary(movie.posterPublicId);
      } catch (error) {
        console.error('Error deleting old poster:', error);
      }
    }

    // Upload new poster to Cloudinary
    const result = await uploadBufferToCloudinary(
      req.file.buffer,
      'movie-booking/movies',
      {
        transformation: [
          { width: 800, height: 1200, crop: 'fill' },
          { quality: 'auto' },
        ],
      }
    );

    // Update movie with new poster
    movie.poster = result.url;
    movie.posterPublicId = result.publicId;
    await movie.save();

    res.status(200).json({
      status: 'success',
      message: 'Movie poster uploaded successfully',
      data: {
        poster: result.url,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete movie poster
// @route   DELETE /api/v1/movies/:id/poster
// @access  Private/Admin
exports.deleteMoviePoster = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return next(new AppError('Movie not found', 404));
    }

    if (!movie.poster) {
      return next(new AppError('No poster to delete', 400));
    }

    // Delete from Cloudinary
    if (movie.posterPublicId) {
      try {
        await deleteFromCloudinary(movie.posterPublicId);
      } catch (error) {
        console.error('Error deleting poster:', error);
      }
    }

    // Remove from movie document
    movie.poster = undefined;
    movie.posterPublicId = undefined;
    await movie.save();

    res.status(200).json({
      status: 'success',
      message: 'Movie poster deleted successfully',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};
