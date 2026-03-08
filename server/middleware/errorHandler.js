function errorHandler(err, req, res, next) {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);

  if (err.type === 'StripeSignatureVerificationError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid webhook signature'
    });
  }

  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(409).json({
      success: false,
      error: 'A record with this information already exists'
    });
  }

  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'Internal server error' : err.message;

  res.status(statusCode).json({
    success: false,
    error: message
  });
}

module.exports = errorHandler;
