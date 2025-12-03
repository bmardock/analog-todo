const { test, expect } = require('@playwright/test');

test.describe('Goal Page Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#goal');
    await page.waitForTimeout(2000);
  });

  test('should save weekly goal text', async ({ page }) => {
    const goalTextarea = page.locator('[name=goal]');
    await expect(goalTextarea).toBeVisible();
    
    // Enter a goal
    await goalTextarea.fill('Test weekly goal');
    await goalTextarea.blur();
    await page.waitForTimeout(500);
    
    // Navigate away and back to verify persistence
    await page.goto('/#todo');
    await page.waitForTimeout(1000);
    await page.goto('/#goal');
    await page.waitForTimeout(1000);
    
    // Goal should still be there
    const savedGoal = await goalTextarea.inputValue();
    expect(savedGoal).toBe('Test weekly goal');
  });

  test('should show ICS link when both times are set', async ({ page }) => {
    const startTime = page.locator('[name=start]');
    const reviewTime = page.locator('[name=review]');
    const icsLink = page.locator('#generate-ics');
    
    // Initially should be hidden
    await expect(icsLink).not.toBeVisible();
    
    // Set start time
    await startTime.fill('09:00');
    await startTime.blur();
    await page.waitForTimeout(500);
    
    // Still hidden (need both)
    await expect(icsLink).not.toBeVisible();
    
    // Set review time
    await reviewTime.fill('17:00');
    await reviewTime.blur();
    await page.waitForTimeout(500);
    
    // Now should be visible
    await expect(icsLink).toBeVisible();
  });

  test('should save times with goal', async ({ page }) => {
    const goalTextarea = page.locator('[name=goal]');
    const startTime = page.locator('[name=start]');
    const reviewTime = page.locator('[name=review]');
    
    await goalTextarea.fill('Goal with times');
    await startTime.fill('08:00');
    await reviewTime.fill('18:00');
    
    await page.waitForTimeout(1000);
    
    // Navigate away and back
    await page.goto('/#todo');
    await page.waitForTimeout(1000);
    await page.goto('/#goal');
    await page.waitForTimeout(1000);
    
    // Verify all fields persisted
    expect(await goalTextarea.inputValue()).toBe('Goal with times');
    expect(await startTime.inputValue()).toBe('08:00');
    expect(await reviewTime.inputValue()).toBe('18:00');
  });

  test('should generate ICS file when clicked', async ({ page }) => {
    const startTime = page.locator('[name=start]');
    const reviewTime = page.locator('[name=review]');
    const icsLink = page.locator('#generate-ics');
    
    await startTime.fill('09:00');
    await reviewTime.fill('17:00');
    await page.waitForTimeout(500);
    
    // Set up download listener
    const downloadPromise = page.waitForEvent('download');
    await icsLink.click();
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toBe('calendar.ics');
  });
});



