const express = require('express');
const {
  getAvailableGateways,
  createPayment,
  verifyPayment,
  getPayment,
  getMyPayments,
  initiateRefund,
  getAllPayments,
} = require('../controllers/payment.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.get('/gateways', getAvailableGateways);

// Protected routes
router.use(protect);

router.post('/create', createPayment);
router.post('/verify', verifyPayment);
router.get('/my-payments', getMyPayments);
router.get('/:id', getPayment);
router.post('/:id/refund', initiateRefund);

// Admin routes
router.get('/', restrictTo('admin'), getAllPayments);

module.exports = router;
