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

// GET /api/admin/newsletter - List all newsletter subscribers
router.get('/newsletter', (req, res, next) => {
  try {
    const db = getDb();
    const subscribers = db.prepare('SELECT * FROM newsletter_subscribers ORDER BY subscribed_at DESC').all();

    res.json({
      success: true,
      subscribers: subscribers
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/bookings/:id - Update booking status
router.patch('/bookings/:id', (req, res, next) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { status, payment_status } = req.body;

    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    const validPaymentStatuses = ['unpaid', 'paid', 'refunded'];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }
    if (payment_status && !validPaymentStatuses.includes(payment_status)) {
      return res.status(400).json({ success: false, error: 'Invalid payment status' });
    }

    const updates = [];
    const params = [];

    if (status) {
      updates.push('status = ?');
      params.push(status);
    }
    if (payment_status) {
      updates.push('payment_status = ?');
      params.push(payment_status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    db.prepare(`UPDATE bookings SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    const updated = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
    res.json({ success: true, booking: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/bookings/:id - Delete a booking
router.delete('/bookings/:id', (req, res, next) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    db.prepare('DELETE FROM bookings WHERE id = ?').run(id);
    res.json({ success: true, message: 'Booking deleted' });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/contacts/:id - Update contact status
router.patch('/contacts/:id', (req, res, next) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { status } = req.body;

    const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(id);
    if (!contact) {
      return res.status(404).json({ success: false, error: 'Contact not found' });
    }

    const validStatuses = ['unread', 'read', 'replied'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    db.prepare('UPDATE contacts SET status = ? WHERE id = ?').run(status, id);
    const updated = db.prepare('SELECT * FROM contacts WHERE id = ?').get(id);
    res.json({ success: true, contact: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/contacts/:id - Delete a contact
router.delete('/contacts/:id', (req, res, next) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(id);
    if (!contact) {
      return res.status(404).json({ success: false, error: 'Contact not found' });
    }

    db.prepare('DELETE FROM contacts WHERE id = ?').run(id);
    res.json({ success: true, message: 'Contact deleted' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/newsletter/:id - Remove subscriber
router.delete('/newsletter/:id', (req, res, next) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const subscriber = db.prepare('SELECT * FROM newsletter_subscribers WHERE id = ?').get(id);
    if (!subscriber) {
      return res.status(404).json({ success: false, error: 'Subscriber not found' });
    }

    db.prepare('DELETE FROM newsletter_subscribers WHERE id = ?').run(id);
    res.json({ success: true, message: 'Subscriber removed' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
