const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const {
  globalErrorHandler,
  notFound,
} = require('./middleware/error.middleware');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const movieRoutes = require('./routes/movie.routes');
const theaterRoutes = require('./routes/theater.routes');
const showtimeRoutes = require('./routes/showtime.routes');
const bookingRoutes = require('./routes/booking.routes');
const paymentRoutes = require('./routes/payment.routes');
const webhookRoutes = require('./routes/webhook.routes');
const notificationRoutes = require('./routes/notification.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const reviewRoutes = require('./routes/review.routes'); // <-- 1. IMPORT REVIEW ROUTES

const app = express();

// Webhook routes (before body parser - needs raw body)
app.use('/api/v1/webhooks', webhookRoutes);

// Middleware
// CORS configuration: allow one or more origins set via FRONTEND_URL (comma-separated)
// Fallback to common localhost dev ports so local dev still works
const rawFrontendUrls = process.env.FRONTEND_URL || 'http://localhost:5173,http://localhost:5174';
const allowedOrigins = rawFrontendUrls.split(',').map((u) => u.trim()).filter(Boolean);

// Optional permissive mode for debugging. Set FRONTEND_CORS_ALLOW_ALL=true in Render
const allowAll = String(process.env.FRONTEND_CORS_ALLOW_ALL || '').toLowerCase() === 'true';

// Small middleware to log origin and allowed origins when DEBUG_CORS is enabled
if (String(process.env.DEBUG_CORS || '').toLowerCase() === 'true') {
  app.use((req, res, next) => {
    const incomingOrigin = req.headers.origin;
    // eslint-disable-next-line no-console
    console.log('[CORS DEBUG] Incoming Origin:', incomingOrigin);
    // eslint-disable-next-line no-console
    console.log('[CORS DEBUG] Allowed Origins:', allowedOrigins);
    next();
  });
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests like curl or server-to-server by accepting undefined origin
    if (!origin) return callback(null, true);
    // If permissive debug mode enabled, echo the origin back (temporarily)
    if (allowAll) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    // Log rejected origins for debugging
    console.log('[CORS] Rejected origin:', origin);
    console.log('[CORS] Allowed origins:', allowedOrigins);
    // Reject other origins -- browser will block request
    return callback(new Error('CORS policy: Origin not allowed'), false);
  },
  credentials: true, // Allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Parse cookies

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'CineGo API Server is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      api: '/api/v1',
    },
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1', reviewRoutes); // <-- REVIEW ROUTES MUST BE BEFORE MOVIE ROUTES
app.use('/api/v1/movies', movieRoutes);
app.use('/api/v1/theaters', theaterRoutes);
app.use('/api/v1/showtimes', showtimeRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// Handle undefined routes 
app.use(notFound);

// Global error handler
app.use(globalErrorHandler);

module.exports = app;