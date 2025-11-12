const Stripe = require('stripe');
const Razorpay = require('razorpay');

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// Initialize Razorpay
const razorpay =
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    ? new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      })
    : null;

// Payment gateway configuration
const paymentConfig = {
  stripe: {
    enabled: !!stripe,
    currency: process.env.STRIPE_CURRENCY || 'usd',
    successUrl: process.env.STRIPE_SUCCESS_URL || 'http://localhost:3000/payment/success',
    cancelUrl: process.env.STRIPE_CANCEL_URL || 'http://localhost:3000/payment/cancel',
  },
  razorpay: {
    enabled: !!razorpay,
    currency: process.env.RAZORPAY_CURRENCY || 'INR',
  },
  // Mock payment for testing
  mock: {
    enabled: process.env.ENABLE_MOCK_PAYMENT === 'true' || process.env.NODE_ENV === 'development',
  },
};

module.exports = {
  stripe,
  razorpay,
  paymentConfig,
};
