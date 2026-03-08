const { test, expect } = require('@playwright/test');

test.describe('Contact Form Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pages/contact.html');
    await page.locator('#preloader').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  });

  test('page loads correctly with all contact cards visible', async ({ page }) => {
    // 4 contact cards + 4 social media cards = 8 total feature-cards on page
    const contactCards = page.locator('.why-choose .feature-card');
    const count = await contactCards.count();
    expect(count).toBeGreaterThanOrEqual(4);

    // Verify card headings
    await expect(page.locator('.feature-card h3:has-text("Phone")')).toBeVisible();
    await expect(page.locator('.feature-card h3:has-text("Email")')).toBeVisible();
    await expect(page.locator('.feature-card h3:has-text("Address")')).toBeVisible();
    await expect(page.locator('.feature-card h3:has-text("WhatsApp")')).toBeVisible();
  });

  test('form fields render correctly', async ({ page }) => {
    await expect(page.locator('#contactName')).toBeVisible();
    await expect(page.locator('#contactEmail')).toBeVisible();
    await expect(page.locator('#contactPhone')).toBeVisible();
    await expect(page.locator('#contactSubject')).toBeVisible();
    await expect(page.locator('#contactMessage')).toBeVisible();
  });

  test('submitting empty form shows validation errors', async ({ page }) => {
    // Click submit without filling anything
    await page.locator('#contactForm button[type="submit"]').click();

    // Error messages should appear
    await expect(page.locator('#nameError')).toBeVisible();
    await expect(page.locator('#emailError')).toBeVisible();
    await expect(page.locator('#subjectError')).toBeVisible();
    await expect(page.locator('#messageError')).toBeVisible();
  });

  test('invalid email shows error on blur', async ({ page }) => {
    await page.locator('#contactEmail').fill('not-an-email');
    await page.locator('#contactEmail').blur();

    await expect(page.locator('#emailError')).toBeVisible();
  });

  test('valid form submission shows success message', async ({ page }) => {
    // Fill in the form
    await page.locator('#contactName').fill('John Doe');
    await page.locator('#contactEmail').fill('john@example.com');
    await page.locator('#contactSubject').selectOption('general');
    await page.locator('#contactMessage').fill('This is a test message.');

    // Submit
    await page.locator('#contactForm button[type="submit"]').click();

    // Wait for the simulated submission (1500ms setTimeout in inline JS)
    await expect(page.locator('#formSuccess')).toBeVisible({ timeout: 5000 });
    const successText = await page.locator('#formSuccess').textContent();
    expect(successText).toContain('Message Sent Successfully');
  });

  test('Google Maps iframe is present', async ({ page }) => {
    const iframe = page.locator('iframe[src*="google.com/maps"]');
    await expect(iframe).toBeAttached();
  });

  test('opening hours display correctly', async ({ page }) => {
    const hoursSection = page.locator('text=Opening Hours');
    await expect(hoursSection).toBeVisible();

    const pageText = await page.locator('body').textContent();
    expect(pageText).toContain('Monday - Friday');
    expect(pageText).toContain('9:00 AM - 9:00 PM');
    expect(pageText).toContain('Saturday - Sunday');
    expect(pageText).toContain('9:00 AM - 6:00 PM');
  });

  test('social media links are present with correct href attributes', async ({ page }) => {
    const socialLinks = [
      { text: 'Facebook', href: 'https://www.facebook.com/ImpulseDriveUK/' },
      { text: 'Instagram', href: 'https://www.instagram.com/impulsedrive/' },
      { text: 'YouTube', href: 'https://www.youtube.com/@ImpulseDrive' },
      { text: 'TikTok', href: 'https://www.tiktok.com/@impulsedrive' },
    ];

    for (const link of socialLinks) {
      const el = page.locator(`a.feature-card:has(h3:has-text("${link.text}"))`);
      await expect(el).toHaveAttribute('href', link.href);
      await expect(el).toHaveAttribute('target', '_blank');
      await expect(el).toHaveAttribute('rel', 'noopener');
    }
  });
});
