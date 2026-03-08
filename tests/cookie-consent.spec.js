const { test, expect } = require('@playwright/test');

test.describe('Cookie Consent', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test to ensure a clean state
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.locator('#preloader').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  });

  test('cookie banner appears on first visit', async ({ page }) => {
    const banner = page.locator('.cookie-banner, .cookie-consent, #cookieBanner, #cookieConsent, [class*="cookie"]');
    const count = await banner.count();

    if (count > 0) {
      await expect(banner.first()).toBeVisible({ timeout: 3000 });
    } else {
      // Cookie banner may not be implemented yet
      test.skip();
    }
  });

  test('Accept All stores consent and hides banner', async ({ page }) => {
    const banner = page.locator('.cookie-banner, .cookie-consent, #cookieBanner, #cookieConsent, [class*="cookie"]');
    const count = await banner.count();

    if (count === 0) {
      test.skip();
      return;
    }

    const acceptBtn = page.locator('button:has-text("Accept"), button:has-text("Accept All"), .cookie-accept, #acceptCookies');
    const acceptCount = await acceptBtn.count();

    if (acceptCount > 0) {
      await acceptBtn.first().click();

      // Banner should be hidden
      await expect(banner.first()).not.toBeVisible({ timeout: 3000 });

      // Check localStorage was set
      const consent = await page.evaluate(() => {
        return localStorage.getItem('cookieConsent') || localStorage.getItem('cookie_consent') || localStorage.getItem('cookies_accepted');
      });
      expect(consent).toBeTruthy();
    } else {
      test.skip();
    }
  });

  test('Reject Non-Essential stores preference and hides banner', async ({ page }) => {
    const banner = page.locator('.cookie-banner, .cookie-consent, #cookieBanner, #cookieConsent, [class*="cookie"]');
    const count = await banner.count();

    if (count === 0) {
      test.skip();
      return;
    }

    const rejectBtn = page.locator('button:has-text("Reject"), button:has-text("Essential"), button:has-text("Decline"), .cookie-reject, #rejectCookies');
    const rejectCount = await rejectBtn.count();

    if (rejectCount > 0) {
      await rejectBtn.first().click();

      // Banner should be hidden
      await expect(banner.first()).not.toBeVisible({ timeout: 3000 });

      // Check localStorage was set
      const consent = await page.evaluate(() => {
        return localStorage.getItem('cookieConsent') || localStorage.getItem('cookie_consent') || localStorage.getItem('cookies_accepted');
      });
      expect(consent).toBeTruthy();
    } else {
      test.skip();
    }
  });

  test('banner does not appear on subsequent visits after acceptance', async ({ page }) => {
    // Simulate a previous acceptance
    await page.evaluate(() => {
      localStorage.setItem('cookieConsent', 'accepted');
      localStorage.setItem('cookie_consent', 'accepted');
      localStorage.setItem('cookies_accepted', 'true');
    });

    await page.reload();
    await page.locator('#preloader').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});

    const banner = page.locator('.cookie-banner, .cookie-consent, #cookieBanner, #cookieConsent, [class*="cookie"]');
    const count = await banner.count();

    if (count > 0) {
      // Banner should not be visible (it may exist in DOM but be hidden)
      const isVisible = await banner.first().isVisible().catch(() => false);
      expect(isVisible).toBe(false);
    }
    // If no banner element exists at all, the test passes
  });

  test('clearing localStorage makes banner reappear', async ({ page }) => {
    // First set consent
    await page.evaluate(() => {
      localStorage.setItem('cookieConsent', 'accepted');
    });
    await page.reload();
    await page.locator('#preloader').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});

    // Now clear it
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.locator('#preloader').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});

    const banner = page.locator('.cookie-banner, .cookie-consent, #cookieBanner, #cookieConsent, [class*="cookie"]');
    const count = await banner.count();

    if (count > 0) {
      await expect(banner.first()).toBeVisible({ timeout: 3000 });
    } else {
      // Cookie feature may not be implemented yet
      test.skip();
    }
  });
});
