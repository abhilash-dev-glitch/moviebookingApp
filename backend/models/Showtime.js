const mongoose = require('mongoose');

const showtimeSchema = new mongoose.Schema(
  {
    movie: {
      type: mongoose.Schema.ObjectId,
      ref: 'Movie',
      required: [true, 'Showtime must belong to a movie'],
    },
    theater: {
      type: mongoose.Schema.ObjectId,
      ref: 'Theater',
      required: [true, 'Showtime must belong to a theater'],
    },
    screen: {
      type: String,
      required: [true, 'Please specify the screen'],
    },
    startTime: {
      type: Date,
      required: [true, 'Please provide show start time'],
    },
    endTime: {
      type: Date,
      required: [true, 'Please provide show end time'],
    },
    price: {
      type: Number,
      required: [true, 'Please provide ticket price'],
    },
    availableSeats: {
      type: Number,
      required: [true, 'Please specify number of available seats'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Index for efficient querying
showtimeSchema.index({ movie: 1, theater: 1, startTime: 1 }, { unique: true });

// Virtual populate bookings
showtimeSchema.virtual('bookings', {
  ref: 'Booking',
  foreignField: 'showtime',
  localField: '_id',
});

const Showtime = mongoose.model('Showtime', showtimeSchema);
module.exports = Showtime;
