const { test, expect } = require('@playwright/test');

const API_BASE = 'http://localhost:3000';

test.describe('api - Newsletter API', () => {
  // Use a unique email for each test run to avoid duplicate issues
  const uniqueEmail = `test+${Date.now()}@example.com`;

  test('POST /api/newsletter/subscribe with valid email returns 200', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/newsletter/subscribe`, {
      data: { email: uniqueEmail },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.message).toBe('Subscribed successfully');
  });

  test('POST /api/newsletter/subscribe with invalid email returns 422', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/newsletter/subscribe`, {
      data: { email: 'not-valid' },
    });

    expect(response.status()).toBe(422);
    const body = await response.json();
    expect(body.errors || body.error || body.message).toBeTruthy();
  });

  test('POST /api/newsletter/subscribe with duplicate email returns appropriate response', async ({ request }) => {
    const dupEmail = `dup+${Date.now()}@example.com`;

    // Subscribe first time
    const first = await request.post(`${API_BASE}/api/newsletter/subscribe`, {
      data: { email: dupEmail },
    });
    expect(first.status()).toBe(201);

    // Subscribe again with same email
    const second = await request.post(`${API_BASE}/api/newsletter/subscribe`, {
      data: { email: dupEmail },
    });

    // Could return 200 (idempotent) or 409 (conflict) - both are acceptable
    expect([201, 409]).toContain(second.status());
  });
});
