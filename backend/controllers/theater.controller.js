const Theater = require('../models/Theater');
const Showtime = require('../models/Showtime');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

// @desc    Get all theaters
// @route   GET /api/v1/theaters
// @access  Public
exports.getAllTheaters = async (req, res, next) => {
  try {
    // Execute query
    const features = new APIFeatures(Theater.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    // Populate showtimes to get insights for the admin panel
    const theaters = await features.query.populate({
      path: 'showtimes',
      match: { 
        startTime: { $gte: new Date() }, // Only upcoming showtimes
        isActive: true // Only active shows
      },
      populate: [
        {
          path: 'movie',
          select: 'title', // We only need the movie title
        },
        {
          path: 'bookingCount', // Use the virtual property
        },
      ],
    });

    res.status(200).json({
      status: 'success',
      results: theaters.length,
      data: {
        theaters,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single theater
// @route   GET /api/v1/theaters/:id
// @access  Public
exports.getTheater = async (req, res, next) => {
  try {
    const theater = await Theater.findById(req.params.id).populate({
      path: 'showtimes',
      match: { startTime: { $gte: new Date() } },
      populate: [
        {
          path: 'movie',
          select: 'title poster',
        },
        {
          path: 'bookingCount',
        },
      ],
    });

    if (!theater) {
      return next(new AppError('No theater found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        theater,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new theater
// @route   POST /api/v1/theaters
// @access  Private/Admin
exports.createTheater = async (req, res, next) => {
  try {
    const newTheater = await Theater.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        theater: newTheater,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update theater
// @route   PATCH /api/v1/theaters/:id
// @access  Private/Admin or TheaterManager
exports.updateTheater = async (req, res, next) => {
  try {
    const theater = await Theater.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!theater) {
      return next(new AppError('No theater found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        theater,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete theater
// @route   DELETE /api/v1/theaters/:id
// @access  Private/Admin
exports.deleteTheater = async (req, res, next) => {
  try {
    const theater = await Theater.findById(req.params.id);

    if (!theater) {
      return next(new AppError('No theater found with that ID', 404));
    }

    // Add pre-hook on Theater model to delete showtimes
    await theater.deleteOne(); // Use deleteOne to trigger middleware

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get showtimes for a theater
// @route   GET /api/v1/theaters/:id/showtimes
// @access  Public
exports.getTheaterShowtimes = async (req, res, next) => {
  try {
    const theater = await Theater.findById(req.params.id);
    if (!theater) {
      return next(new AppError('No theater found with that ID', 404));
    }

    // Get all showtimes for the theater (past and future)
    // Managers need to see all shows to manage them
    const showtimes = await Showtime.find({
      theater: req.params.id,
    })
      .populate('movie', 'title duration poster genre language ratingsAverage ratingsCount')
      .sort('-startTime'); // Sort by newest first

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

// @desc    Get theaters near a location
// @route   GET /api/v1/theaters/nearby
// @access  Public
exports.getTheatersNearby = async (req, res, next) => {
  try {
    const { distance, lat, lng, unit = 'km' } = req.query;
    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

    if (!lat || !lng) {
      return next(
        new AppError(
          'Please provide latitude and longitude in the format lat,lng.',
          400
        )
      );
    }

    const theaters = await Theater.find({
      'location.coordinates': {
        $geoWithin: { $centerSphere: [[lng, lat], radius] },
      },
    });

    res.status(200).json({
      status: 'success',
      results: theaters.length,
      data: {
        theaters,
      },
    });
  } catch (error) {
    next(error);
  }
};