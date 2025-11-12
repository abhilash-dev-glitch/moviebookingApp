const express = require('express');
const {
  handleStripeWebhook,
  handleRazorpayWebhook,
} = require('../controllers/webhook.controller');

const router = express.Router();

// Webhook routes (no authentication required - verified by signature)
// Note: These routes need raw body, not JSON parsed body
router.post('/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);
router.post('/razorpay', handleRazorpayWebhook);

module.exports = router;
