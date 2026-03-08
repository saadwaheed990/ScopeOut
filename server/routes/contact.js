const express = require('express');
const router = express.Router();
const { getDb } = require('../db/init');
const { sendContactNotification } = require('../utils/email');
const { contactValidation } = require('../middleware/validation');

// POST /api/contact - Submit contact form
router.post('/', contactValidation, async (req, res, next) => {
  try {
    const db = getDb();
    const { name, email, phone, subject, message } = req.body;

    const stmt = db.prepare(`
      INSERT INTO contacts (name, email, phone, subject, message)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(name, email, phone || null, subject, message);

    // Send notification email (don't fail the request if email fails)
    try {
      await sendContactNotification({ name, email, phone, subject, message });
    } catch (emailErr) {
      console.error('Failed to send contact notification email:', emailErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully'
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
