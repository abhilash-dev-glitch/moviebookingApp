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

    const theaters = await features.query;

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
    const theater = await Theater.findById(req.params.id);

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
// @access  Private/Admin
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
    const theater = await Theater.findByIdAndDelete(req.params.id);

    if (!theater) {
      return next(new AppError('No theater found with that ID', 404));
    }

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

    const showtimes = await Showtime.find({
      theater: req.params.id,
      startTime: { $gte: new Date() },
    })
      .populate('movie', 'title duration poster')
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
