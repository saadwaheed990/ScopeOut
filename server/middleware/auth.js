/**
 * Admin Authentication Middleware
 * Validates API key for admin endpoints
 */

const crypto = require('crypto');

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

  // Only accept the key from the X-Admin-Key header
  const provided = req.headers['x-admin-key'];

  if (!provided) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorised: invalid or missing admin API key'
    });
  }

  // Use timing-safe comparison to prevent timing attacks
  const providedBuf = Buffer.from(String(provided));
  const apiKeyBuf = Buffer.from(String(apiKey));

  if (providedBuf.length !== apiKeyBuf.length || !crypto.timingSafeEqual(providedBuf, apiKeyBuf)) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorised: invalid or missing admin API key'
    });
  }

  next();
}

module.exports = { adminAuth };
