const { test, expect } = require('@playwright/test');

test.describe('Preloader', () => {
  test('preloader disappears on index page', async ({ page }) => {
    await page.goto('/');
    const preloader = page.locator('#preloader');
    await expect(preloader).toHaveClass(/loaded/, { timeout: 5000 });
    await expect(preloader).toHaveCSS('opacity', '0');
    await expect(preloader).toHaveCSS('visibility', 'hidden');
    await expect(preloader).toHaveCSS('pointer-events', 'none');
  });

  test('preloader disappears on about page', async ({ page }) => {
    await page.goto('/pages/about.html');
    const preloader = page.locator('#preloader');
    await expect(preloader).toHaveClass(/loaded/, { timeout: 5000 });
    await expect(preloader).toHaveCSS('visibility', 'hidden');
  });

  test('preloader disappears on booking page', async ({ page }) => {
    await page.goto('/pages/booking.html');
    const preloader = page.locator('#preloader');
    await expect(preloader).toHaveClass(/loaded/, { timeout: 5000 });
    await expect(preloader).toHaveCSS('visibility', 'hidden');
  });

  test('preloader disappears on services page', async ({ page }) => {
    await page.goto('/pages/services.html');
    const preloader = page.locator('#preloader');
    await expect(preloader).toHaveClass(/loaded/, { timeout: 5000 });
    await expect(preloader).toHaveCSS('visibility', 'hidden');
  });

  test('preloader disappears on pricing page', async ({ page }) => {
    await page.goto('/pages/pricing.html');
    const preloader = page.locator('#preloader');
    await expect(preloader).toHaveClass(/loaded/, { timeout: 5000 });
    await expect(preloader).toHaveCSS('visibility', 'hidden');
  });

  test('preloader disappears on contact page', async ({ page }) => {
    await page.goto('/pages/contact.html');
    const preloader = page.locator('#preloader');
    await expect(preloader).toHaveClass(/loaded/, { timeout: 5000 });
    await expect(preloader).toHaveCSS('visibility', 'hidden');
  });

  test('preloader disappears on areas page', async ({ page }) => {
    await page.goto('/pages/areas.html');
    const preloader = page.locator('#preloader');
    await expect(preloader).toHaveClass(/loaded/, { timeout: 5000 });
    await expect(preloader).toHaveCSS('visibility', 'hidden');
  });
});
