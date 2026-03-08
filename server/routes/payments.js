const express = require('express');
const router = express.Router();
const { getDb } = require('../db/init');
const { getStripe, getWebhookSecret } = require('../utils/stripe');
const { paymentValidation } = require('../middleware/validation');

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
    const { booking_reference, course_name, amount } = req.body;

    // Verify booking exists
    const booking = db.prepare('SELECT * FROM bookings WHERE reference = ?').get(booking_reference);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

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
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res, next) => {
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
        const refundRef = charge.metadata && charge.metadata.booking_reference;
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
