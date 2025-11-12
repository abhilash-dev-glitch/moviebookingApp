const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const Showtime = require('../models/Showtime');
const { stripe, razorpay, paymentConfig } = require('../config/payment');
const AppError = require('../utils/appError');
const {
  generateTransactionId,
  generateOrderId,
  verifyRazorpaySignature,
  formatAmountForGateway,
  formatAmountFromGateway,
  generateReceiptNumber,
  getAvailableGateways,
  isGatewayAvailable,
} = require('../utils/paymentHelpers');
const { sendPaymentConfirmation } = require('../services/notification.service');

// @desc    Get available payment gateways
// @route   GET /api/v1/payments/gateways
// @access  Public
exports.getAvailableGateways = async (req, res, next) => {
  try {
    const gateways = getAvailableGateways();

    res.status(200).json({
      status: 'success',
      data: {
        gateways,
        config: {
          stripe: paymentConfig.stripe.enabled
            ? { currency: paymentConfig.stripe.currency }
            : null,
          razorpay: paymentConfig.razorpay.enabled
            ? { currency: paymentConfig.razorpay.currency }
            : null,
          mock: paymentConfig.mock.enabled ? { enabled: true } : null,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create payment intent/order
// @route   POST /api/v1/payments/create
// @access  Private
exports.createPayment = async (req, res, next) => {
  try {
    const { bookingId, paymentGateway, paymentMethod } = req.body;

    // Validate payment gateway
    if (!isGatewayAvailable(paymentGateway)) {
      return next(
        new AppError(`Payment gateway ${paymentGateway} is not available`, 400)
      );
    }

    // Get booking details
    const booking = await Booking.findById(bookingId).populate('showtime');

    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }

    // Verify booking belongs to user
    if (booking.user.toString() !== req.user.id) {
      return next(
        new AppError('You do not have permission to pay for this booking', 403)
      );
    }

    // Check if booking is already paid
    if (booking.paymentStatus === 'paid') {
      return next(new AppError('This booking is already paid', 400));
    }

    // Check if showtime is still valid
    if (new Date(booking.showtime.startTime) < new Date()) {
      return next(new AppError('Cannot pay for past showtimes', 400));
    }

    const amount = booking.totalAmount;
    const transactionId = generateTransactionId();

    let paymentData = {
      booking: bookingId,
      user: req.user.id,
      amount,
      paymentGateway,
      paymentMethod,
      transactionId,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    };

    let gatewayResponse;

    // Process payment based on gateway
    switch (paymentGateway) {
      case 'stripe':
        gatewayResponse = await createStripePayment(amount, booking, transactionId);
        paymentData.currency = paymentConfig.stripe.currency.toUpperCase();
        paymentData.gatewayPaymentId = gatewayResponse.id;
        paymentData.gatewayOrderId = gatewayResponse.id;
        break;

      case 'razorpay':
        gatewayResponse = await createRazorpayOrder(amount, booking, transactionId);
        paymentData.currency = paymentConfig.razorpay.currency.toUpperCase();
        paymentData.gatewayOrderId = gatewayResponse.id;
        break;

      case 'mock':
        gatewayResponse = await createMockPayment(amount, booking, transactionId);
        paymentData.currency = 'USD';
        paymentData.gatewayPaymentId = gatewayResponse.paymentId;
        paymentData.gatewayOrderId = gatewayResponse.orderId;
        break;

      default:
        return next(new AppError('Invalid payment gateway', 400));
    }

    // Create payment record
    const payment = await Payment.create(paymentData);

    res.status(201).json({
      status: 'success',
      data: {
        payment,
        gatewayResponse,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify and complete payment
// @route   POST /api/v1/payments/verify
// @access  Private
exports.verifyPayment = async (req, res, next) => {
  try {
    const { paymentId, gatewayPaymentId, gatewayOrderId, signature } = req.body;

    const payment = await Payment.findById(paymentId).populate('booking');

    if (!payment) {
      return next(new AppError('Payment not found', 404));
    }

    // Verify payment belongs to user
    if (payment.user.toString() !== req.user.id) {
      return next(
        new AppError('You do not have permission to verify this payment', 403)
      );
    }

    let verified = false;

    // Verify based on gateway
    switch (payment.paymentGateway) {
      case 'stripe':
        verified = await verifyStripePayment(gatewayPaymentId);
        break;

      case 'razorpay':
        verified = verifyRazorpaySignature(
          gatewayOrderId,
          gatewayPaymentId,
          signature,
          process.env.RAZORPAY_KEY_SECRET
        );
        break;

      case 'mock':
        verified = true; // Mock payment always succeeds
        break;

      default:
        return next(new AppError('Invalid payment gateway', 400));
    }

    if (!verified) {
      payment.status = 'failed';
      payment.errorMessage = 'Payment verification failed';
      await payment.save();

      return next(new AppError('Payment verification failed', 400));
    }

    // Update payment status
    payment.status = 'completed';
    payment.gatewayPaymentId = gatewayPaymentId;
    payment.completedAt = new Date();
    await payment.save();

    // Update booking status
    const booking = await Booking.findById(payment.booking)
      .populate('user', 'name email phone')
      .populate({
        path: 'showtime',
        populate: {
          path: 'movie theater',
          select: 'title name location',
        },
      });
    booking.paymentStatus = 'paid';
    booking.paymentId = gatewayPaymentId;
    await booking.save();

    // Send payment confirmation notification (async via queue)
    await sendPaymentConfirmation(payment, booking, booking.user, { sms: false });

    res.status(200).json({
      status: 'success',
      message: 'Payment verified successfully',
      data: {
        payment,
        booking,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment details
// @route   GET /api/v1/payments/:id
// @access  Private
exports.getPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('user', 'name email')
      .populate({
        path: 'booking',
        populate: {
          path: 'showtime',
          populate: {
            path: 'movie theater',
          },
        },
      });

    if (!payment) {
      return next(new AppError('Payment not found', 404));
    }

    // Check permission
    if (
      payment.user._id.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return next(
        new AppError('You do not have permission to view this payment', 403)
      );
    }

    res.status(200).json({
      status: 'success',
      data: {
        payment,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user payments
// @route   GET /api/v1/payments/my-payments
// @access  Private
exports.getMyPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ user: req.user.id })
      .populate({
        path: 'booking',
        populate: {
          path: 'showtime',
          populate: {
            path: 'movie theater',
            select: 'title name',
          },
        },
      })
      .sort('-createdAt');

    res.status(200).json({
      status: 'success',
      results: payments.length,
      data: {
        payments,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Initiate refund
// @route   POST /api/v1/payments/:id/refund
// @access  Private
exports.initiateRefund = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const payment = await Payment.findById(req.params.id).populate({
      path: 'booking',
      populate: {
        path: 'showtime',
      },
    });

    if (!payment) {
      return next(new AppError('Payment not found', 404));
    }

    // Check permission
    if (
      payment.user.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return next(
        new AppError('You do not have permission to refund this payment', 403)
      );
    }

    // Check if payment can be refunded
    if (!payment.canRefund()) {
      return next(new AppError('This payment cannot be refunded', 400));
    }

    // Calculate refund amount
    const refundAmount = payment.calculateRefundAmount(payment.booking.showtime);

    if (refundAmount === 0) {
      return next(
        new AppError('No refund available within 2 hours of showtime', 400)
      );
    }

    let refundResponse;

    // Process refund based on gateway
    switch (payment.paymentGateway) {
      case 'stripe':
        refundResponse = await processStripeRefund(
          payment.gatewayPaymentId,
          refundAmount
        );
        break;

      case 'razorpay':
        refundResponse = await processRazorpayRefund(
          payment.gatewayPaymentId,
          refundAmount
        );
        break;

      case 'mock':
        refundResponse = await processMockRefund(payment.gatewayPaymentId);
        break;

      default:
        return next(new AppError('Invalid payment gateway', 400));
    }

    // Update payment with refund details
    payment.refund = {
      refundId: refundResponse.id,
      refundAmount,
      refundDate: new Date(),
      refundReason: reason,
      refundStatus: 'processing',
    };
    payment.status = 'refunded';
    await payment.save();

    // Update booking status
    const booking = await Booking.findById(payment.booking._id);
    booking.paymentStatus = 'refunded';
    await booking.save();

    res.status(200).json({
      status: 'success',
      message: 'Refund initiated successfully',
      data: {
        payment,
        refundAmount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all payments (Admin)
// @route   GET /api/v1/payments
// @access  Private/Admin
exports.getAllPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find()
      .populate('user', 'name email')
      .populate({
        path: 'booking',
        populate: {
          path: 'showtime',
          populate: {
            path: 'movie theater',
            select: 'title name',
          },
        },
      })
      .sort('-createdAt');

    res.status(200).json({
      status: 'success',
      results: payments.length,
      data: {
        payments,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Helper functions for payment gateways

// Stripe payment creation
async function createStripePayment(amount, booking, transactionId) {
  if (!stripe) {
    throw new AppError('Stripe is not configured', 500);
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: formatAmountForGateway(amount, paymentConfig.stripe.currency),
    currency: paymentConfig.stripe.currency,
    metadata: {
      bookingId: booking._id.toString(),
      transactionId,
    },
    description: `Movie ticket booking - ${booking._id}`,
  });

  return {
    id: paymentIntent.id,
    clientSecret: paymentIntent.client_secret,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
  };
}

// Razorpay order creation
async function createRazorpayOrder(amount, booking, transactionId) {
  if (!razorpay) {
    throw new AppError('Razorpay is not configured', 500);
  }

  const order = await razorpay.orders.create({
    amount: formatAmountForGateway(amount, paymentConfig.razorpay.currency),
    currency: paymentConfig.razorpay.currency,
    receipt: generateReceiptNumber(),
    notes: {
      bookingId: booking._id.toString(),
      transactionId,
    },
  });

  return {
    id: order.id,
    amount: order.amount,
    currency: order.currency,
    key: process.env.RAZORPAY_KEY_ID,
  };
}

// Mock payment creation (for testing)
async function createMockPayment(amount, booking, transactionId) {
  return {
    orderId: generateOrderId(),
    paymentId: `mock_${transactionId}`,
    amount,
    currency: 'USD',
    status: 'created',
  };
}

// Stripe payment verification
async function verifyStripePayment(paymentIntentId) {
  if (!stripe) return false;

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent.status === 'succeeded';
  } catch (error) {
    return false;
  }
}

// Stripe refund processing
async function processStripeRefund(paymentIntentId, amount) {
  if (!stripe) {
    throw new AppError('Stripe is not configured', 500);
  }

  const refund = await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount: formatAmountForGateway(amount, paymentConfig.stripe.currency),
  });

  return {
    id: refund.id,
    status: refund.status,
    amount: refund.amount,
  };
}

// Razorpay refund processing
async function processRazorpayRefund(paymentId, amount) {
  if (!razorpay) {
    throw new AppError('Razorpay is not configured', 500);
  }

  const refund = await razorpay.payments.refund(paymentId, {
    amount: formatAmountForGateway(amount, paymentConfig.razorpay.currency),
  });

  return {
    id: refund.id,
    status: refund.status,
    amount: refund.amount,
  };
}

// Mock refund processing
async function processMockRefund(paymentId) {
  return {
    id: `refund_${paymentId}`,
    status: 'succeeded',
    amount: 0,
  };
}
