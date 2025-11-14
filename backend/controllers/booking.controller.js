const Booking = require('../models/Booking');
const Showtime = require('../models/Showtime');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');
const {
  lockSeats,
  releaseSeats,
  checkSeatsLocked,
  getLockedSeatsForShowtime,
} = require('../utils/seatLockHelper');
const {
  sendBookingConfirmation,
  sendCancellationNotification,
} = require('../services/notification.service');
const { broadcast } = require('../config/websocket'); // Import broadcast

// @desc    Get all bookings (Admin only)
// @route   GET /api/v1/bookings
// @access  Private/Admin
exports.getAllBookings = async (req, res, next) => {
  try {
    const features = new APIFeatures(Booking.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const bookings = await features.query
      .populate('user', 'name email phone')
      .populate({
        path: 'showtime',
        populate: {
          path: 'movie theater',
          select: 'title duration poster name location.city',
        },
      });

    res.status(200).json({
      status: 'success',
      results: bookings.length,
      data: {
        bookings,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user bookings
// @route   GET /api/v1/bookings/my-bookings
// @access  Private
exports.getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate({
        path: 'showtime',
        populate: {
          path: 'movie theater',
          select: 'title duration poster name location.city',
        },
      })
      .sort('-bookingDate');

    res.status(200).json({
      status: 'success',
      results: bookings.length,
      data: {
        bookings,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get bookings for theater manager's theaters
// @route   GET /api/v1/bookings/my-theaters-bookings
// @access  Private/Theater Manager
exports.getMyTheatersBookings = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.id);

    if (!user || !user.managedTheaters || user.managedTheaters.length === 0) {
      return res.status(200).json({
        status: 'success',
        results: 0,
        data: {
          bookings: [],
          stats: {
            totalBookings: 0,
            totalRevenue: 0,
            paidBookings: 0,
            pendingBookings: 0,
            cancelledBookings: 0,
          },
        },
      });
    }

    // Get all showtimes for managed theaters
    const showtimes = await Showtime.find({
      theater: { $in: user.managedTheaters },
    }).select('_id');

    const showtimeIds = showtimes.map((st) => st._id);

    // Get all bookings for these showtimes
    const bookings = await Booking.find({
      showtime: { $in: showtimeIds },
    })
      .populate('user', 'name email phone')
      .populate({
        path: 'showtime',
        populate: {
          path: 'movie theater',
          select: 'title duration poster name location.city',
        },
      })
      .sort('-bookingDate');

    // Calculate stats
    const stats = {
      totalBookings: bookings.length,
      totalRevenue: bookings
        .filter((b) => b.paymentStatus === 'paid')
        .reduce((sum, b) => sum + b.totalAmount, 0),
      paidBookings: bookings.filter((b) => b.paymentStatus === 'paid').length,
      pendingBookings: bookings.filter((b) => b.paymentStatus === 'pending').length,
      cancelledBookings: bookings.filter((b) => b.paymentStatus === 'cancelled').length,
    };

    res.status(200).json({
      status: 'success',
      results: bookings.length,
      data: {
        bookings,
        stats,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single booking
// @route   GET /api/v1/bookings/:id
// @access  Private
exports.getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate({
        path: 'showtime',
        populate: {
          path: 'movie theater',
          select: 'title duration poster name location',
        },
      });

    if (!booking) {
      return next(new AppError('No booking found with that ID', 404));
    }

    // Make sure user is booking owner or admin
    if (
      booking.user._id.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return next(
        new AppError('You do not have permission to view this booking', 403)
      );
    }

    res.status(200).json({
      status: 'success',
      data: {
        booking,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new booking
// @route   POST /api/v1/bookings
// @access  Private
exports.createBooking = async (req, res, next) => {
  try {
    const { showtime, seats, paymentMethod, paymentStatus, amount } = req.body;

    // Check if showtime exists
    const showtimeDoc = await Showtime.findById(showtime).populate(
      'theater',
      'screens'
    );

    if (!showtimeDoc) {
      return next(new AppError('No showtime found with that ID', 404));
    }

    // Check if showtime is in the future
    if (new Date(showtimeDoc.startTime) < new Date()) {
      return next(new AppError('Cannot book tickets for past showtimes', 400));
    }

    // Check if enough seats are available
    if (showtimeDoc.availableSeats < seats.length) {
      return next(
        new AppError(
          `Only ${showtimeDoc.availableSeats} seats available. You requested ${seats.length} seats.`,
          400
        )
      );
    }

    // Try to lock seats in Redis
    const lockResult = await lockSeats(showtime, seats, req.user.id);
    
    if (!lockResult.success) {
      return next(
        new AppError(
          `Some seats are temporarily locked by another user. Please try again.`,
          409
        )
      );
    }

    // Check if seats are already booked in database
    const existingBookings = await Booking.find({
      showtime,
      paymentStatus: { $in: ['pending', 'paid'] },
    });

    const bookedSeats = [];
    existingBookings.forEach((booking) => {
      booking.seats.forEach((seat) => {
        bookedSeats.push(`${seat.row}-${seat.seat}`);
      });
    });

    // Validate requested seats
    for (const seat of seats) {
      const seatKey = `${seat.row}-${seat.seat}`;
      if (bookedSeats.includes(seatKey)) {
        // Release locks if seat is already booked
        await releaseSeats(showtime, seats, req.user.id);
        return next(
          new AppError(
            `Seat ${seat.row}-${seat.seat} is already booked`,
            400
          )
        );
      }
    }

    // Add price to each seat
    const seatsWithPrice = seats.map((seat) => ({
      ...seat,
      price: seat.price || showtimeDoc.price,
    }));

    // Calculate total amount if not provided
    const totalAmount = amount || seatsWithPrice.reduce(
      (sum, seat) => sum + seat.price,
      0
    );

    // Create booking
    const booking = await Booking.create({
      user: req.user.id,
      showtime,
      seats: seatsWithPrice,
      totalAmount,
      paymentMethod,
      paymentStatus: paymentStatus || 'pending',
    });

    // Update available seats
    showtimeDoc.availableSeats -= seats.length;
    await showtimeDoc.save();

    // Release Redis locks when payment is completed
    if (booking.paymentStatus === 'paid') {
      await releaseSeats(
        booking.showtime.toString(),
        booking.seats,
        booking.user.toString()
      );
    }

    // Populate booking details
    const populatedBooking = await Booking.findById(booking._id)
      .populate('user', 'name email phone')
      .populate({
        path: 'showtime',
        populate: {
          path: 'movie theater',
          select: 'title duration poster name location',
        },
      });

    // Send booking confirmation notification (async via queue)
    // Don't await - let it run in background to avoid blocking response
    sendBookingConfirmation(populatedBooking, req.user, { sms: true }).catch(err => {
      console.error('Error sending booking confirmation:', err);
    });

    // Broadcast WebSocket event
    try {
      broadcast({
        type: booking.paymentStatus === 'paid' ? 'BOOKING_PAID' : 'NEW_BOOKING',
        data: populatedBooking,
      });
    } catch (err) {
      console.error('Error broadcasting WebSocket event:', err);
    }

    res.status(201).json({
      status: 'success',
      data: {
        booking: populatedBooking,
        lockExpiresIn: lockResult.expiresIn,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update booking payment status
// @route   PATCH /api/v1/bookings/:id/payment
// @access  Private
exports.updatePaymentStatus = async (req, res, next) => {
  try {
    const { paymentStatus, paymentId } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return next(new AppError('No booking found with that ID', 404));
    }

    // Make sure user is booking owner or admin
    if (
      booking.user.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return next(
        new AppError('You do not have permission to update this booking', 403)
      );
    }

    const oldStatus = booking.paymentStatus;
    booking.paymentStatus = paymentStatus;
    if (paymentId) {
      booking.paymentId = paymentId;
    }

    await booking.save();

    // Release Redis locks when payment is completed or failed
    if (['paid', 'failed', 'cancelled'].includes(paymentStatus)) {
      await releaseSeats(
        booking.showtime.toString(),
        booking.seats,
        booking.user.toString()
      );
    }

    // If payment failed or cancelled, release the seats in database
    if (paymentStatus === 'failed' || paymentStatus === 'cancelled') {
      const showtime = await Showtime.findById(booking.showtime);
      if (showtime) {
        showtime.availableSeats += booking.seats.length;
        await showtime.save();
      }
    }

    // Broadcast if payment is successful
    if (paymentStatus === 'paid' && oldStatus !== 'paid') {
      const populatedBooking = await Booking.findById(booking._id)
        .populate('user', 'name email')
        .populate({
          path: 'showtime',
          populate: { path: 'movie', select: 'title' },
        });
      
      broadcast({
        type: 'BOOKING_PAID',
        data: populatedBooking,
      });
    }


    res.status(200).json({
      status: 'success',
      data: {
        booking,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel booking
// @route   DELETE /api/v1/bookings/:id
// @access  Private
exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return next(new AppError('No booking found with that ID', 404));
    }

    // Make sure user is booking owner or admin
    if (
      booking.user.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return next(
        new AppError('You do not have permission to cancel this booking', 403)
      );
    }

    // Check if booking can be cancelled (e.g., not already cancelled or refunded)
    if (['cancelled', 'refunded'].includes(booking.paymentStatus)) {
      return next(new AppError('This booking is already cancelled', 400));
    }

    // Get showtime to check if it's in the future
    const showtime = await Showtime.findById(booking.showtime);
    if (!showtime) {
      return next(new AppError('Showtime not found', 404));
    }

    // Check if showtime is at least 2 hours in the future
    const hoursUntilShow =
      (new Date(showtime.startTime) - new Date()) / (1000 * 60 * 60);
    if (hoursUntilShow < 2) {
      return next(
        new AppError(
          'Cannot cancel booking less than 2 hours before showtime',
          400
        )
      );
    }

    // Update booking status
    const oldStatus = booking.paymentStatus;
    booking.paymentStatus = 'cancelled';
    booking.cancelledAt = new Date();
    await booking.save();

    // Release Redis locks
    await releaseSeats(
      booking.showtime.toString(),
      booking.seats,
      booking.user.toString()
    );

    // Release seats in database
    showtime.availableSeats += booking.seats.length;
    await showtime.save();

    // Populate booking for notification
    const populatedBooking = await Booking.findById(booking._id)
      .populate({
        path: 'showtime',
        populate: {
          path: 'movie theater',
          select: 'title name location',
        },
      });

    // Send cancellation notification (async via queue)
    await sendCancellationNotification(populatedBooking, req.user, { sms: true });

    // Broadcast cancellation
    if (oldStatus === 'paid') {
      broadcast({
        type: 'BOOKING_CANCELLED',
        data: populatedBooking,
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Booking cancelled successfully',
      data: {
        booking,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get locked seats for a showtime
// @route   GET /api/v1/bookings/showtime/:showtimeId/locked-seats
// @access  Public
exports.getLockedSeats = async (req, res, next) => {
  try {
    const { showtimeId } = req.params;

    // Check if showtime exists
    const showtime = await Showtime.findById(showtimeId);
    if (!showtime) {
      return next(new AppError('No showtime found with that ID', 404));
    }

    // Get locked seats from Redis
    const lockedSeats = await getLockedSeatsForShowtime(showtimeId);

    // Get permanently booked seats from database
    const existingBookings = await Booking.find({
      showtime: showtimeId,
      paymentStatus: { $in: ['pending', 'paid'] },
    });

    const bookedSeats = [];
    existingBookings.forEach((booking) => {
      booking.seats.forEach((seat) => {
        bookedSeats.push({
          row: seat.row,
          seat: seat.seat,
          status: 'booked',
        });
      });
    });

    res.status(200).json({
      status: 'success',
      data: {
        lockedSeats: lockedSeats.map((seat) => ({
          ...seat,
          status: 'locked',
        })),
        bookedSeats,
        totalUnavailable: lockedSeats.length + bookedSeats.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check if specific seats are available
// @route   POST /api/v1/bookings/check-seats
// @access  Public
exports.checkSeatsAvailability = async (req, res, next) => {
  try {
    const { showtimeId, seats } = req.body;

    if (!showtimeId || !seats || !Array.isArray(seats)) {
      return next(
        new AppError('Please provide showtimeId and seats array', 400)
      );
    }

    // Check if showtime exists
    const showtime = await Showtime.findById(showtimeId);
    if (!showtime) {
      return next(new AppError('No showtime found with that ID', 404));
    }

    // Check Redis locks
    const lockStatus = await checkSeatsLocked(showtimeId, seats);

    // Check database bookings
    const existingBookings = await Booking.find({
      showtime: showtimeId,
      paymentStatus: { $in: ['pending', 'paid'] },
    });

    const bookedSeats = [];
    existingBookings.forEach((booking) => {
      booking.seats.forEach((seat) => {
        bookedSeats.push(`${seat.row}-${seat.seat}`);
      });
    });

    const unavailableSeats = [];
    seats.forEach((seat) => {
      const seatKey = `${seat.row}-${seat.seat}`;
      if (bookedSeats.includes(seatKey)) {
        unavailableSeats.push({ ...seat, reason: 'booked' });
      }
    });

    lockStatus.lockedSeats.forEach((seat) => {
      unavailableSeats.push({ ...seat, reason: 'locked' });
    });

    res.status(200).json({
      status: 'success',
      data: {
        available: unavailableSeats.length === 0,
        unavailableSeats,
        availableSeats: lockStatus.availableSeats.filter((seat) => {
          const seatKey = `${seat.row}-${seat.seat}`;
          return !bookedSeats.includes(seatKey);
        }),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lock a single seat
// @route   POST /api/v1/bookings/lock-seat
// @access  Private
exports.lockSeat = async (req, res, next) => {
  try {
    const { showtimeId, row, seat } = req.body;
    const userId = req.user.id;

    if (!showtimeId || !row || !seat) {
      return next(new AppError('Missing showtime, row, or seat information.', 400));
    }

    const lockResult = await lockSeats(showtimeId, [{ row, seat }], userId);

    if (!lockResult.success) {
      return next(new AppError('Seat is already locked or booked.', 409));
    }

    res.status(200).json({
      status: 'success',
      message: 'Seat locked successfully.',
      data: lockResult,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Unlock a single seat
// @route   POST /api/v1/bookings/unlock-seat
// @access  Private
exports.unlockSeat = async (req, res, next) => {
  try {
    const { showtimeId, row, seat } = req.body;
    const userId = req.user.id;

    if (!showtimeId || !row || !seat) {
      return next(new AppError('Missing showtime, row, or seat information.', 400));
    }

    await releaseSeats(showtimeId, [{ row, seat }], userId);

    res.status(200).json({
      status: 'success',
      message: 'Seat unlocked successfully.',
    });
  } catch (error) {
    next(error);
  }
};
