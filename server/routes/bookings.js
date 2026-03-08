const express = require('express');
const router = express.Router();
const { getDb } = require('../db/init');
const { generateUniqueReference } = require('../utils/reference');
const { sendBookingConfirmation } = require('../utils/email');
const { bookingValidation } = require('../middleware/validation');

// POST /api/bookings - Create a new booking
router.post('/', bookingValidation, async (req, res, next) => {
  try {
    const db = getDb();
    const { course, transmission, date, time_slot, name, email, phone, notes } = req.body;

    const reference = generateUniqueReference(db);

    const stmt = db.prepare(`
      INSERT INTO bookings (reference, course, transmission, date, time_slot, name, email, phone, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      reference,
      course,
      transmission || 'manual',
      date,
      time_slot,
      name,
      email,
      phone,
      notes || null
    );

    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(result.lastInsertRowid);

    // Send confirmation email (don't fail the request if email fails)
    try {
      await sendBookingConfirmation(booking);
    } catch (emailErr) {
      console.error('Failed to send booking confirmation email:', emailErr.message);
    }

    res.status(201).json({
      success: true,
      booking: booking
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/bookings/:reference - Get booking by reference
router.get('/:reference', (req, res, next) => {
  try {
    const db = getDb();
    const { reference } = req.params;

    const booking = db.prepare('SELECT * FROM bookings WHERE reference = ?').get(reference);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    res.json({
      success: true,
      booking: booking
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
