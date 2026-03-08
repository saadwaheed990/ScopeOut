const { test, expect } = require('@playwright/test');

test.describe('Pricing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pages/pricing.html');
    await page.locator('#preloader').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  });

  test('page loads with pricing tables visible', async ({ page }) => {
    const pricingSection = page.locator('#pricing');
    await expect(pricingSection).toBeVisible();

    // Manual table should be visible by default
    const manualTable = page.locator('#manual');
    await expect(manualTable).toHaveClass(/tab-active/);
  });

  test('manual/automatic tab toggle works', async ({ page }) => {
    // Manual tab should be active by default
    const manualBtn = page.locator('.tab-btn[data-tab="manual"]');
    const autoBtn = page.locator('.tab-btn[data-tab="automatic"]');

    await expect(manualBtn).toHaveClass(/tab-active/);
    await expect(autoBtn).not.toHaveClass(/tab-active/);

    // Click automatic tab
    await autoBtn.click();

    await expect(autoBtn).toHaveClass(/tab-active/);
    await expect(manualBtn).not.toHaveClass(/tab-active/);
  });

  test('switching tabs shows correct pricing table', async ({ page }) => {
    // Manual table should be visible initially
    await expect(page.locator('#manual')).toHaveClass(/tab-active/);
    await expect(page.locator('#automatic')).not.toHaveClass(/tab-active/);

    // Switch to automatic
    await page.locator('.tab-btn[data-tab="automatic"]').click();

    await expect(page.locator('#automatic')).toHaveClass(/tab-active/);
    await expect(page.locator('#manual')).not.toHaveClass(/tab-active/);

    // Switch back to manual
    await page.locator('.tab-btn[data-tab="manual"]').click();

    await expect(page.locator('#manual')).toHaveClass(/tab-active/);
    await expect(page.locator('#automatic')).not.toHaveClass(/tab-active/);
  });

  test('all course cards display with prices in manual table', async ({ page }) => {
    const manualCards = page.locator('#manual .price-card');
    const count = await manualCards.count();
    expect(count).toBeGreaterThan(5);

    // Each card should have a price
    for (let i = 0; i < count; i++) {
      const priceText = await manualCards.nth(i).locator('.price-card-price').textContent();
      expect(priceText).toMatch(/£/);
    }
  });

  test('featured cards have correct styling', async ({ page }) => {
    const featuredCard = page.locator('#manual .price-card.featured');
    const featuredCount = await featuredCard.count();
    expect(featuredCount).toBeGreaterThan(0);

    // Featured card should have a special border
    const borderStyle = await featuredCard.first().evaluate(el => {
      return window.getComputedStyle(el).borderColor;
    });
    expect(borderStyle).toBeTruthy();
  });

  test('premium cards exist', async ({ page }) => {
    const premiumCard = page.locator('#manual .price-card.premium');
    const count = await premiumCard.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Book Now buttons link to booking page', async ({ page }) => {
    const bookButtons = page.locator('#manual .price-card .btn');
    const count = await bookButtons.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const href = await bookButtons.nth(i).getAttribute('href');
      expect(href).toBe('booking.html');
    }
  });

  test('payment plans section displays', async ({ page }) => {
    const paymentSection = page.locator('.payment-plans');
    await expect(paymentSection).toBeVisible();

    // Check plan options exist
    const planOptions = page.locator('.plan-option');
    const count = await planOptions.count();
    expect(count).toBe(4);

    // Verify month values
    const months = ['3', '6', '9', '12'];
    for (let i = 0; i < months.length; i++) {
      const monthText = await planOptions.nth(i).locator('.plan-months').textContent();
      expect(monthText).toBe(months[i]);
    }
  });

  test('what\'s included section displays', async ({ page }) => {
    const includedSection = page.locator('.whats-included');
    await expect(includedSection).toBeVisible();

    const items = page.locator('.included-item');
    const count = await items.count();
    expect(count).toBeGreaterThan(0);
  });

  test('automatic table has price cards', async ({ page }) => {
    await page.locator('.tab-btn[data-tab="automatic"]').click();

    const autoCards = page.locator('#automatic .price-card');
    const count = await autoCards.count();
    expect(count).toBeGreaterThan(5);
  });
});
