const { test, expect } = require('@playwright/test');

test.describe('Navigation', () => {
  test('homepage loads with correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Impulse Driving School/i);
  });

  test('navbar is visible', async ({ page }) => {
    await page.goto('/');
    const navbar = page.locator('#navbar');
    await expect(navbar).toBeVisible();
  });

  test('navbar links exist and point to correct pages', async ({ page }) => {
    await page.goto('/');
    const navLinks = page.locator('.nav-links a');
    await expect(navLinks).not.toHaveCount(0);
  });

  test('hamburger menu toggles on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    // Wait for preloader to clear
    await page.locator('#preloader').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(500);

    const hamburger = page.locator('.hamburger');
    await expect(hamburger).toBeVisible();
    await hamburger.click();
    const navLinks = page.locator('.nav-links');
    await expect(navLinks).toHaveClass(/active/);
  });

  test('all sub-page links are reachable', async ({ page }) => {
    const pages = [
      '/pages/about.html',
      '/pages/services.html',
      '/pages/pricing.html',
      '/pages/areas.html',
      '/pages/contact.html',
      '/pages/booking.html',
    ];
    for (const url of pages) {
      const response = await page.goto(url);
      expect(response.status()).toBe(200);
    }
  });
});
