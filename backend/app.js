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
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Match your Vite port
  credentials: true, // Allow cookies to be sent
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Parse cookies

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