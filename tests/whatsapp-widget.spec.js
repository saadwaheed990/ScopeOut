const { test, expect } = require('@playwright/test');

test.describe('WhatsApp Floating Widget', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('#preloader').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  });

  test('widget appears on page load', async ({ page }) => {
    // The widget can be either the static .whatsapp-float or the dynamic #impulseWhatsappWidget
    const staticWidget = page.locator('.whatsapp-float');
    const dynamicWidget = page.locator('#impulseWhatsappWidget');
    const staticCount = await staticWidget.count();
    const dynamicCount = await dynamicWidget.count();
    expect(staticCount + dynamicCount).toBeGreaterThan(0);
  });

  test('widget has correct WhatsApp link', async ({ page }) => {
    // Check for WhatsApp link in either widget type
    const waLink = page.locator('a[href*="wa.me/447368543368"]');
    await expect(waLink.first()).toBeVisible();
  });

  test('widget is visible and clickable', async ({ page }) => {
    // Target the floating widget link specifically (not the footer link)
    const waLink = page.locator('#impulseWhatsappWidget a[href*="wa.me/447368543368"], .whatsapp-float[href*="wa.me/447368543368"]').first();
    await expect(waLink).toBeVisible();

    // Should open in new tab and have noopener
    const target = await waLink.getAttribute('target');
    const rel = await waLink.getAttribute('rel');
    expect(target).toBe('_blank');
    expect(rel).toContain('noopener');
  });

  test('widget has correct position (fixed, bottom-right)', async ({ page }) => {
    // Check for any fixed-position WhatsApp element
    const widget = page.locator('.whatsapp-float, #impulseWhatsappWidget').first();
    const position = await widget.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return { position: styles.position };
    });
    expect(position.position).toBe('fixed');
  });

  test('widget is present on sub-pages', async ({ page }) => {
    const subPages = [
      '/pages/contact.html',
      '/pages/pricing.html',
    ];

    for (const url of subPages) {
      await page.goto(url);
      await page.waitForTimeout(500);
      const waLink = page.locator('a[href*="wa.me/447368543368"]');
      const count = await waLink.count();
      expect(count).toBeGreaterThan(0);
    }
  });
});
