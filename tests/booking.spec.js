const { test, expect } = require('@playwright/test');

test.describe('Booking Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pages/booking.html');
    await page.locator('#preloader').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  });

  test('booking form loads with step 1 visible', async ({ page }) => {
    const step1 = page.locator('.form-step[data-step="1"], .form-step.active, [data-step="1"]').first();
    await expect(step1).toBeVisible();
  });

  test('progress bar shows step indicators', async ({ page }) => {
    const progressSteps = page.locator('.progress-step, .step-indicator');
    const count = await progressSteps.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('course cards are clickable', async ({ page }) => {
    const courseCards = page.locator('.course-radio-card');
    const count = await courseCards.count();
    expect(count).toBeGreaterThan(0);

    // Click first course card label
    await courseCards.first().locator('label').click();
    // Radio should be checked
    const isChecked = await courseCards.first().locator('input[type="radio"]').isChecked();
    expect(isChecked).toBe(true);
  });

  test('transmission toggle switches between manual and automatic', async ({ page }) => {
    const toggle = page.locator('.transmission-toggle, .toggle-btn, [data-transmission]');
    const count = await toggle.count();
    if (count > 0) {
      // Find the automatic option
      const autoBtn = page.locator('.toggle-btn:has-text("Automatic"), [data-transmission="automatic"]').first();
      if (await autoBtn.count() > 0) {
        await autoBtn.click();
        const isActive = await autoBtn.evaluate(el =>
          el.classList.contains('active') || el.classList.contains('selected')
        );
        expect(isActive).toBe(true);
      }
    }
  });

  test('step 2 shows calendar when course selected', async ({ page }) => {
    // Select first course
    await page.locator('.course-radio-card').first().locator('label').click();

    // Click next/continue button
    const nextBtn = page.locator('button:has-text("Continue"), button:has-text("Next"), .btn-next').first();
    await nextBtn.click();

    // Calendar should be visible
    const calendar = page.locator('.calendar-widget');
    await expect(calendar).toBeVisible({ timeout: 5000 });
  });

  test('no console errors on page load', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/pages/booking.html');
    await page.waitForTimeout(2000);
    // Filter out known non-critical errors (e.g. favicon, external resources)
    const criticalErrors = errors.filter(e =>
      !e.includes('favicon') && !e.includes('404') && !e.includes('net::') && !e.includes('407') && !e.includes('Proxy')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
