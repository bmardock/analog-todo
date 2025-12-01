const { test, expect } = require('@playwright/test');

test.describe('Card Page Functionality (Next/Someday)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#next');
    await page.waitForTimeout(2000);
  });

  test('should create a new card', async ({ page }) => {
    const picker = page.locator('.picker');
    await expect(picker).toBeVisible();
    
    // Click "Add New" in recent list
    const addNewButton = page.locator('#recent_list .circle[data-text="Add New"]');
    if (await addNewButton.count() > 0) {
      await addNewButton.click();
      await page.waitForTimeout(500);
      
      // Picker should be editable
      const isReadonly = await picker.getAttribute('readonly');
      expect(isReadonly).toBeNull();
    }
  });

  test('should save card name', async ({ page }) => {
    const picker = page.locator('.picker');
    const cardName = `Test Card ${Date.now()}`;
    
    await picker.fill(cardName);
    await picker.blur();
    await page.waitForTimeout(1000);
    
    // Navigate away and back
    await page.goto('/#todo');
    await page.waitForTimeout(1000);
    await page.goto('/#next');
    await page.waitForTimeout(2000);
    
    // Card should be in recent list
    const cardInList = page.locator(`#recent_list .circle[data-text="${cardName}"]`);
    await expect(cardInList).toBeVisible();
  });

  test('should archive and unarchive cards', async ({ page }) => {
    // Create a card first
    const picker = page.locator('.picker');
    const cardName = `Archive Test ${Date.now()}`;
    await picker.fill(cardName);
    await picker.blur();
    await page.waitForTimeout(1000);
    
    // Find archive checkbox
    const archiveCheckbox = page.locator('#archive');
    await expect(archiveCheckbox).toBeVisible();
    
    // Archive the card
    await archiveCheckbox.check();
    await page.waitForTimeout(1000);
    
    // Navigate away and back
    await page.goto('/#todo');
    await page.waitForTimeout(1000);
    await page.goto('/#next');
    await page.waitForTimeout(2000);
    
    // Should be in archive list
    const archivedCard = page.locator(`#archive_list .circle[data-text="${cardName}"]`);
    await expect(archivedCard).toBeVisible();
    
    // Click to unarchive
    await archivedCard.click();
    await page.waitForTimeout(1000);
    
    // Uncheck archive
    await archiveCheckbox.uncheck();
    await page.waitForTimeout(1000);
    
    // Should be back in recent list
    const recentCard = page.locator(`#recent_list .circle[data-text="${cardName}"]`);
    await expect(recentCard).toBeVisible();
  });

  test('should create todos in card', async ({ page }) => {
    // Create or select a card
    const picker = page.locator('.picker');
    const cardName = `Todo Test ${Date.now()}`;
    await picker.fill(cardName);
    await picker.blur();
    await page.waitForTimeout(1000);
    
    // Add a todo
    const todoInput = page.locator('todoList todoItem input').first();
    await todoInput.fill('Card todo item');
    await todoInput.blur();
    await page.waitForTimeout(500);
    
    // Navigate away and back
    await page.goto('/#todo');
    await page.waitForTimeout(1000);
    await page.goto('/#next');
    await page.waitForTimeout(2000);
    
    // Select the card again
    const cardInList = page.locator(`#recent_list .circle[data-text="${cardName}"]`);
    await cardInList.click();
    await page.waitForTimeout(1000);
    
    // Todo should still be there
    const savedTodo = await todoInput.inputValue();
    expect(savedTodo).toBe('Card todo item');
  });
});

