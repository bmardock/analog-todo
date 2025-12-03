const { test, expect } = require('@playwright/test');

test.describe('Visual Comparison - Todo Page', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport to mobile size to match screenshots
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to todo page
    await page.goto('/#todo');
    
    // Wait for route to load
    await page.waitForFunction(() => window.location.hash === '#todo' || window.location.hash === '#info', { timeout: 5000 });
    
    // If redirected to info, we need to initialize the database first
    const currentHash = await page.evaluate(() => window.location.hash);
    if (currentHash === '#info') {
      // Click through info page or initialize DB
      await page.goto('/#todo');
      await page.waitForFunction(() => window.location.hash === '#todo', { timeout: 5000 });
    }
    
    // Wait for page to fully load
    await page.waitForSelector('todoList', { timeout: 10000 });
    await page.waitForFunction(() => window.TodoApp && window.TodoApp.cardManager, { timeout: 5000 });
    await page.waitForTimeout(1000);
  });

  test('should match production UI layout', async ({ page }) => {
    // Wait for calendar to render
    await page.waitForSelector('cal.calendar', { timeout: 5000 });
    
    // Take screenshot of the entire page
    await page.screenshot({ 
      path: 'test-results/todo-current.png',
      fullPage: true 
    });
    
    // Verify header structure
    const header = page.locator('header').first();
    await expect(header).toBeVisible();
    
    // Verify #listType exists and shows "Today"
    const listType = page.locator('#listType').first();
    await expect(listType).toBeVisible();
    const listTypeText = await listType.textContent();
    expect(listTypeText.trim()).toBe('Today');
    
    // Verify date picker exists
    const picker = page.locator('.picker').first();
    await expect(picker).toBeVisible();
    
    // Verify picker uses Caveat font (handwritten style)
    const pickerFontFamily = await picker.evaluate((el) => {
      return window.getComputedStyle(el).fontFamily;
    });
    expect(pickerFontFamily).toContain('Caveat');
    
    // Verify picker has underline (text-decoration)
    const pickerTextDecoration = await picker.evaluate((el) => {
      return window.getComputedStyle(el).textDecoration;
    });
    expect(pickerTextDecoration).toContain('underline');
    
    // Verify cardSignal (three dots) exists in header
    const cardSignal = page.locator('.cardSignal').first();
    await expect(cardSignal).toBeVisible();
    
    // Verify cardSignal has 3 checkboxes
    const signalInputs = cardSignal.locator('input');
    const inputCount = await signalInputs.count();
    expect(inputCount).toBe(3);
    
    // Verify back card is hidden by default
    const backCard = page.locator('card.back');
    await expect(backCard).not.toBeVisible();
    
    // Verify front card is visible
    const frontCard = page.locator('card.front.active');
    await expect(frontCard).toBeVisible();
    
    // Verify flip button exists on front card and is visible
    const flipButton = frontCard.locator('.flip').first();
    await expect(flipButton).toBeVisible();
    
    // Verify flip button is positioned correctly (not in header)
    const flipBox = await flipButton.boundingBox();
    const headerBox = await header.boundingBox();
    
    if (flipBox && headerBox) {
      // Flip button should be below header
      expect(flipBox.y).toBeGreaterThan(headerBox.y + headerBox.height);
    }
    
    // Verify todoList exists and has 10 items
    const todoList = page.locator('todoList').first();
    await expect(todoList).toBeVisible();
    const todoItems = todoList.locator('todoItem');
    const itemCount = await todoItems.count();
    expect(itemCount).toBe(10);
    
    // Verify calendar exists
    const calendar = page.locator('cal.calendar').first();
    await expect(calendar).toBeVisible();
    
    // Verify braindump textarea is hidden (on back card)
    const braindump = page.locator('textarea[name="braindump"]');
    await expect(braindump).not.toBeVisible();
  });
});

