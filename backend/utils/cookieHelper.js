// Send JWT token in cookie
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const { generateToken } = require('../config/jwt');
  const token = generateToken(user._id);

  // Cookie options
  const cookieExpire = parseInt(process.env.JWT_COOKIE_EXPIRE) || 30; // Default 30 days
  const options = {
    expires: new Date(
      Date.now() + cookieExpire * 24 * 60 * 60 * 1000
    ),
    httpOnly: true, // Prevents client-side JS from accessing the cookie
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict', // CSRF protection
  };

  // Remove password from output
  user.password = undefined;

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      status: 'success',
      // Token included in response body for:
      // 1. API testing (Postman, etc.)
      // 2. Mobile apps that can't access httpOnly cookies
      // 3. Client-side apps that need explicit token management
      // Primary auth uses httpOnly cookie for XSS protection
      token,
      data: {
        user,
      },
    });
};

// Clear cookie on logout
const clearTokenCookie = (res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000), // 10 seconds
    httpOnly: true,
  });
};

module.exports = {
  sendTokenResponse,
  clearTokenCookie,
};
