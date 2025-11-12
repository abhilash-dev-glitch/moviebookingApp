const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.ObjectId,
      ref: 'Booking',
      required: [true, 'Payment must belong to a booking'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Payment must belong to a user'],
    },
    amount: {
      type: Number,
      required: [true, 'Payment must have an amount'],
    },
    currency: {
      type: String,
      required: [true, 'Payment must have a currency'],
      default: 'USD',
    },
    paymentGateway: {
      type: String,
      enum: ['stripe', 'razorpay', 'mock'],
      required: [true, 'Payment gateway is required'],
    },
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'debit_card', 'net_banking', 'upi', 'wallet'],
      required: [true, 'Payment method is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'],
      default: 'pending',
    },
    // Gateway-specific IDs
    transactionId: {
      type: String,
      unique: true,
      sparse: true,
    },
    gatewayPaymentId: {
      type: String,
      sparse: true,
    },
    gatewayOrderId: {
      type: String,
      sparse: true,
    },
    // Payment details
    paymentDetails: {
      cardLast4: String,
      cardBrand: String,
      bankName: String,
      upiId: String,
      walletName: String,
    },
    // Refund information
    refund: {
      refundId: String,
      refundAmount: Number,
      refundDate: Date,
      refundReason: String,
      refundStatus: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
      },
    },
    // Error tracking
    errorMessage: String,
    errorCode: String,
    // Metadata
    metadata: {
      ipAddress: String,
      userAgent: String,
      deviceInfo: String,
    },
    // Timestamps
    initiatedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: Date,
    failedAt: Date,
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Index for better query performance
paymentSchema.index({ booking: 1, user: 1 });
// transactionId index is already created by unique: true option
paymentSchema.index({ status: 1, createdAt: -1 });

// Virtual for booking details
paymentSchema.virtual('bookingDetails', {
  ref: 'Booking',
  localField: 'booking',
  foreignField: '_id',
  justOne: true,
});

// Pre-save middleware to set completed/failed timestamps
paymentSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    if (this.status === 'completed' && !this.completedAt) {
      this.completedAt = new Date();
    } else if (this.status === 'failed' && !this.failedAt) {
      this.failedAt = new Date();
    }
  }
  next();
});

// Method to check if payment can be refunded
paymentSchema.methods.canRefund = function () {
  return (
    this.status === 'completed' &&
    (!this.refund || this.refund.refundStatus !== 'completed')
  );
};

// Method to calculate refund amount based on cancellation time
paymentSchema.methods.calculateRefundAmount = function (showtime) {
  if (!this.canRefund()) return 0;

  const hoursUntilShow = (new Date(showtime.startTime) - new Date()) / (1000 * 60 * 60);
  
  // Refund policy
  if (hoursUntilShow >= 24) {
    return this.amount; // 100% refund
  } else if (hoursUntilShow >= 12) {
    return this.amount * 0.75; // 75% refund
  } else if (hoursUntilShow >= 2) {
    return this.amount * 0.5; // 50% refund
  }
  
  return 0; // No refund within 2 hours
};

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;
