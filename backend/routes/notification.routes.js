const express = require('express');
const router = express.Router();
const {
  sendEmail,
  sendSMS,
  sendBulkEmail,
  sendBulkSMS,
  getNotificationStatus,
  testEmailConnection,
  testSMSConnection,
} = require('../controllers/notification.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(protect);

// @route   POST /api/v1/notifications/email
// @desc    Send email notification
// @access  Private
router.post('/email', sendEmail);

// @route   POST /api/v1/notifications/sms
// @desc    Send SMS notification
// @access  Private
router.post('/sms', sendSMS);

// @route   POST /api/v1/notifications/bulk-email
// @desc    Send bulk email notifications
// @access  Private/Admin
router.post('/bulk-email', restrictTo('admin'), sendBulkEmail);

// @route   POST /api/v1/notifications/bulk-sms
// @desc    Send bulk SMS notifications
// @access  Private/Admin
router.post('/bulk-sms', restrictTo('admin'), sendBulkSMS);

// @route   GET /api/v1/notifications/status
// @desc    Get notification service status
// @access  Private
router.get('/status', getNotificationStatus);

// @route   GET /api/v1/notifications/test-email
// @desc    Test email connection
// @access  Private/Admin
router.get('/test-email', restrictTo('admin'), testEmailConnection);

// @route   GET /api/v1/notifications/test-sms
// @desc    Test SMS connection
// @access  Private/Admin
router.get('/test-sms', restrictTo('admin'), testSMSConnection);

module.exports = router;
