const Stripe = require('stripe');

let stripeInstance = null;

function getStripe() {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey || secretKey === 'sk_test_your_key_here') {
      console.warn('Warning: Stripe secret key not configured. Payment features will not work.');
      return null;
    }
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2024-11-20.acacia'
    });
  }
  return stripeInstance;
}

function getWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET || '';
}

module.exports = { getStripe, getWebhookSecret };
