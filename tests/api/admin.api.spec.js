const { test, expect } = require('@playwright/test');

const API_BASE = 'http://localhost:3000';

test.describe('api - Admin API', () => {
  test('GET /api/admin/bookings returns array', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/admin/bookings`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body.bookings || body)).toBe(true);
  });

  test('GET /api/admin/contacts returns array', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/admin/contacts`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body.contacts || body)).toBe(true);
  });

  test('GET /api/admin/stats returns stats object', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/admin/stats`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    // Stats should be an object with relevant properties
    expect(typeof body).toBe('object');
    expect(body).not.toBeNull();
    // Should contain some kind of count or stats data
    const hasStats = body.totalBookings !== undefined ||
                     body.bookings !== undefined ||
                     body.total !== undefined ||
                     Object.keys(body).length > 0;
    expect(hasStats).toBe(true);
  });
});
