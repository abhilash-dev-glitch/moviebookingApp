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
const reviewRoutes = require('./routes/review.routes');

const app = express();

app.use('/api/v1/webhooks', webhookRoutes);

const rawFrontendUrls = process.env.FRONTEND_URL || 'http://localhost:5173,http://localhost:5174';
const allowedOrigins = rawFrontendUrls.split(',').map((u) => u.trim()).filter(Boolean);
const allowAll = String(process.env.FRONTEND_CORS_ALLOW_ALL || '').toLowerCase() === 'true';
if (String(process.env.DEBUG_CORS || '').toLowerCase() === 'true') {
  app.use((req, res, next) => {
    const incomingOrigin = req.headers.origin;
    console.log('[CORS DEBUG] Incoming Origin:', incomingOrigin);
    console.log('[CORS DEBUG] Allowed Origins:', allowedOrigins);
    next();
  });
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowAll) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    console.log('[CORS] Rejected origin:', origin);
    console.log('[CORS] Allowed origins:', allowedOrigins);
    return callback(new Error('CORS policy: Origin not allowed'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
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

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1', reviewRoutes);
app.use('/api/v1/movies', movieRoutes);
app.use('/api/v1/theaters', theaterRoutes);
app.use('/api/v1/showtimes', showtimeRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

app.use(notFound);
app.use(globalErrorHandler);

module.exports = app;