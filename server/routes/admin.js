const express = require('express');
const router = express.Router();
const { getDb } = require('../db/init');

// GET /api/admin/bookings - List all bookings
router.get('/bookings', (req, res, next) => {
  try {
    const db = getDb();
    const bookings = db.prepare('SELECT * FROM bookings ORDER BY created_at DESC').all();

    res.json({
      success: true,
      bookings: bookings
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/contacts - List all contact submissions
router.get('/contacts', (req, res, next) => {
  try {
    const db = getDb();
    const contacts = db.prepare('SELECT * FROM contacts ORDER BY created_at DESC').all();

    res.json({
      success: true,
      contacts: contacts
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/stats - Dashboard stats
router.get('/stats', (req, res, next) => {
  try {
    const db = getDb();

    const totalBookings = db.prepare('SELECT COUNT(*) as count FROM bookings').get().count;
    const totalContacts = db.prepare('SELECT COUNT(*) as count FROM contacts').get().count;
    const totalRevenue = db.prepare("SELECT COALESCE(SUM(payment_amount), 0) as total FROM bookings WHERE payment_status = 'paid'").get().total;
    const totalSubscribers = db.prepare('SELECT COUNT(*) as count FROM newsletter_subscribers WHERE active = 1').get().count;
    const pendingBookings = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'pending'").get().count;
    const unreadContacts = db.prepare("SELECT COUNT(*) as count FROM contacts WHERE status = 'unread'").get().count;

    res.json({
      success: true,
      stats: {
        total_bookings: totalBookings,
        pending_bookings: pendingBookings,
        total_contacts: totalContacts,
        unread_contacts: unreadContacts,
        total_revenue: totalRevenue,
        total_subscribers: totalSubscribers
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
