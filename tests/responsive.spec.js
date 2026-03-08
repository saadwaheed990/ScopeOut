const { test, expect } = require('@playwright/test');

const viewports = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

test.describe('Responsive Design', () => {
  for (const vp of viewports) {
    test(`homepage renders correctly on ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize(vp);
      await page.goto('/');
      await page.locator('#preloader').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});

      // Hero should be visible
      const hero = page.locator('.hero');
      await expect(hero).toBeVisible();

      // No horizontal overflow
      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasOverflow).toBe(false);
    });

    test(`booking page renders on ${vp.name}`, async ({ page }) => {
      await page.setViewportSize(vp);
      await page.goto('/pages/booking.html');
      await page.locator('#preloader').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});

      const body = page.locator('body');
      await expect(body).toBeVisible();

      // No horizontal overflow
      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasOverflow).toBe(false);
    });
  }
});
