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

// Validate required environment variables in production
if (process.env.NODE_ENV === 'production') {
  const required = ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'ADMIN_API_KEY'];
  const missing = required.filter(key => !process.env[key] || process.env[key].includes('your_'));
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing.join(', '));
    process.exit(1);
  }
}

// Initialize database on startup
getDb();

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://js.stripe.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.stripe.com"],
      frameSrc: ["https://js.stripe.com"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// Request logging
app.use(morgan('dev'));

// CORS configuration
const corsOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
  : [
      'http://localhost:3000',
      'http://localhost:5500',
      'http://localhost:8080',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5500',
      'http://127.0.0.1:8080'
    ];

app.use(cors({
  origin: corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature', 'X-Admin-Key']
}));

// Stripe webhook route MUST come before JSON body parser
// It needs the raw body for signature verification
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// JSON body parser for all other routes
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

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

// Rate limiting for admin endpoints
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 1000 : 100,
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
app.use('/api/payments', formLimiter);
app.use('/api/admin', adminLimiter);

// Mount API routes
app.use('/api/bookings', bookingsRouter);
app.use('/api/contact', contactRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/newsletter', newsletterRouter);
app.use('/api/admin', adminRouter);

// Serve static frontend files from specific safe directories only
app.use('/css', express.static(path.join(__dirname, '..', 'css')));
app.use('/js', express.static(path.join(__dirname, '..', 'js')));
app.use('/pages', express.static(path.join(__dirname, '..', 'pages')));
app.use('/images', express.static(path.join(__dirname, '..', 'images')));

// Serve root-level static files (HTML, robots.txt, sitemap.xml, favicon)
app.use(express.static(path.join(__dirname, '..'), {
  index: 'index.html',
  extensions: ['html'],
  dotfiles: 'deny',
  setHeaders: function (res, filePath) {
    // Only allow specific file types from root
    if (!/\.(html|ico|png|svg|txt|xml)$/i.test(filePath)) {
      res.status(403);
    }
  }
}));

// Block access to server directory, node_modules, and dotfiles
app.use('/server', function (req, res) {
  res.status(403).json({ success: false, error: 'Forbidden' });
});
app.use('/node_modules', function (req, res) {
  res.status(403).json({ success: false, error: 'Forbidden' });
});
app.use('/tests', function (req, res) {
  res.status(403).json({ success: false, error: 'Forbidden' });
});

// Global error handler (must be last middleware)
app.use(errorHandler);

// Only start the server when running directly (not on Vercel)
if (!process.env.VERCEL) {
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
}

module.exports = app;
