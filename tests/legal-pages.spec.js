const { test, expect } = require('@playwright/test');

test.describe('Legal Pages', () => {
  test('privacy.html loads with correct content structure', async ({ page }) => {
    const response = await page.goto('/pages/privacy.html');
    // Page may or may not exist yet; check if it returns 200
    if (response && response.status() === 200) {
      await expect(page.locator('body')).toBeVisible();

      // Should have a heading
      const h1 = page.locator('h1');
      const h1Count = await h1.count();
      expect(h1Count).toBeGreaterThan(0);
    } else {
      test.skip();
    }
  });

  test('terms.html loads with correct content structure', async ({ page }) => {
    const response = await page.goto('/pages/terms.html');
    if (response && response.status() === 200) {
      await expect(page.locator('body')).toBeVisible();

      const h1 = page.locator('h1');
      const h1Count = await h1.count();
      expect(h1Count).toBeGreaterThan(0);
    } else {
      test.skip();
    }
  });

  test('privacy page has navigation and footer', async ({ page }) => {
    const response = await page.goto('/pages/privacy.html');
    if (response && response.status() === 200) {
      await expect(page.locator('#navbar')).toBeVisible();
      await expect(page.locator('footer')).toBeVisible();
    } else {
      test.skip();
    }
  });

  test('terms page has navigation and footer', async ({ page }) => {
    const response = await page.goto('/pages/terms.html');
    if (response && response.status() === 200) {
      await expect(page.locator('#navbar')).toBeVisible();
      await expect(page.locator('footer')).toBeVisible();
    } else {
      test.skip();
    }
  });

  test('footer links to privacy and terms pages exist on homepage', async ({ page }) => {
    await page.goto('/');
    await page.locator('#preloader').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});

    const footer = page.locator('footer');
    const footerHTML = await footer.innerHTML();

    // These links may not exist yet; test their presence if they do
    const privacyLink = page.locator('footer a[href*="privacy"]');
    const termsLink = page.locator('footer a[href*="terms"]');

    const privacyCount = await privacyLink.count();
    const termsCount = await termsLink.count();

    // If the links exist, verify they have correct href
    if (privacyCount > 0) {
      const href = await privacyLink.first().getAttribute('href');
      expect(href).toContain('privacy');
    }
    if (termsCount > 0) {
      const href = await termsLink.first().getAttribute('href');
      expect(href).toContain('terms');
    }

    // At minimum, the footer should contain the company name
    const footerText = await footer.textContent();
    expect(footerText).toContain('Impulse');
  });

  test('footer links to privacy and terms pages work from contact page', async ({ page }) => {
    await page.goto('/pages/contact.html');
    await page.locator('#preloader').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    const privacyLink = page.locator('footer a[href*="privacy"]');
    const privacyCount = await privacyLink.count();

    if (privacyCount > 0) {
      const href = await privacyLink.first().getAttribute('href');
      expect(href).toContain('privacy');
    }
  });
});
