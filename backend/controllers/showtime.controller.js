const Showtime = require('../models/Showtime');
const Theater = require('../models/Theater');
const Movie = require('../models/Movie');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

// @desc    Get current showtimes (shows happening now ± 1 hour)
// @route   GET /api/v1/showtimes/current
// @access  Public
exports.getCurrentShowtimes = async (req, res, next) => {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    const showtimes = await Showtime.find({
      startTime: { $lte: oneHourLater },
      endTime: { $gte: oneHourAgo }
    })
    .populate('movie', 'title duration poster')
    .populate('theater', 'name location');

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

// @desc    Get upcoming showtimes
// @route   GET /api/v1/showtimes/upcoming
// @access  Public
exports.getUpcomingShowtimes = async (req, res, next) => {
  try {
    const now = new Date();
    
    const showtimes = await Showtime.find({
      startTime: { $gt: now }
    })
    .sort('startTime')
    .populate('movie', 'title duration poster')
    .populate('theater', 'name location');

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

// @desc    Get available showtimes (with available seats)
// @route   GET /api/v1/showtimes/available
// @access  Public
exports.getAvailableShowtimes = async (req, res, next) => {
  try {
    const now = new Date();
    
    // Find showtimes in the future
    const showtimes = await Showtime.find({
      startTime: { $gt: now },
      'seats.available': { $gt: 0 } // At least one seat available
    })
    .sort('startTime')
    .populate('movie', 'title duration poster')
    .populate('theater', 'name location');

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

// @desc    Get past showtimes
// @route   GET /api/v1/showtimes/past
// @access  Public
exports.getPastShowtimes = async (req, res, next) => {
  try {
    const now = new Date();
    
    const showtimes = await Showtime.find({
      endTime: { $lt: now }
    })
    .sort('-startTime')
    .populate('movie', 'title duration poster')
    .populate('theater', 'name location');

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

// @desc    Get all showtimes
// @route   GET /api/v1/showtimes
// @access  Public
exports.getAllShowtimes = async (req, res, next) => {
  try {
    // Execute query
    const features = new APIFeatures(Showtime.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const showtimes = await features.query
      .populate('movie', 'title duration poster')
      .populate('theater', 'name location');

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

// @desc    Get single showtime
// @route   GET /api/v1/showtimes/:id
// @access  Public
exports.getShowtime = async (req, res, next) => {
  try {
    const showtime = await Showtime.findById(req.params.id)
      .populate('movie', 'title duration poster')
      .populate('theater', 'name location screens');

    if (!showtime) {
      return next(new AppError('No showtime found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        showtime,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new showtime
// @route   POST /api/v1/showtimes
// @access  Private/Admin
exports.createShowtime = async (req, res, next) => {
  try {
    const { movie, theater, screen, startTime, endTime, price } = req.body;

    // Check if movie exists
    const movieExists = await Movie.findById(movie);
    if (!movieExists) {
      return next(new AppError('No movie found with that ID', 404));
    }

    // Check if theater exists
    const theaterExists = await Theater.findById(theater);
    if (!theaterExists) {
      return next(new AppError('No theater found with that ID', 404));
    }

    // Check if screen exists in theater
    const screenExists = theaterExists.screens.some(
      (s) => s.name === screen || s._id.toString() === screen
    );

    if (!screenExists) {
      return next(
        new AppError('The specified screen does not exist in this theater', 400)
      );
    }

    // Check for overlapping showtimes
    const overlappingShowtime = await Showtime.findOne({
      theater,
      screen,
      $or: [
        {
          startTime: { $lt: new Date(endTime) },
          endTime: { $gt: new Date(startTime) },
        },
      ],
    });

    if (overlappingShowtime) {
      return next(
        new AppError(
          'There is already a show scheduled in this screen during the requested time',
          400
        )
      );
    }

    const newShowtime = await Showtime.create({
      movie,
      theater,
      screen,
      startTime,
      endTime,
      price,
      availableSeats: theaterExists.screens.find(
        (s) => s.name === screen || s._id.toString() === screen
      ).capacity,
    });

    res.status(201).json({
      status: 'success',
      data: {
        showtime: newShowtime,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update showtime
// @route   PATCH /api/v1/showtimes/:id
// @access  Private/Admin
exports.updateShowtime = async (req, res, next) => {
  try {
    const showtime = await Showtime.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('movie', 'title duration poster')
      .populate('theater', 'name location');

    if (!showtime) {
      return next(new AppError('No showtime found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        showtime,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete showtime
// @route   DELETE /api/v1/showtimes/:id
// @access  Private/Admin
exports.deleteShowtime = async (req, res, next) => {
  try {
    const showtime = await Showtime.findByIdAndDelete(req.params.id);

    if (!showtime) {
      return next(new AppError('No showtime found with that ID', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get available seats for a showtime
// @route   GET /api/v1/showtimes/:id/seats
// @access  Public
exports.getAvailableSeats = async (req, res, next) => {
  try {
    const showtime = await Showtime.findById(req.params.id)
      .populate('theater', 'screens')
      .populate({
        path: 'bookings',
        select: 'seats',
      });

    if (!showtime) {
      return next(new AppError('No showtime found with that ID', 404));
    }

    // Get the screen details
    const screen = showtime.theater.screens.find(
      (s) => s.name === showtime.screen || s._id.toString() === showtime.screen
    );

    if (!screen) {
      return next(new AppError('Screen not found for this showtime', 404));
    }

    // Get all booked seats
    const bookedSeats = [];
    showtime.bookings.forEach((booking) => {
      booking.seats.forEach((seat) => {
        bookedSeats.push(`${seat.row}-${seat.seat}`);
      });
    });

    // Generate seat map
    const seatMap = [];
    for (let row = 0; row < screen.seatLayout.length; row++) {
      const seatRow = [];
      for (let seat = 0; seat < screen.seatLayout[row]; seat++) {
        const isBooked = bookedSeats.includes(`${row}-${seat}`);
        seatRow.push({
          row,
          seat,
          status: isBooked ? 'booked' : 'available',
          price: showtime.price,
        });
      }
      seatMap.push(seatRow);
    }

    res.status(200).json({
      status: 'success',
      data: {
        showtime: showtime._id,
        screen: screen.name,
        totalSeats: screen.capacity,
        availableSeats: showtime.availableSeats,
        seatMap,
      },
    });
  } catch (error) {
    next(error);
  }
};
