const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Booking must belong to a user'],
    },
    showtime: {
      type: mongoose.Schema.ObjectId,
      ref: 'Showtime',
      required: [true, 'Booking must be for a showtime'],
    },
    seats: [
      {
        row: Number,
        seat: Number,
        price: Number,
      },
    ],
    totalAmount: {
      type: Number,
      required: [true, 'Booking must have a total amount'],
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'cancelled', 'refunded'],
      default: 'pending',
    },
    paymentId: String,
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'debit_card', 'net_banking', 'upi', 'wallet'],
      required: [true, 'Please provide payment method'],
    },
    bookingDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Index for better query performance
bookingSchema.index({ user: 1, showtime: 1 });

// Virtual populate for user and showtime details
bookingSchema.virtual('userDetails', {
  ref: 'User',
  localField: 'user',
  foreignField: '_id',
  justOne: true,
  select: 'name email phone',
});

bookingSchema.virtual('showtimeDetails', {
  ref: 'Showtime',
  localField: 'showtime',
  foreignField: '_id',
  justOne: true,
  populate: {
    path: 'movie theater',
    select: 'title duration poster name location.city',
  },
});

// Pre-save hook to calculate total amount
bookingSchema.pre('save', function (next) {
  if (this.isModified('seats') && this.seats.length > 0) {
    this.totalAmount = this.seats.reduce((sum, seat) => sum + seat.price, 0);
  }
  next();
});

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;
