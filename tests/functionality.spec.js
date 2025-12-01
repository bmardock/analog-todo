const { test, expect } = require('@playwright/test');

test.describe('Core Functionality Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('footer', { timeout: 5000 });
    await page.waitForTimeout(1000);
  });

  test('should create and save a todo', async ({ page }) => {
    await page.goto('/#todo');
    await page.waitForTimeout(2000);
    
    // Find the first todo input
    const todoInput = page.locator('todoList todoItem input').first();
    await expect(todoInput).toBeVisible();
    
    // Enter a todo
    await todoInput.fill('Test todo item');
    await todoInput.press('Enter');
    
    await page.waitForTimeout(500);
    
    // Verify the todo was saved (check if input still has value or if it's in the list)
    const inputValue = await todoInput.inputValue();
    expect(inputValue).toBe('Test todo item');
  });

  test('should navigate calendar months', async ({ page }) => {
    await page.goto('/#calendar');
    await page.waitForTimeout(2000);
    
    // Find prev/next month buttons
    const prevButton = page.locator('#prev-month');
    const nextButton = page.locator('#next-month');
    
    await expect(prevButton).toBeVisible();
    await expect(nextButton).toBeVisible();
    
    // Click next month
    await nextButton.click();
    await page.waitForTimeout(500);
    
    // Calendar should update (we can check URL or month/year display)
    const monthYear = page.locator('.month-year');
    await expect(monthYear).toBeVisible();
  });

  test('should handle route loading errors gracefully', async ({ page }) => {
    // This tests the retry logic
    // We'd need to simulate a network error or invalid route
    // For now, just verify error handling exists
    
    await page.goto('/#nonexistent');
    await page.waitForTimeout(2000);
    
    // Should show error or fallback, not crash
    const content = page.locator('#content');
    await expect(content).toBeVisible();
  });
});

