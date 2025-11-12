const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'A movie must have a title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'A movie must have a description'],
    },
    duration: {
      type: Number, // in minutes
      required: [true, 'A movie must have a duration'],
    },
    genre: {
      type: [String],
      required: [true, 'A movie must have at least one genre'],
    },
    releaseDate: {
      type: Date,
      required: [true, 'A movie must have a release date'],
    },
    director: {
      type: String,
      required: [true, 'A movie must have a director'],
    },
    cast: [String],
    language: {
      type: String,
      required: [true, 'Please specify the movie language'],
    },
    rating: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },
    poster: {
      type: String,
      default: null,
    },
    posterPublicId: {
      type: String,
      default: null,
    },
    trailer: String,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

const Movie = mongoose.model('Movie', movieSchema);
module.exports = Movie;
