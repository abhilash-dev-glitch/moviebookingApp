const mailer = require('../utils/mailer');
const smsService = require('../services/sms.service');
const AppError = require('../utils/appError');
const { validationResult } = require('express-validator');

// @desc    Send email notification
// @route   POST /api/v1/notifications/email
// @access  Private
exports.sendEmail = async (req, res, next) => {
  try {
    const { to, subject, message, html, template, data, priority } = req.body;

    // Validate required fields
    if (!to || !subject) {
      return next(new AppError('Recipient email and subject are required', 400));
    }

    if (!message && !html && !template) {
      return next(
        new AppError('Either message, html, or template must be provided', 400)
      );
    }

    // Prepare email options
    const emailOptions = {
      to,
      subject,
      priority: priority || 'normal',
    };

    // Use template if provided
    if (template && data) {
      emailOptions.template = template;
      emailOptions.data = data;
    } else if (html) {
      emailOptions.html = html;
    } else {
      emailOptions.html = `<p>${message}</p>`;
      emailOptions.text = message;
    }

    // Send email
    const result = await mailer.send(emailOptions);

    if (!result.success) {
      return next(new AppError(`Failed to send email: ${result.error}`, 500));
    }

    res.status(200).json({
      status: 'success',
      message: 'Email sent successfully',
      data: {
        messageId: result.messageId,
        to,
        subject,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send SMS notification
// @route   POST /api/v1/notifications/sms
// @access  Private
exports.sendSMS = async (req, res, next) => {
  try {
    const { to, message } = req.body;

    // Validate required fields
    if (!to || !message) {
      return next(new AppError('Phone number and message are required', 400));
    }

    // Validate phone number format (basic check)
    if (!to.match(/^\+?[1-9]\d{1,14}$/)) {
      return next(
        new AppError(
          'Invalid phone number format. Use international format: +1234567890',
          400
        )
      );
    }

    // Check message length (SMS limit is 160 characters)
    if (message.length > 160) {
      console.warn(
        `⚠️  SMS message exceeds 160 characters (${message.length}). May be split into multiple messages.`
      );
    }

    // Send SMS
    const result = await smsService.sendSMS(to, message);

    if (!result.success) {
      return next(new AppError(`Failed to send SMS: ${result.error}`, 500));
    }

    res.status(200).json({
      status: 'success',
      message: 'SMS sent successfully',
      data: {
        sid: result.sid,
        to,
        messageLength: message.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send bulk email notifications
// @route   POST /api/v1/notifications/bulk-email
// @access  Private/Admin
exports.sendBulkEmail = async (req, res, next) => {
  try {
    const { recipients, subject, template, commonData } = req.body;

    // Validate required fields
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return next(
        new AppError('Recipients array is required and must not be empty', 400)
      );
    }

    if (!subject || !template) {
      return next(new AppError('Subject and template are required', 400));
    }

    // Validate recipients format
    for (const recipient of recipients) {
      if (!recipient.email) {
        return next(
          new AppError('Each recipient must have an email field', 400)
        );
      }
    }

    // Limit bulk send to prevent abuse
    if (recipients.length > 100) {
      return next(
        new AppError('Maximum 100 recipients allowed per bulk send', 400)
      );
    }

    // Send bulk emails
    const results = await mailer.sendBulk(
      recipients,
      subject,
      template,
      commonData || {}
    );

    // Count successes and failures
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    res.status(200).json({
      status: 'success',
      message: `Bulk email completed: ${successful} sent, ${failed} failed`,
      data: {
        total: recipients.length,
        successful,
        failed,
        results,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send bulk SMS notifications
// @route   POST /api/v1/notifications/bulk-sms
// @access  Private/Admin
exports.sendBulkSMS = async (req, res, next) => {
  try {
    const { recipients } = req.body;

    // Validate required fields
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return next(
        new AppError('Recipients array is required and must not be empty', 400)
      );
    }

    // Validate recipients format
    for (const recipient of recipients) {
      if (!recipient.phone || !recipient.message) {
        return next(
          new AppError(
            'Each recipient must have phone and message fields',
            400
          )
        );
      }
    }

    // Limit bulk send to prevent abuse
    if (recipients.length > 50) {
      return next(
        new AppError('Maximum 50 recipients allowed per bulk SMS send', 400)
      );
    }

    // Send bulk SMS
    const results = [];
    for (const recipient of recipients) {
      const result = await smsService.sendSMS(
        recipient.phone,
        recipient.message
      );

      results.push({
        phone: recipient.phone,
        success: result.success,
        sid: result.sid,
        error: result.error,
      });

      // Add delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // Count successes and failures
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    res.status(200).json({
      status: 'success',
      message: `Bulk SMS completed: ${successful} sent, ${failed} failed`,
      data: {
        total: recipients.length,
        successful,
        failed,
        results,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get notification service status
// @route   GET /api/v1/notifications/status
// @access  Private
exports.getNotificationStatus = async (req, res, next) => {
  try {
    const mailerStatus = mailer.getStatus();

    // Check if SMS service is available
    const smsAvailable = !!(
      process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    );

    res.status(200).json({
      status: 'success',
      data: {
        email: {
          initialized: mailerStatus.initialized,
          hasTransporter: mailerStatus.hasTransporter,
          cachedTemplates: mailerStatus.cachedTemplates,
          config: mailerStatus.config,
        },
        sms: {
          available: smsAvailable,
          configured: smsAvailable,
        },
        rabbitmq: {
          available: !!process.env.RABBITMQ_URL,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Test email connection
// @route   GET /api/v1/notifications/test-email
// @access  Private/Admin
exports.testEmailConnection = async (req, res, next) => {
  try {
    const result = await mailer.verify();

    if (!result.success) {
      return next(
        new AppError(`Email connection test failed: ${result.error}`, 500)
      );
    }

    // Send a test email to admin
    const testResult = await mailer.send({
      to: req.user.email,
      subject: 'Email Connection Test',
      html: `
        <h2>✅ Email Connection Test Successful</h2>
        <p>This is a test email sent from the Movie Booking API.</p>
        <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Sent to:</strong> ${req.user.email}</p>
      `,
    });

    if (!testResult.success) {
      return next(
        new AppError(`Failed to send test email: ${testResult.error}`, 500)
      );
    }

    res.status(200).json({
      status: 'success',
      message: 'Email connection test successful. Check your inbox.',
      data: {
        verified: true,
        testEmailSent: true,
        messageId: testResult.messageId,
        sentTo: req.user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Test SMS connection
// @route   GET /api/v1/notifications/test-sms
// @access  Private/Admin
exports.testSMSConnection = async (req, res, next) => {
  try {
    // Check if user has phone number
    if (!req.user.phone) {
      return next(
        new AppError(
          'Your account does not have a phone number configured',
          400
        )
      );
    }

    // Send test SMS
    const result = await smsService.sendSMS(
      req.user.phone,
      `Test SMS from Movie Booking API. Timestamp: ${new Date().toLocaleTimeString()}`
    );

    if (!result.success) {
      return next(new AppError(`SMS test failed: ${result.error}`, 500));
    }

    res.status(200).json({
      status: 'success',
      message: 'SMS test successful. Check your phone.',
      data: {
        verified: true,
        testSMSSent: true,
        sid: result.sid,
        sentTo: req.user.phone,
      },
    });
  } catch (error) {
    next(error);
  }
};
