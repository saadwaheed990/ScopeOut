/**
 * Admin Authentication Middleware
 * Validates API key for admin endpoints
 */

function adminAuth(req, res, next) {
  const apiKey = process.env.ADMIN_API_KEY;

  // If no API key is configured, block access in production
  if (!apiKey) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(503).json({
        success: false,
        error: 'Admin API key is not configured'
      });
    }
    // Allow access in development without key
    return next();
  }

  const provided = req.headers['x-admin-key'] || req.query.api_key;

  if (!provided || provided !== apiKey) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorised: invalid or missing admin API key'
    });
  }

  next();
}

module.exports = { adminAuth };
