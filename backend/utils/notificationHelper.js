/**
 * Notification Helper Utility
 * Handles email and phone number validation and fallback logic
 */

// Mock email patterns to detect test/fake emails
const mockEmailPatterns = [
  /test@/i,
  /example@/i,
  /demo@/i,
  /fake@/i,
  /temp@/i,
  /sample@/i,
  /@test\./i,
  /@example\./i,
  /@demo\./i,
  /@fake\./i,
  /mailinator/i,
  /guerrillamail/i,
  /10minutemail/i,
  /throwaway/i,
];

// Trusted email domains (emails from these domains will be sent normally)
const trustedDomains = [
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'icloud.com',
  'protonmail.com',
  'zoho.com',
  'aol.com',
  'mail.com',
];

// Fallback configuration - Multiple admin emails
const ADMIN_EMAILS = [
  process.env.ADMIN_EMAIL_1 || 'abhilashchandra26@gmail.com',
  process.env.ADMIN_EMAIL_2 || 'cinego305@gmail.com',
];
const FALLBACK_EMAIL = ADMIN_EMAILS[0]; // Primary admin email
const FALLBACK_PHONE = process.env.FALLBACK_PHONE || '+916282204782';

/**
 * Check if email is from a trusted domain
 * @param {string} email - Email address to check
 * @returns {boolean} True if from trusted domain
 */
function isTrustedDomain(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const domain = email.split('@')[1]?.toLowerCase();
  return trustedDomains.includes(domain);
}

/**
 * Check if email is a mock/test email or from untrusted domain
 * @param {string} email - Email address to check
 * @returns {boolean} True if mock email or untrusted domain
 */
function isMockEmail(email) {
  if (!email || typeof email !== 'string') {
    return true;
  }
  
  // Check against mock patterns
  if (mockEmailPatterns.some(pattern => pattern.test(email))) {
    return true;
  }
  
  // Check if from untrusted domain
  if (!isTrustedDomain(email)) {
    return true;
  }
  
  return false;
}

/**
 * Check if email is a valid Gmail address
 * @param {string} email - Email address to check
 * @returns {boolean} True if valid Gmail
 */
function isValidGmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  // Check if it's a Gmail address
  const gmailPattern = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
  return gmailPattern.test(email);
}

/**
 * Get target email address (with fallback for mock emails)
 * Returns array of admin emails for untrusted/fake emails
 * @param {string} email - Original email address
 * @param {boolean} logRedirect - Whether to log the redirect
 * @returns {string|string[]} Target email address or array of admin emails
 */
function getTargetEmail(email, logRedirect = true) {
  if (isMockEmail(email)) {
    if (logRedirect) {
      const domain = email?.split('@')[1] || 'unknown';
      const reason = mockEmailPatterns.some(pattern => pattern.test(email)) 
        ? 'test/fake pattern' 
        : `untrusted domain (${domain})`;
      console.log(`📧 Redirecting email: ${email} → Admin emails (Reason: ${reason})`);
    }
    // Return array of admin emails for BCC
    return ADMIN_EMAILS;
  }
  
  return email;
}

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid
 */
function isValidPhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Check if it's a valid length (10-15 digits)
  const digitCount = cleaned.replace(/\+/g, '').length;
  if (digitCount < 10 || digitCount > 15) {
    return false;
  }
  
  // Check if it matches international format
  // Should start with + followed by country code and number
  // Or just be 10 digits (will be prefixed with +91)
  const internationalPattern = /^\+[1-9]\d{9,14}$/;
  const localPattern = /^[6-9]\d{9}$/; // Indian mobile numbers
  
  return internationalPattern.test(cleaned) || localPattern.test(cleaned);
}

/**
 * Format phone number to international format
 * @param {string} phone - Phone number to format
 * @returns {string} Formatted phone number
 */
function formatPhoneNumber(phone) {
  if (!phone) {
    return phone;
  }
  
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // If it already has +, return as is
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  
  // Remove leading zeros
  cleaned = cleaned.replace(/^0+/, '');
  
  // If it's 10 digits, assume it's an Indian number
  if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
    return '+91' + cleaned;
  }
  
  // If it's already 12 digits starting with 91, add +
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return '+' + cleaned;
  }
  
  // Otherwise, return as is (might be invalid)
  return cleaned;
}

/**
 * Get target phone number (with fallback for invalid numbers)
 * @param {string} phone - Original phone number
 * @param {boolean} logRedirect - Whether to log the redirect
 * @returns {string} Target phone number
 */
function getTargetPhone(phone, logRedirect = true) {
  // Format the phone number first
  const formatted = formatPhoneNumber(phone);
  
  // Check if it's valid
  if (!isValidPhoneNumber(formatted)) {
    if (logRedirect) {
      console.log(`📱 Invalid phone detected: ${phone} → Redirecting to ${FALLBACK_PHONE}`);
    }
    return FALLBACK_PHONE;
  }
  
  return formatted;
}

/**
 * Get notification targets with fallback logic
 * @param {Object} user - User object with email and phone
 * @param {boolean} logRedirects - Whether to log redirects
 * @returns {Object} Target email and phone
 */
function getNotificationTargets(user, logRedirects = true) {
  const targetEmail = getTargetEmail(user.email, logRedirects);
  const targetPhone = getTargetPhone(user.phone, logRedirects);
  
  const result = {
    email: targetEmail,
    phone: targetPhone,
    emailRedirected: targetEmail !== user.email,
    phoneRedirected: targetPhone !== formatPhoneNumber(user.phone),
    originalEmail: user.email,
    originalPhone: user.phone,
  };
  
  if (logRedirects && (result.emailRedirected || result.phoneRedirected)) {
    console.log('🔄 Notification redirect summary:', {
      email: result.emailRedirected ? `${user.email} → ${targetEmail}` : 'No redirect',
      phone: result.phoneRedirected ? `${user.phone} → ${targetPhone}` : 'No redirect',
    });
  }
  
  return result;
}

/**
 * Validate notification configuration
 * @returns {Object} Configuration status
 */
function validateNotificationConfig() {
  const status = {
    email: {
      configured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD),
      fallback: FALLBACK_EMAIL,
    },
    sms: {
      configured: !!(
        process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_PHONE_NUMBER &&
        process.env.TWILIO_PHONE_NUMBER !== '+1234567890' // Check for placeholder
      ),
      fallback: FALLBACK_PHONE,
    },
  };
  
  return status;
}

module.exports = {
  isMockEmail,
  isTrustedDomain,
  isValidGmail,
  getTargetEmail,
  isValidPhoneNumber,
  formatPhoneNumber,
  getTargetPhone,
  getNotificationTargets,
  validateNotificationConfig,
  FALLBACK_EMAIL,
  FALLBACK_PHONE,
  ADMIN_EMAILS,
  trustedDomains,
};
