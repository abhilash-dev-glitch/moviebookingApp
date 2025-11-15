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
    // Auto-update movie statuses based on showtimes (run periodically)
    const { updateMovieStatuses } = require('../utils/updateMovieStatuses');
    await updateMovieStatuses();
    
    // --- UPDATED LOGIC ---
    const filter = {}; // This will be our base filter for MongoDB

    // Get the filter param from either 'view' (Home.jsx) or 'filter' (Movies.jsx)
    const viewFilter = req.query.view || req.query.filter;

    if (viewFilter) {
      switch (viewFilter) {
        case 'active':
        case 'now-showing':
        case 'new':
          filter.status = 'active'; // Filter by the new 'status' field
          break;
        
        case 'upcoming':
        case 'coming-soon':
          filter.status = 'upcoming'; // Filter by the new 'status' field
          break;

        case 'inactive':
          filter.status = 'inactive'; // Filter by the new 'status' field
          break;

        case 'all':
        case 'top-rated': // 'top-rated' will be handled by sorting, just need all movies
        default:
          // No status filter needed, will show all
          break;
      }
    } else {
      // Default behavior if no filter is provided:
      // Only show 'active' (Now Showing) movies.
      filter.status = 'active';
    }
    // --- END OF UPDATED LOGIC ---

    // Execute query
    // Pass the new 'filter' object directly to Movie.find()
    const features = new APIFeatures(Movie.find(filter), req.query)
      .filter() // This will now apply remaining filters
      .sort()
      .limitFields()
      .paginate();

    // Populate showtimes to get insights for the admin panel
    const movies = await features.query.populate({
      path: 'showtimes',
      match: { startTime: { $gte: new Date() } }, // Only get active/upcoming showtimes
      populate: [
        {
          path: 'theater',
          select: 'name', // We only need the theater's name for the insight
        },
        {
          path: 'bookingCount', // Populate the virtual bookingCount
        }
      ],
    });

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
    // Populate reviews and active showtimes for the detail page
    const movie = await Movie.findById(req.params.id)
      .populate('reviews')
      .populate({
        path: 'showtimes',
        match: { startTime: { $gte: new Date() } },
        populate: [
          {
            path: 'theater',
            select: 'name location.city',
          },
          {
            path: 'bookingCount', // Also populate booking count for detail view
          }
        ],
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
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return next(new AppError('No movie found with that ID', 404));
    }

    // Delete associated poster from Cloudinary first
    if (movie.posterPublicId) {
      try {
        await deleteFromCloudinary(movie.posterPublicId);
      } catch (error) {
        console.error('Error deleting poster during movie delete:', error);
        // Don't block movie deletion if poster delete fails
      }
    }

    // Delete showtimes associated with the movie
    await Showtime.deleteMany({ movie: req.params.id });

    // Now delete the movie
    await Movie.findByIdAndDelete(req.params.id);

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
        posterPublicId: result.publicId,
        movie,
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
    movie.poster = null; // Use null instead of undefined
    movie.posterPublicId = null; // Use null instead of undefined
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