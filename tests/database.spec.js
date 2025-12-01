const { test, expect } = require('@playwright/test');

test.describe('Database Operations Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('footer', { timeout: 5000 });
    await page.waitForTimeout(1000);
  });

  test('should initialize database without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    await page.waitForTimeout(2000);
    
    // Check that database initialized
    const dbInitialized = await page.evaluate(() => {
      return typeof databaseOpen === 'function';
    });
    
    expect(dbInitialized).toBe(true);
    expect(errors.length).toBe(0);
  });

  test('should save and retrieve weekly goals', async ({ page }) => {
    await page.goto('/#goal');
    await page.waitForTimeout(2000);
    
    const goalTextarea = page.locator('[name=goal]');
    await expect(goalTextarea).toBeVisible();
    
    // Enter a goal
    await goalTextarea.fill('Test weekly goal');
    await goalTextarea.blur();
    
    await page.waitForTimeout(1000);
    
    // Navigate away and back to verify persistence
    await page.goto('/#todo');
    await page.waitForTimeout(1000);
    await page.goto('/#goal');
    await page.waitForTimeout(1000);
    
    // Goal should still be there
    const savedGoal = await goalTextarea.inputValue();
    expect(savedGoal).toBe('Test weekly goal');
  });
});

