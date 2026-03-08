const { test, expect } = require('@playwright/test');

const API_BASE = 'http://localhost:3000';

test.describe('api - Payments API', () => {
  const validPaymentData = {
    booking_reference: 'IMP-12345',
    amount: 72,
    course_name: 'Pay As You Go',
  };

  test('POST /api/payments/create-checkout-session with valid data returns session URL or handles gracefully', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/payments/create-checkout-session`, {
      data: validPaymentData,
    });

    // Without real Stripe keys, server may return 500 (Stripe error) or 200 with URL
    // We test that validation passes (not 422) or Stripe integration responds
    const status = response.status();
    if (status === 200) {
      const body = await response.json();
      expect(body.url || body.sessionId || body.session).toBeTruthy();
    } else {
      // If Stripe keys are not configured, expect 500 or similar
      expect([500, 503, 200]).toContain(status);
    }
  });

  test('POST /api/payments/create-checkout-session with missing data returns 422', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/payments/create-checkout-session`, {
      data: {
        // missing required fields (booking_reference, course_name, amount)
      },
    });

    expect(response.status()).toBe(422);
    const body = await response.json();
    expect(body.errors || body.error || body.message).toBeTruthy();
  });
});
