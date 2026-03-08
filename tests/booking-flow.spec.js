const { test, expect } = require('@playwright/test');

test.describe('Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pages/booking.html');
    await page.locator('#preloader').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  });

  test('page loads with step 1 visible', async ({ page }) => {
    await expect(page.locator('#step1')).toBeVisible();
    await expect(page.locator('#step2')).not.toBeVisible();
    await expect(page.locator('#step3')).not.toBeVisible();
    await expect(page.locator('#step4')).not.toBeVisible();
  });

  test('step 1: transmission toggle switches between manual and automatic', async ({ page }) => {
    // Manual should be checked by default
    await expect(page.locator('#transManual')).toBeChecked();

    // Click automatic
    await page.locator('label[for="transAuto"]').click();
    await expect(page.locator('#transAuto')).toBeChecked();
    await expect(page.locator('#transManual')).not.toBeChecked();
  });

  test('step 1: can select a course card', async ({ page }) => {
    const firstCard = page.locator('.course-radio-card').first();
    await firstCard.locator('label').click();
    const radio = firstCard.locator('input[type="radio"]');
    await expect(radio).toBeChecked();
  });

  test('step 1: next button advances to step 2', async ({ page }) => {
    // Select a course first
    await page.locator('label[for="coursePayg"]').click();

    // Click next
    await page.locator('#step1 .btn-next').click();

    await expect(page.locator('#step2')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('#step1')).not.toBeVisible();
  });

  test('step 2: calendar widget displays', async ({ page }) => {
    // Navigate to step 2
    await page.locator('label[for="coursePayg"]').click();
    await page.locator('#step1 .btn-next').click();
    await expect(page.locator('#step2')).toBeVisible({ timeout: 3000 });

    await expect(page.locator('.calendar-widget')).toBeVisible();
    await expect(page.locator('#calendarGrid')).toBeVisible();
  });

  test('step 2: can select a date from the calendar', async ({ page }) => {
    await page.locator('label[for="coursePayg"]').click();
    await page.locator('#step1 .btn-next').click();
    await expect(page.locator('#step2')).toBeVisible({ timeout: 3000 });

    // Find an available (clickable) calendar day
    const availableDay = page.locator('.calendar-grid .calendar-day.available').first();
    const dayCount = await availableDay.count();
    if (dayCount > 0) {
      await availableDay.click();
      const isSelected = await availableDay.evaluate(el =>
        el.classList.contains('selected') || el.classList.contains('active')
      );
      expect(isSelected).toBe(true);
    }
  });

  test('step 2: time slots are displayed', async ({ page }) => {
    await page.locator('label[for="coursePayg"]').click();
    await page.locator('#step1 .btn-next').click();
    await expect(page.locator('#step2')).toBeVisible({ timeout: 3000 });

    const timeSlots = page.locator('.time-slot');
    const count = await timeSlots.count();
    expect(count).toBeGreaterThan(0);
  });

  test('step 2: can select a time slot', async ({ page }) => {
    await page.locator('label[for="coursePayg"]').click();
    await page.locator('#step1 .btn-next').click();
    await expect(page.locator('#step2')).toBeVisible({ timeout: 3000 });

    const timeSlot = page.locator('.time-slot').first();
    await timeSlot.click();
    await expect(timeSlot).toHaveClass(/active/);
  });

  test('step 3: personal info form displays', async ({ page }) => {
    // Navigate to step 3
    await page.locator('label[for="coursePayg"]').click();
    await page.locator('#step1 .btn-next').click();
    await expect(page.locator('#step2')).toBeVisible({ timeout: 3000 });

    // Select a date and time
    const availableDay = page.locator('.calendar-grid .calendar-day.available').first();
    if (await availableDay.count() > 0) {
      await availableDay.click();
    }
    await page.locator('.time-slot').first().click();

    await page.locator('#step2 .btn-next').click();
    await expect(page.locator('#step3')).toBeVisible({ timeout: 3000 });

    // Personal details fields
    await expect(page.locator('#fullName')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#phone')).toBeVisible();
  });

  test('step 3: validation works for required fields', async ({ page }) => {
    // Navigate to step 3
    await page.locator('label[for="coursePayg"]').click();
    await page.locator('#step1 .btn-next').click();
    await expect(page.locator('#step2')).toBeVisible({ timeout: 3000 });

    const availableDay = page.locator('.calendar-grid .calendar-day.available').first();
    if (await availableDay.count() > 0) {
      await availableDay.click();
    }
    await page.locator('.time-slot').first().click();

    await page.locator('#step2 .btn-next').click();
    await expect(page.locator('#step3')).toBeVisible({ timeout: 3000 });

    // Try to proceed without filling required fields
    await page.locator('#step3 .btn-next').click();

    // Should still be on step 3 (validation prevents advancement)
    await expect(page.locator('#step3')).toBeVisible();
  });

  test('progress bar shows correct number of steps', async ({ page }) => {
    const progressSteps = page.locator('.progress-step');
    await expect(progressSteps).toHaveCount(4);
  });

  test('progress bar updates with each step', async ({ page }) => {
    // Step 1 should be active
    await expect(page.locator('.progress-step[data-step="1"]')).toHaveClass(/active/);

    // Navigate to step 2
    await page.locator('label[for="coursePayg"]').click();
    await page.locator('#step1 .btn-next').click();
    await expect(page.locator('#step2')).toBeVisible({ timeout: 3000 });

    // Step 2 should now be active, step 1 should be completed
    await expect(page.locator('.progress-step[data-step="2"]')).toHaveClass(/active/);
    await expect(page.locator('.progress-step[data-step="1"]')).toHaveClass(/completed/);
  });

  test('back button works to go to previous steps', async ({ page }) => {
    // Navigate to step 2
    await page.locator('label[for="coursePayg"]').click();
    await page.locator('#step1 .btn-next').click();
    await expect(page.locator('#step2')).toBeVisible({ timeout: 3000 });

    // Click back
    await page.locator('#step2 .btn-back').click();
    await expect(page.locator('#step1')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('#step2')).not.toBeVisible();
  });

  test('full flow: complete all 4 steps and submit', async ({ page }) => {
    // Step 1: Select course
    await page.locator('label[for="coursePayg"]').click();
    await page.locator('#step1 .btn-next').click();
    await expect(page.locator('#step2')).toBeVisible({ timeout: 3000 });

    // Step 2: Select date and time
    const availableDay = page.locator('.calendar-grid .calendar-day.available').first();
    if (await availableDay.count() > 0) {
      await availableDay.click();
    }
    await page.locator('.time-slot').first().click();
    await page.locator('#step2 .btn-next').click();
    await expect(page.locator('#step3')).toBeVisible({ timeout: 3000 });

    // Step 3: Fill personal details
    await page.locator('#fullName').fill('Test User');
    await page.locator('#email').fill('test@example.com');
    await page.locator('#phone').fill('07123456789');
    await page.locator('input[name="licence"][value="Yes"]').click();
    await page.locator('#step3 .btn-next').click();
    await expect(page.locator('#step4')).toBeVisible({ timeout: 3000 });

    // Step 4: Review and confirm
    await expect(page.locator('#sumCourse')).not.toHaveText('\u2014');
    await expect(page.locator('#sumName')).toHaveText('Test User');
    await expect(page.locator('#sumEmail')).toHaveText('test@example.com');

    // Accept terms and confirm
    await page.locator('#termsAgree').check();
    await page.locator('#btnConfirm').click();

    // Success modal should appear
    await expect(page.locator('#successModal')).toHaveClass(/active/, { timeout: 3000 });
    const refText = await page.locator('#refNumber').textContent();
    expect(refText).toMatch(/^IMP-[A-Z0-9]{5}$/);
  });
});
