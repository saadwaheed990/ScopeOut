const express = require('express');
const router = express.Router();
const { getDb } = require('../db/init');
const { sendNewsletterWelcome } = require('../utils/email');
const { newsletterValidation } = require('../middleware/validation');

// POST /api/newsletter/subscribe
router.post('/subscribe', newsletterValidation, async (req, res, next) => {
  try {
    const db = getDb();
    const { email } = req.body;

    // Check if already subscribed
    const existing = db.prepare('SELECT * FROM newsletter_subscribers WHERE email = ?').get(email);

    if (existing) {
      if (existing.active) {
        return res.status(409).json({
          success: false,
          error: 'This email is already subscribed'
        });
      }
      // Reactivate if previously unsubscribed
      db.prepare('UPDATE newsletter_subscribers SET active = 1, subscribed_at = CURRENT_TIMESTAMP WHERE email = ?')
        .run(email);
    } else {
      db.prepare('INSERT INTO newsletter_subscribers (email) VALUES (?)').run(email);
    }

    // Send welcome email (don't fail the request if email fails)
    try {
      await sendNewsletterWelcome(email);
    } catch (emailErr) {
      console.error('Failed to send newsletter welcome email:', emailErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Subscribed successfully'
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
