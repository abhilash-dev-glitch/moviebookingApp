const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');

/**
 * Mailer Utility Class
 * Provides a clean interface for sending emails
 */
class Mailer {
  constructor() {
    this.transporter = null;
    this.templateCache = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize the mailer with configuration
   */
  initialize() {
    try {
      if (this.isInitialized) {
        return;
      }

      const config = {
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
        tls: {
          rejectUnauthorized: process.env.NODE_ENV === 'production',
        },
      };

      // Validate required configuration
      if (!config.auth.user || !config.auth.pass) {
        console.warn('⚠️  Email credentials not configured');
        console.warn('⚠️  Email notifications will be disabled');
        return;
      }

      this.transporter = nodemailer.createTransport(config);
      this.isInitialized = true;

      console.log('✅ Mailer utility initialized');

      // Verify connection
      this.verify().catch((err) => {
        console.error('❌ Mailer verification failed:', err.message);
      });
    } catch (error) {
      console.error('❌ Failed to initialize mailer:', error.message);
    }
  }

  /**
   * Verify SMTP connection
   */
  async verify() {
    if (!this.transporter) {
      return { success: false, error: 'Mailer not initialized' };
    }

    try {
      await this.transporter.verify();
      console.log('✅ SMTP connection verified');
      return { success: true };
    } catch (error) {
      console.error('❌ SMTP verification failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Load and compile email template
   * @param {string} templateName - Template file name (without extension)
   * @param {object} data - Template data
   * @returns {Promise<string>} Compiled HTML
   */
  async loadTemplate(templateName, data = {}) {
    try {
      // Check cache first
      if (this.templateCache.has(templateName)) {
        const template = this.templateCache.get(templateName);
        return template(data);
      }

      // Load template from file
      const templatePath = path.join(
        __dirname,
        '../templates/emails',
        `${templateName}.hbs`
      );

      const templateContent = await fs.readFile(templatePath, 'utf-8');
      const template = handlebars.compile(templateContent);

      // Cache the compiled template
      this.templateCache.set(templateName, template);

      return template(data);
    } catch (error) {
      console.error(`❌ Failed to load template ${templateName}:`, error.message);
      // Return a simple fallback
      return this.getFallbackTemplate(data);
    }
  }

  /**
   * Get fallback template when template loading fails
   */
  getFallbackTemplate(data) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Movie Booking Notification</h2>
          <p>${data.message || 'You have a new notification from Movie Booking System.'}</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Send email
   * @param {object} options - Email options
   * @returns {Promise<object>} Send result
   */
  async send(options) {
    try {
      if (!this.transporter) {
        return {
          success: false,
          error: 'Mailer not initialized. Check email configuration.',
        };
      }

      const {
        to,
        subject,
        template,
        data,
        html,
        text,
        from,
        cc,
        bcc,
        replyTo,
        attachments,
        priority,
      } = options;

      // Validate required fields
      if (!to) {
        return { success: false, error: 'Recipient email (to) is required' };
      }

      if (!subject) {
        return { success: false, error: 'Email subject is required' };
      }

      // Prepare HTML content
      let htmlContent = html;

      if (template && data) {
        htmlContent = await this.loadTemplate(template, data);
      }

      if (!htmlContent && !text) {
        return {
          success: false,
          error: 'Either html, text, or template must be provided',
        };
      }

      // Prepare mail options
      const mailOptions = {
        from:
          from ||
          `${process.env.EMAIL_FROM_NAME || 'Movie Booking'} <${
            process.env.EMAIL_FROM || process.env.EMAIL_USER
          }>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html: htmlContent,
        text: text || this.htmlToText(htmlContent),
      };

      // Add optional fields
      if (cc) mailOptions.cc = Array.isArray(cc) ? cc.join(', ') : cc;
      if (bcc) mailOptions.bcc = Array.isArray(bcc) ? bcc.join(', ') : bcc;
      if (replyTo) mailOptions.replyTo = replyTo;
      if (attachments) mailOptions.attachments = attachments;
      if (priority) mailOptions.priority = priority; // high, normal, low

      // Send email
      const info = await this.transporter.sendMail(mailOptions);

      console.log(`✅ Email sent to ${to}: ${info.messageId}`);

      return {
        success: true,
        messageId: info.messageId,
        response: info.response,
      };
    } catch (error) {
      console.error('❌ Failed to send email:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send email with template
   * @param {string} to - Recipient email
   * @param {string} subject - Email subject
   * @param {string} template - Template name
   * @param {object} data - Template data
   * @param {object} options - Additional options
   */
  async sendWithTemplate(to, subject, template, data, options = {}) {
    return await this.send({
      to,
      subject,
      template,
      data,
      ...options,
    });
  }

  /**
   * Send bulk emails
   * @param {Array} recipients - Array of recipient objects
   * @param {string} subject - Email subject
   * @param {string} template - Template name
   * @param {object} commonData - Common data for all emails
   */
  async sendBulk(recipients, subject, template, commonData = {}) {
    const results = [];

    for (const recipient of recipients) {
      const { email, data } = recipient;
      const mergedData = { ...commonData, ...data };

      const result = await this.sendWithTemplate(
        email,
        subject,
        template,
        mergedData
      );

      results.push({
        email,
        success: result.success,
        messageId: result.messageId,
        error: result.error,
      });

      // Add delay to avoid rate limiting
      await this.delay(100);
    }

    return results;
  }

  /**
   * Send email with attachment
   * @param {string} to - Recipient email
   * @param {string} subject - Email subject
   * @param {string} html - Email HTML content
   * @param {Array} attachments - Array of attachment objects
   */
  async sendWithAttachment(to, subject, html, attachments) {
    return await this.send({
      to,
      subject,
      html,
      attachments,
    });
  }

  /**
   * Convert HTML to plain text (simple version)
   */
  htmlToText(html) {
    if (!html) return '';

    return html
      .replace(/<style[^>]*>.*<\/style>/gm, '')
      .replace(/<script[^>]*>.*<\/script>/gm, '')
      .replace(/<[^>]+>/gm, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Clear template cache
   */
  clearCache() {
    this.templateCache.clear();
    console.log('✅ Template cache cleared');
  }

  /**
   * Delay helper for rate limiting
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get mailer status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      hasTransporter: !!this.transporter,
      cachedTemplates: this.templateCache.size,
      config: {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        user: process.env.EMAIL_USER ? '***configured***' : 'not configured',
      },
    };
  }
}

// Create singleton instance
const mailer = new Mailer();

// Export both the instance and the class
module.exports = mailer;
module.exports.Mailer = Mailer;
