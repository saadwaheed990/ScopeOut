const { test, expect } = require('@playwright/test');

const API_BASE = 'http://localhost:3000';

test.describe('api - Bookings API', () => {
  const validBooking = {
    name: 'Test User',
    email: 'test@example.com',
    phone: '07123456789',
    course: 'Pay As You Go',
    transmission: 'manual',
    date: '2026-04-15',
    time_slot: '10:00',
    notes: '',
  };

  test('POST /api/bookings with valid data returns 201 with booking reference', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/bookings`, {
      data: validBooking,
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.booking).toBeTruthy();
    expect(body.booking.reference).toMatch(/^IMP-[A-Z0-9]{5}$/);
  });

  test('POST /api/bookings with missing fields returns 422', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/bookings`, {
      data: {
        name: 'Test User',
      },
    });

    expect(response.status()).toBe(422);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  test('POST /api/bookings with invalid email returns 422', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/bookings`, {
      data: {
        ...validBooking,
        email: 'not-a-valid-email',
      },
    });

    expect(response.status()).toBe(422);
  });

  test('GET /api/bookings/:reference returns booking details', async ({ request }) => {
    const createResponse = await request.post(`${API_BASE}/api/bookings`, {
      data: validBooking,
    });
    expect(createResponse.status()).toBe(201);
    const createBody = await createResponse.json();
    const reference = createBody.booking.reference;

    const response = await request.get(`${API_BASE}/api/bookings/${reference}`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.booking.reference).toBe(reference);
    expect(body.booking.name).toBe(validBooking.name);
    expect(body.booking.email).toBe(validBooking.email);
  });

  test('GET /api/bookings/INVALID returns 404', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/bookings/IMP-ZZZZZ`);
    expect(response.status()).toBe(404);
  });

  test('booking reference matches IMP-XXXXX format', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/bookings`, {
      data: validBooking,
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.booking.reference).toMatch(/^IMP-[A-Z0-9]{5}$/);
  });
});
