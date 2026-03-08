const { test, expect } = require('@playwright/test');

const API_BASE = 'http://localhost:3000';

test.describe('api - Contact API', () => {
  const validContact = {
    name: 'John Doe',
    email: 'john@example.com',
    subject: 'general',
    message: 'This is a test message from the contact form.',
    phone: '07123456789',
  };

  test('POST /api/contact with valid data returns 200', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/contact`, {
      data: validContact,
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.message).toBe('Message sent successfully');
  });

  test('POST /api/contact with missing fields returns 422', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/contact`, {
      data: {
        name: 'John Doe',
        // missing email, subject, message
      },
    });

    expect(response.status()).toBe(422);
    const body = await response.json();
    expect(body.errors || body.error || body.message).toBeTruthy();
  });

  test('POST /api/contact with invalid email returns 422', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/contact`, {
      data: {
        ...validContact,
        email: 'invalid-email',
      },
    });

    expect(response.status()).toBe(422);
    const body = await response.json();
    expect(body.errors || body.error || body.message).toBeTruthy();
  });
});
