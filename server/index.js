require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');

const { getDb, closeDb } = require('./db/init');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const bookingsRouter = require('./routes/bookings');
const contactRouter = require('./routes/contact');
const paymentsRouter = require('./routes/payments');
const newsletterRouter = require('./routes/newsletter');
const adminRouter = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database on startup
getDb();

// Security headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Request logging
app.use(morgan('dev'));

// CORS - allow local development origins
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5500',
    'http://localhost:8080',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5500',
    'http://127.0.0.1:8080'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature']
}));

// Stripe webhook route MUST come before JSON body parser
// It needs the raw body for signature verification
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// JSON body parser for all other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting for public-facing form endpoints
const isTest = process.env.NODE_ENV === 'test';
const formLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isTest ? 1000 : 20, // relaxed in test mode
  message: {
    success: false,
    error: 'Too many requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to form submission endpoints
app.use('/api/bookings', formLimiter);
app.use('/api/contact', formLimiter);
app.use('/api/newsletter', formLimiter);

// Mount API routes
app.use('/api/bookings', bookingsRouter);
app.use('/api/contact', contactRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/newsletter', newsletterRouter);
app.use('/api/admin', adminRouter);

// Serve static frontend files from parent directory
app.use(express.static(path.join(__dirname, '..')));

// Global error handler (must be last middleware)
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(`Impulse Driving School server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Static files served from: ${path.join(__dirname, '..')}`);
  console.log(`API available at: http://localhost:${PORT}/api`);
});

// Graceful shutdown
function shutdown() {
  console.log('\nShutting down gracefully...');
  server.close(() => {
    closeDb();
    console.log('Server closed');
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = app;
