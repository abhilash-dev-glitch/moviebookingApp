const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const { stripe } = require('../config/payment');
const { verifyRazorpaySignature } = require('../utils/paymentHelpers');
const AppError = require('../utils/appError');

// @desc    Handle Stripe webhook
// @route   POST /api/v1/webhooks/stripe
// @access  Public (Stripe)
exports.handleStripeWebhook = async (req, res, next) => {
  try {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return res.status(400).send('Webhook secret not configured');
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object);
        break;

      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
};

// @desc    Handle Razorpay webhook
// @route   POST /api/v1/webhooks/razorpay
// @access  Public (Razorpay)
exports.handleRazorpayWebhook = async (req, res, next) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    if (!webhookSecret) {
      return res.status(400).send('Webhook secret not configured');
    }

    // Verify webhook signature
    const body = JSON.stringify(req.body);
    const expectedSignature = require('crypto')
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).send('Invalid signature');
    }

    const event = req.body.event;
    const payload = req.body.payload;

    // Handle the event
    switch (event) {
      case 'payment.captured':
        await handleRazorpayPaymentCaptured(payload.payment.entity);
        break;

      case 'payment.failed':
        await handleRazorpayPaymentFailed(payload.payment.entity);
        break;

      case 'refund.processed':
        await handleRazorpayRefundProcessed(payload.refund.entity);
        break;

      default:
        console.log(`Unhandled Razorpay event type ${event}`);
    }

    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Razorpay webhook error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
};

// Helper functions for Stripe events

async function handlePaymentIntentSucceeded(paymentIntent) {
  try {
    const payment = await Payment.findOne({
      gatewayPaymentId: paymentIntent.id,
    });

    if (!payment) {
      console.error('Payment not found for PaymentIntent:', paymentIntent.id);
      return;
    }

    // Update payment status
    payment.status = 'completed';
    payment.completedAt = new Date();
    
    // Store payment details
    if (paymentIntent.charges?.data[0]) {
      const charge = paymentIntent.charges.data[0];
      payment.paymentDetails = {
        cardLast4: charge.payment_method_details?.card?.last4,
        cardBrand: charge.payment_method_details?.card?.brand,
      };
    }

    await payment.save();

    // Update booking
    const booking = await Booking.findById(payment.booking);
    if (booking) {
      booking.paymentStatus = 'paid';
      booking.paymentId = paymentIntent.id;
      await booking.save();
    }

    console.log('Payment succeeded:', payment.transactionId);
  } catch (error) {
    console.error('Error handling payment intent succeeded:', error);
  }
}

async function handlePaymentIntentFailed(paymentIntent) {
  try {
    const payment = await Payment.findOne({
      gatewayPaymentId: paymentIntent.id,
    });

    if (!payment) {
      console.error('Payment not found for PaymentIntent:', paymentIntent.id);
      return;
    }

    payment.status = 'failed';
    payment.failedAt = new Date();
    payment.errorMessage = paymentIntent.last_payment_error?.message || 'Payment failed';
    payment.errorCode = paymentIntent.last_payment_error?.code;
    await payment.save();

    // Update booking
    const booking = await Booking.findById(payment.booking);
    if (booking) {
      booking.paymentStatus = 'failed';
      await booking.save();
    }

    console.log('Payment failed:', payment.transactionId);
  } catch (error) {
    console.error('Error handling payment intent failed:', error);
  }
}

async function handleChargeRefunded(charge) {
  try {
    const payment = await Payment.findOne({
      gatewayPaymentId: charge.payment_intent,
    });

    if (!payment) {
      console.error('Payment not found for charge:', charge.id);
      return;
    }

    if (payment.refund) {
      payment.refund.refundStatus = 'completed';
      payment.status = 'refunded';
      await payment.save();
    }

    console.log('Refund processed:', payment.transactionId);
  } catch (error) {
    console.error('Error handling charge refunded:', error);
  }
}

async function handlePaymentIntentCanceled(paymentIntent) {
  try {
    const payment = await Payment.findOne({
      gatewayPaymentId: paymentIntent.id,
    });

    if (!payment) {
      console.error('Payment not found for PaymentIntent:', paymentIntent.id);
      return;
    }

    payment.status = 'cancelled';
    await payment.save();

    // Update booking
    const booking = await Booking.findById(payment.booking);
    if (booking) {
      booking.paymentStatus = 'cancelled';
      await booking.save();
    }

    console.log('Payment cancelled:', payment.transactionId);
  } catch (error) {
    console.error('Error handling payment intent canceled:', error);
  }
}

// Helper functions for Razorpay events

async function handleRazorpayPaymentCaptured(paymentEntity) {
  try {
    const payment = await Payment.findOne({
      gatewayPaymentId: paymentEntity.id,
    });

    if (!payment) {
      console.error('Payment not found for Razorpay payment:', paymentEntity.id);
      return;
    }

    payment.status = 'completed';
    payment.completedAt = new Date();
    
    // Store payment details
    if (paymentEntity.method === 'card') {
      payment.paymentDetails = {
        cardLast4: paymentEntity.card?.last4,
        cardBrand: paymentEntity.card?.network,
      };
    } else if (paymentEntity.method === 'upi') {
      payment.paymentDetails = {
        upiId: paymentEntity.vpa,
      };
    }

    await payment.save();

    // Update booking
    const booking = await Booking.findById(payment.booking);
    if (booking) {
      booking.paymentStatus = 'paid';
      booking.paymentId = paymentEntity.id;
      await booking.save();
    }

    console.log('Razorpay payment captured:', payment.transactionId);
  } catch (error) {
    console.error('Error handling Razorpay payment captured:', error);
  }
}

async function handleRazorpayPaymentFailed(paymentEntity) {
  try {
    const payment = await Payment.findOne({
      gatewayOrderId: paymentEntity.order_id,
    });

    if (!payment) {
      console.error('Payment not found for Razorpay order:', paymentEntity.order_id);
      return;
    }

    payment.status = 'failed';
    payment.failedAt = new Date();
    payment.errorMessage = paymentEntity.error_description || 'Payment failed';
    payment.errorCode = paymentEntity.error_code;
    await payment.save();

    // Update booking
    const booking = await Booking.findById(payment.booking);
    if (booking) {
      booking.paymentStatus = 'failed';
      await booking.save();
    }

    console.log('Razorpay payment failed:', payment.transactionId);
  } catch (error) {
    console.error('Error handling Razorpay payment failed:', error);
  }
}

async function handleRazorpayRefundProcessed(refundEntity) {
  try {
    const payment = await Payment.findOne({
      'refund.refundId': refundEntity.id,
    });

    if (!payment) {
      console.error('Payment not found for refund:', refundEntity.id);
      return;
    }

    if (payment.refund) {
      payment.refund.refundStatus = 'completed';
      payment.status = 'refunded';
      await payment.save();
    }

    console.log('Razorpay refund processed:', payment.transactionId);
  } catch (error) {
    console.error('Error handling Razorpay refund processed:', error);
  }
}
