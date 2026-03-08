const express = require('express');
const router = express.Router();
const { getDb } = require('../db/init');
const { getStripe, getWebhookSecret } = require('../utils/stripe');
const { paymentValidation } = require('../middleware/validation');

// Server-side course pricing - source of truth for payment amounts
const COURSE_PRICES = {
    'Pay As You Go':       { manual: 72,   automatic: 74 },
    'Block Booking 10hrs': { manual: 335,  automatic: 340 },
    'Intensive 6hr':       { manual: 465,  automatic: 465 },
    'Intensive 10hr':      { manual: 695,  automatic: 695 },
    'Intensive 20hr':      { manual: 1295, automatic: 1295 },
    'Intensive 30hr':      { manual: 1695, automatic: 1695 },
    'Intensive 40hr':      { manual: 1895, automatic: 1895 },
    'Guaranteed Pass':     { manual: 2995, automatic: 2995 }
};

// POST /api/payments/create-checkout-session
router.post('/create-checkout-session', paymentValidation, async (req, res, next) => {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return res.status(503).json({
        success: false,
        error: 'Payment service is not configured'
      });
    }

    const db = getDb();
    const { booking_reference, course_name } = req.body;

    // Verify booking exists
    const booking = db.prepare('SELECT * FROM bookings WHERE reference = ?').get(booking_reference);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Look up the correct price server-side based on course and transmission
    const coursePricing = COURSE_PRICES[booking.course];
    if (!coursePricing) {
      return res.status(400).json({
        success: false,
        error: 'Unknown course type: ' + booking.course
      });
    }

    const transmission = (booking.transmission || 'manual').toLowerCase();
    const amount = coursePricing[transmission] || coursePricing.manual;

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: course_name,
              description: `Booking Reference: ${booking_reference}`
            },
            unit_amount: Math.round(amount * 100) // Convert to pence
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${baseUrl}/pages/booking.html?payment=success&reference=${booking_reference}`,
      cancel_url: `${baseUrl}/pages/booking.html?payment=cancelled&reference=${booking_reference}`,
      metadata: {
        booking_reference: booking_reference
      }
    });

    // Store stripe session ID on the booking
    db.prepare('UPDATE bookings SET stripe_session_id = ?, payment_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE reference = ?')
      .run(session.id, amount, booking_reference);

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/payments/webhook - Stripe webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res, next) => {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return res.status(503).json({
        success: false,
        error: 'Payment service is not configured'
      });
    }

    const sig = req.headers['stripe-signature'];
    const webhookSecret = getWebhookSecret();

    let event;

    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET is not configured. Rejecting webhook.');
      return res.status(400).json({
        success: false,
        error: 'Webhook secret is not configured'
      });
    }

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({
        success: false,
        error: 'Invalid webhook signature'
      });
    }

    const db = getDb();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const bookingReference = session.metadata && session.metadata.booking_reference;
        if (bookingReference) {
          db.prepare(`
            UPDATE bookings
            SET payment_status = 'paid',
                payment_amount = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE reference = ?
          `).run(session.amount_total / 100, bookingReference);
          console.log(`Payment completed for booking ${bookingReference}`);
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object;
        let refundRef = charge.metadata && charge.metadata.booking_reference;

        // Fallback: look up via payment_intent metadata
        if (!refundRef && charge.payment_intent) {
          try {
            const pi = await stripe.paymentIntents.retrieve(charge.payment_intent);
            refundRef = pi.metadata && pi.metadata.booking_reference;
          } catch (piErr) {
            console.error('Failed to retrieve payment intent for refund:', piErr.message);
          }
        }

        // Fallback: look up booking by stripe_session_id
        if (!refundRef && charge.payment_intent) {
          const bookingBySession = db.prepare('SELECT * FROM bookings WHERE stripe_session_id = ?').get(charge.payment_intent);
          if (bookingBySession) {
            refundRef = bookingBySession.reference;
          }
        }

        if (refundRef) {
          db.prepare(`
            UPDATE bookings
            SET payment_status = 'refunded', updated_at = CURRENT_TIMESTAMP
            WHERE reference = ?
          `).run(refundRef);
          console.log(`Refund processed for booking ${refundRef}`);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const intent = event.data.object;
        const failRef = intent.metadata && intent.metadata.booking_reference;
        if (failRef) {
          db.prepare(`
            UPDATE bookings
            SET payment_status = 'failed', updated_at = CURRENT_TIMESTAMP
            WHERE reference = ?
          `).run(failRef);
          console.warn(`Payment failed for booking ${failRef}`);
        }
        break;
      }

      case 'checkout.session.expired': {
        const expiredSession = event.data.object;
        const expRef = expiredSession.metadata && expiredSession.metadata.booking_reference;
        if (expRef) {
          console.warn(`Checkout session expired for booking ${expRef}`);
        }
        break;
      }

      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
