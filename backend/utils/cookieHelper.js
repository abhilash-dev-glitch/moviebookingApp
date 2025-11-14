const sendTokenResponse = (user, statusCode, res) => {
  const { generateToken } = require('../config/jwt');
  const token = generateToken(user._id);

  const cookieExpire = parseInt(process.env.JWT_COOKIE_EXPIRE) || 30;
  const options = {
    expires: new Date(Date.now() + cookieExpire * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  };

  user.password = undefined;

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      status: 'success',
      token,
      data: {
        user,
      },
    });
};

const clearTokenCookie = (res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
};

module.exports = {
  sendTokenResponse,
  clearTokenCookie,
};
