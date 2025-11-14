const Review = require('../models/Review');
const AppError = require('../utils/appError');

// GET /api/v1/movies/:movieId/reviews
exports.getMovieReviews = async (req, res, next) => {
  try {
    const { movieId } = req.params;
    const reviews = await Review.find({ movie: movieId })
      .populate({ path: 'user', select: 'name role' })
      .sort('-createdAt');

    res.status(200).json({
      status: 'success',
      results: reviews.length,
      data: { reviews },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/movies/:movieId/reviews
exports.createReview = async (req, res, next) => {
  try {
    const { movieId } = req.params;
    const userId = req.user.id;
    const { rating, comment } = req.body;

    if (rating == null) {
      return next(new AppError('Rating is required', 400));
    }

    // Allow all authenticated users to submit reviews
    // No booking requirement - users can review movies they've watched anywhere
    
    let review;
    try {
      review = await Review.create({ movie: movieId, user: userId, rating, comment });
    } catch (e) {
      if (e && e.code === 11000) {
        return next(new AppError('You have already submitted a review for this movie', 400));
      }
      throw e;
    }

    // Populate user in response
    await review.populate({ path: 'user', select: 'name role' });

    res.status(201).json({
      status: 'success',
      data: { review },
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/v1/reviews/:id
exports.updateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const review = await Review.findById(id);
    if (!review) return next(new AppError('Review not found', 404));

    const isOwner = review.user.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return next(new AppError('Not authorized to update this review', 403));

    if (rating != null) review.rating = rating;
    if (comment != null) review.comment = comment;
    await review.save();

    await review.populate({ path: 'user', select: 'name role' });

    res.status(200).json({ status: 'success', data: { review } });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/reviews/:id
exports.deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);
    if (!review) return next(new AppError('Review not found', 404));

    const isOwner = review.user.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return next(new AppError('Not authorized to delete this review', 403));

    await Review.findByIdAndDelete(id);

    res.status(204).json({ status: 'success', data: null });
  } catch (err) {
    next(err);
  }
};
