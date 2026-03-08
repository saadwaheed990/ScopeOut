const { body, validationResult } = require('express-validator');

// UK phone regex: allows various UK formats
const UK_PHONE_REGEX = /^(?:(?:\+44\s?|0)(?:\d\s?){9,10}|\d{5}\s?\d{3}\s?\d{3})$/;

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const fieldErrors = errors.array().map(err => ({
      field: err.path,
      message: err.msg
    }));
    return res.status(422).json({
      success: false,
      error: 'Validation failed',
      errors: fieldErrors
    });
  }
  next();
}

const bookingValidation = [
  body('course')
    .trim()
    .notEmpty().withMessage('Course is required')
,
  body('transmission')
    .trim()
    .notEmpty().withMessage('Transmission type is required')
    .isIn(['manual', 'automatic']).withMessage('Transmission must be manual or automatic'),
  body('date')
    .trim()
    .notEmpty().withMessage('Date is required')
    .isISO8601({ strict: true }).withMessage('Date must be a valid date (YYYY-MM-DD)'),
  body('time_slot')
    .trim()
    .notEmpty().withMessage('Time slot is required')
,
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
,
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(UK_PHONE_REGEX).withMessage('Please provide a valid UK phone number'),
  body('notes')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 1000 }).withMessage('Notes must be under 1000 characters')
,
  handleValidationErrors
];

const contactValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
,
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .matches(UK_PHONE_REGEX).withMessage('Please provide a valid UK phone number'),
  body('subject')
    .trim()
    .notEmpty().withMessage('Subject is required')
    .isLength({ min: 2, max: 200 }).withMessage('Subject must be between 2 and 200 characters')
,
  body('message')
    .trim()
    .notEmpty().withMessage('Message is required')
    .isLength({ min: 10, max: 5000 }).withMessage('Message must be between 10 and 5000 characters')
,
  handleValidationErrors
];

const newsletterValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  handleValidationErrors
];

const paymentValidation = [
  body('booking_reference')
    .trim()
    .notEmpty().withMessage('Booking reference is required')
    .matches(/^IMP-[A-Z0-9]{5}$/).withMessage('Invalid booking reference format'),
  body('course_name')
    .trim()
    .notEmpty().withMessage('Course name is required')
,
  handleValidationErrors
];

module.exports = {
  bookingValidation,
  contactValidation,
  newsletterValidation,
  paymentValidation,
  handleValidationErrors
};
