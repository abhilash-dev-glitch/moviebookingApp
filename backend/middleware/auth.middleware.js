const { verifyToken } = require('../config/jwt');
const User = require('../models/User');

// Debug mode - Set to true to enable detailed logging for troubleshooting
const DEBUG_AUTH = false;

// Protect routes - user must be logged in
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Debug: Log request details
    if (DEBUG_AUTH) {
      console.log('🔒 [PROTECT] Path:', req.path);
      console.log('🔒 [PROTECT] Method:', req.method);
      console.log('🔒 [PROTECT] Authorization Header:', req.headers.authorization);
      console.log('🔒 [PROTECT] Has Cookie:', !!req.cookies.token);
    }

    // 1) Get token from header or cookie
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      // Get token from Authorization header
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.token) {
      // Get token from cookie
      token = req.cookies.token;
    }

    // Debug: Log token status
    if (DEBUG_AUTH) {
      console.log('🔒 [PROTECT] Token found:', token ? 'YES' : 'NO');
      if (token) {
        console.log('🔒 [PROTECT] Token source:', req.headers.authorization ? 'Header' : 'Cookie');
      }
    }

    if (!token) {
      if (DEBUG_AUTH) console.log('❌ [PROTECT] No token - Blocking request');
      return res.status(401).json({
        status: 'fail',
        message: 'You are not logged in! Please log in to get access.',
      });
    }

    // 2) Verify token
    const decoded = verifyToken(token);
    if (DEBUG_AUTH) {
      console.log('🔒 [PROTECT] Token decoded successfully');
      console.log('🔒 [PROTECT] User ID from token:', decoded.id);
    }

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id).populate('managedTheaters');
    if (DEBUG_AUTH) {
      console.log('🔒 [PROTECT] User found:', !!currentUser);
      if (currentUser) {
        console.log('🔒 [PROTECT] User role:', currentUser.role);
        console.log('🔒 [PROTECT] User active:', currentUser.isActive);
      }
    }
    if (!currentUser) {
      return res.status(401).json({
        status: 'fail',
        message: 'The user belonging to this token no longer exists.',
      });
    }

    // 4) Check if user is active
    if (!currentUser.isActive) {
      return res.status(401).json({
        status: 'fail',
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    // 5) Grant access to protected route
    req.user = currentUser;
    if (DEBUG_AUTH) console.log('✅ [PROTECT] Access granted to user:', currentUser.email);
    next();
  } catch (error) {
    if (DEBUG_AUTH) {
      console.log('❌ [PROTECT] Error:', error.message);
      console.log('❌ [PROTECT] Stack:', error.stack);
    }
    return res.status(401).json({
      status: 'fail',
      message: 'Invalid token or session expired. Please log in again.',
    });
  }
};

// Restrict to certain roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // Debug: Log role check
    if (DEBUG_AUTH) {
      console.log('🔐 [RESTRICT_TO] Required roles:', roles);
      console.log('🔐 [RESTRICT_TO] User role:', req.user?.role);
      console.log('🔐 [RESTRICT_TO] User email:', req.user?.email);
    }

    // roles is an array ['admin', 'endUser', 'theaterManager']
    if (!roles.includes(req.user.role)) {
      if (DEBUG_AUTH) console.log('❌ [RESTRICT_TO] Access denied - insufficient permissions');
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to perform this action',
      });
    }
    
    if (DEBUG_AUTH) console.log('✅ [RESTRICT_TO] Access granted');
    next();
  };
};

// Check if theater manager has access to specific theater
exports.checkTheaterAccess = async (req, res, next) => {
  try {
    const theaterId = req.params.theaterId || req.params.id || req.body.theater;

    // Debug: Log theater access check
    if (DEBUG_AUTH) {
      console.log('🎭 [THEATER_ACCESS] Checking access for theater:', theaterId);
      console.log('🎭 [THEATER_ACCESS] User role:', req.user.role);
      console.log('🎭 [THEATER_ACCESS] Managed theaters:', req.user.managedTheaters?.map(t => t._id));
    }

    // Admin has access to all theaters
    if (req.user.role === 'admin') {
      if (DEBUG_AUTH) console.log('✅ [THEATER_ACCESS] Admin - Full access granted');
      return next();
    }

    // Theater manager must have the theater in their managedTheaters
    if (req.user.role === 'theaterManager') {
      const hasAccess = req.user.managedTheaters.some(
        (theater) => theater._id.toString() === theaterId
      );

      if (DEBUG_AUTH) {
        console.log('🎭 [THEATER_ACCESS] Theater manager has access:', hasAccess);
      }

      if (!hasAccess) {
        if (DEBUG_AUTH) console.log('❌ [THEATER_ACCESS] Access denied - theater not managed by user');
        return res.status(403).json({
          status: 'fail',
          message: 'You do not have access to manage this theater',
        });
      }

      if (DEBUG_AUTH) console.log('✅ [THEATER_ACCESS] Theater manager - Access granted');
      return next();
    }

    // Other roles don't have theater management access
    if (DEBUG_AUTH) console.log('❌ [THEATER_ACCESS] Access denied - not admin or theater manager');
    return res.status(403).json({
      status: 'fail',
      message: 'You do not have permission to manage theaters',
    });
  } catch (error) {
    if (DEBUG_AUTH) {
      console.log('❌ [THEATER_ACCESS] Error:', error.message);
      console.log('❌ [THEATER_ACCESS] Stack:', error.stack);
    }
    return res.status(500).json({
      status: 'error',
      message: 'Error checking theater access',
    });
  }
};

// Check if theater manager can manage showtime
exports.checkShowtimeAccess = async (req, res, next) => {
  try {
    const Showtime = require('../models/Showtime');
    const showtimeId = req.params.id;

    // Debug: Log showtime access check
    if (DEBUG_AUTH) {
      console.log('🎬 [SHOWTIME_ACCESS] Checking access for showtime:', showtimeId);
      console.log('🎬 [SHOWTIME_ACCESS] User role:', req.user.role);
    }

    // Admin has access to all showtimes
    if (req.user.role === 'admin') {
      if (DEBUG_AUTH) console.log('✅ [SHOWTIME_ACCESS] Admin - Full access granted');
      return next();
    }

    // Theater manager must own the theater for the showtime
    if (req.user.role === 'theaterManager') {
      const showtime = await Showtime.findById(showtimeId);
      
      if (DEBUG_AUTH) {
        console.log('🎬 [SHOWTIME_ACCESS] Showtime found:', !!showtime);
        if (showtime) {
          console.log('🎬 [SHOWTIME_ACCESS] Showtime theater:', showtime.theater);
        }
      }

      if (!showtime) {
        if (DEBUG_AUTH) console.log('❌ [SHOWTIME_ACCESS] Showtime not found');
        return res.status(404).json({
          status: 'fail',
          message: 'Showtime not found',
        });
      }

      const hasAccess = req.user.managedTheaters.some(
        (theater) => theater._id.toString() === showtime.theater.toString()
      );

      if (DEBUG_AUTH) {
        console.log('🎬 [SHOWTIME_ACCESS] Theater manager has access:', hasAccess);
      }

      if (!hasAccess) {
        if (DEBUG_AUTH) console.log('❌ [SHOWTIME_ACCESS] Access denied - showtime theater not managed by user');
        return res.status(403).json({
          status: 'fail',
          message: 'You do not have access to manage this showtime',
        });
      }

      if (DEBUG_AUTH) console.log('✅ [SHOWTIME_ACCESS] Theater manager - Access granted');
      return next();
    }

    if (DEBUG_AUTH) console.log('❌ [SHOWTIME_ACCESS] Access denied - not admin or theater manager');
    return res.status(403).json({
      status: 'fail',
      message: 'You do not have permission to manage showtimes',
    });
  } catch (error) {
    if (DEBUG_AUTH) {
      console.log('❌ [SHOWTIME_ACCESS] Error:', error.message);
    }
    return res.status(500).json({
      status: 'error',
      message: 'Error checking showtime access',
    });
  }
};
