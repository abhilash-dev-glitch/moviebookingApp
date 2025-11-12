const mongoose = require('mongoose');

const theaterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A theater must have a name'],
      trim: true,
    },
    location: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    city: {
      type: String,
      required: [true, 'Please specify the city'],
    },
    screens: [
      {
        name: String,
        capacity: Number,
        seatLayout: [[Number]], // 2D array representing seat layout
      },
    ],
    facilities: [String],
    contact: {
      phone: String,
      email: {
        type: String,
        validate: {
          validator: function (v) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
          },
          message: (props) => `${props.value} is not a valid email!`,
        },
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Index for geospatial queries
theaterSchema.index({ location: '2dsphere' });

// Virtual populate showtimes
theaterSchema.virtual('showtimes', {
  ref: 'Showtime',
  foreignField: 'theater',
  localField: '_id',
});

const Theater = mongoose.model('Theater', theaterSchema);
module.exports = Theater;
