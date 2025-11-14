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
        row: String,
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
      enum: ['card', 'credit_card', 'debit_card', 'net_banking', 'upi', 'wallet'],
      required: [true, 'Please provide payment method'],
    },
    bookingDate: {
      type: Date,
      default: Date.now,
    },
    cancelledAt: {
      type: Date,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

bookingSchema.index({ user: 1, showtime: 1 });

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

const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
module.exports = Booking;
