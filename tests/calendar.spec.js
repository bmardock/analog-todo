const { test, expect } = require('@playwright/test');

test.describe('Calendar Page Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#calendar');
    await page.waitForTimeout(2000);
  });

  test('should navigate to next month', async ({ page }) => {
    const nextButton = page.locator('#next-month');
    const monthYear = page.locator('.month-year');
    
    await expect(nextButton).toBeVisible();
    await expect(monthYear).toBeVisible();
    
    const initialMonth = await monthYear.textContent();
    
    await nextButton.click();
    await page.waitForTimeout(1000);
    
    const newMonth = await monthYear.textContent();
    expect(newMonth).not.toBe(initialMonth);
  });

  test('should navigate to previous month', async ({ page }) => {
    const prevButton = page.locator('#prev-month');
    const monthYear = page.locator('.month-year');
    
    await expect(prevButton).toBeVisible();
    
    const initialMonth = await monthYear.textContent();
    
    await prevButton.click();
    await page.waitForTimeout(1000);
    
    const newMonth = await monthYear.textContent();
    expect(newMonth).not.toBe(initialMonth);
  });

  test('should display current week goal', async ({ page }) => {
    // First set a goal on goal page
    await page.goto('/#goal');
    await page.waitForTimeout(1000);
    await page.locator('[name=goal]').fill('Test calendar goal');
    await page.locator('[name=goal]').blur();
    await page.waitForTimeout(500);
    
    // Navigate to calendar
    await page.goto('/#calendar');
    await page.waitForTimeout(2000);
    
    const goalTextarea = page.locator('[name=goal]');
    await expect(goalTextarea).toBeVisible();
    
    // Should show the current week's goal
    const goalText = await goalTextarea.inputValue();
    expect(goalText).toBe('Test calendar goal');
  });

  test('should allow clicking on calendar days', async ({ page }) => {
    const calendarDays = page.locator('#month_days .day_num:not(.ignore)');
    const firstDay = calendarDays.first();
    
    await expect(firstDay).toBeVisible();
    
    // Click should navigate to todo page with date
    await firstDay.click();
    await page.waitForTimeout(1000);
    
    // Should navigate to todo page
    expect(page.url()).toContain('#todo');
    expect(page.url()).toContain('date=');
  });

  test('should display week indicators', async ({ page }) => {
    const goalsContainer = page.locator('#goals');
    await expect(goalsContainer).toBeVisible();
    
    // Should have week indicators
    const weeks = page.locator('#goals .week');
    const weekCount = await weeks.count();
    expect(weekCount).toBeGreaterThan(0);
  });
});

