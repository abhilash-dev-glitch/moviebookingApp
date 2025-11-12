const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

// Generate unique transaction ID
exports.generateTransactionId = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `TXN_${timestamp}_${randomStr}`.toUpperCase();
};

// Generate order ID for payment gateways
exports.generateOrderId = () => {
  return `ORD_${uuidv4().replace(/-/g, '').substring(0, 16).toUpperCase()}`;
};

// Verify Razorpay signature
exports.verifyRazorpaySignature = (orderId, paymentId, signature, secret) => {
  const body = orderId + '|' + paymentId;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body.toString())
    .digest('hex');
  
  return expectedSignature === signature;
};

// Verify Stripe webhook signature
exports.verifyStripeSignature = (payload, signature, secret) => {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    return stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (err) {
    return null;
  }
};

// Format amount for payment gateway (convert to smallest currency unit)
exports.formatAmountForGateway = (amount, currency = 'USD') => {
  // Most currencies use 2 decimal places (cents)
  // Some currencies like JPY don't use decimal places
  const zeroCurrencies = ['JPY', 'KRW', 'VND'];
  
  if (zeroCurrencies.includes(currency.toUpperCase())) {
    return Math.round(amount);
  }
  
  return Math.round(amount * 100);
};

// Format amount from gateway (convert from smallest currency unit)
exports.formatAmountFromGateway = (amount, currency = 'USD') => {
  const zeroCurrencies = ['JPY', 'KRW', 'VND'];
  
  if (zeroCurrencies.includes(currency.toUpperCase())) {
    return amount;
  }
  
  return amount / 100;
};

// Calculate platform fee (if applicable)
exports.calculatePlatformFee = (amount, feePercentage = 2.5) => {
  return Math.round((amount * feePercentage) / 100);
};

// Mask card number
exports.maskCardNumber = (cardNumber) => {
  if (!cardNumber) return '';
  const last4 = cardNumber.slice(-4);
  return `****${last4}`;
};

// Get payment method display name
exports.getPaymentMethodDisplay = (method) => {
  const displayNames = {
    credit_card: 'Credit Card',
    debit_card: 'Debit Card',
    net_banking: 'Net Banking',
    upi: 'UPI',
    wallet: 'Wallet',
  };
  return displayNames[method] || method;
};

// Validate payment amount
exports.validatePaymentAmount = (amount, minAmount = 1, maxAmount = 100000) => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return { valid: false, message: 'Invalid amount' };
  }
  
  if (amount < minAmount) {
    return { valid: false, message: `Amount must be at least ${minAmount}` };
  }
  
  if (amount > maxAmount) {
    return { valid: false, message: `Amount cannot exceed ${maxAmount}` };
  }
  
  return { valid: true };
};

// Generate payment receipt
exports.generateReceiptNumber = () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  return `RCP${year}${month}${day}${random}`;
};

// Calculate refund processing time (in days)
exports.getRefundProcessingTime = (paymentGateway) => {
  const processingTimes = {
    stripe: '5-10',
    razorpay: '5-7',
    mock: '0',
  };
  return processingTimes[paymentGateway] || '7-14';
};

// Format currency
exports.formatCurrency = (amount, currency = 'USD') => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  });
  return formatter.format(amount);
};

// Check if payment gateway is available
exports.isGatewayAvailable = (gateway) => {
  const { paymentConfig } = require('../config/payment');
  return paymentConfig[gateway]?.enabled || false;
};

// Get available payment gateways
exports.getAvailableGateways = () => {
  const { paymentConfig } = require('../config/payment');
  const gateways = [];
  
  if (paymentConfig.stripe.enabled) gateways.push('stripe');
  if (paymentConfig.razorpay.enabled) gateways.push('razorpay');
  if (paymentConfig.mock.enabled) gateways.push('mock');
  
  return gateways;
};
