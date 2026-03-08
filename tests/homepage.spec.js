const { test, expect } = require('@playwright/test');

test.describe('Homepage Sections', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for preloader to hide
    await page.locator('#preloader').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  });

  test('hero section is visible with CTA', async ({ page }) => {
    const hero = page.locator('.hero');
    await expect(hero).toBeVisible();
    const ctaButton = hero.locator('a, button').first();
    await expect(ctaButton).toBeVisible();
  });

  test('courses section renders course cards', async ({ page }) => {
    const courses = page.locator('.course-card, .courses .card');
    const count = await courses.count();
    expect(count).toBeGreaterThan(0);
  });

  test('instructors section shows instructor cards', async ({ page }) => {
    const instructors = page.locator('.instructor-card');
    const count = await instructors.count();
    expect(count).toBeGreaterThan(0);
  });

  test('testimonials section exists', async ({ page }) => {
    const testimonials = page.locator('.testimonials-section');
    await expect(testimonials).toBeVisible();
  });

  test('FAQ section has working accordion', async ({ page }) => {
    const faqItems = page.locator('.faq-item');
    const count = await faqItems.count();
    expect(count).toBeGreaterThan(0);

    // Click first FAQ item
    const firstQuestion = faqItems.first().locator('.faq-question');
    await firstQuestion.click();
    const answer = faqItems.first().locator('.faq-answer');
    // After click, answer should have a non-zero maxHeight
    const maxHeight = await answer.evaluate(el => el.style.maxHeight);
    expect(maxHeight).not.toBe('0px');
  });

  test('footer contains contact information', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    const footerText = await footer.textContent();
    expect(footerText).toContain('Impulse');
  });

  test('back to top button appears on scroll', async ({ page }) => {
    const backToTop = page.locator('.back-to-top, #backToTop');
    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 1000));
    await page.waitForTimeout(500);
    await expect(backToTop).toBeVisible();
  });
});
