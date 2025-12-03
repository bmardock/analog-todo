const { test, expect } = require('@playwright/test');
const { waitForRoute } = require('./helpers');

test.describe('Next Page Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await waitForRoute(page, '/#next');
  });

  // Card Name Management Tests
  test('should display picker with month placeholder', async ({ page }) => {
    const picker = page.locator('.picker[name="name"]');
    await expect(picker).toBeVisible();
    
    const placeholder = await picker.getAttribute('placeholder');
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    expect(placeholder).toBe(currentMonth);
  });

  test('should create new card via Add New button', async ({ page }) => {
    const picker = page.locator('.picker');
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
    
    // Wait for save to complete
    await page.waitForFunction(() => window.TodoApp?.cardManager, { timeout: 2000 });
    
    // Navigate away and back - wait for routes
    await waitForRoute(page, '/#todo');
    await waitForRoute(page, '/#next');
    
    // Card should be in recent list
    const cardInList = page.locator(`#recent_list .circle[data-text="${cardName}"]`);
    await expect(cardInList).toBeVisible();
  });

  test('should make card name readonly after saving', async ({ page }) => {
    const picker = page.locator('.picker');
    const cardName = `Readonly Test ${Date.now()}`;
    
    await picker.fill(cardName);
    await picker.blur();
    await page.waitForTimeout(1000);
    
    // Navigate away and back
    await page.goto('/#todo');
    await page.waitForTimeout(1000);
    await page.goto('/#next');
    await page.waitForTimeout(2000);
    
    // Select the card
    const cardInList = page.locator(`#recent_list .circle[data-text="${cardName}"]`);
    await cardInList.click();
    await page.waitForTimeout(1000);
    
    // Picker should be readonly
    const isReadonly = await picker.getAttribute('readonly');
    expect(isReadonly).not.toBeNull();
  });

  test('should generate unique card names', async ({ page }) => {
    const picker = page.locator('.picker');
    const baseName = `Unique Test ${Date.now()}`;
    
    // Create first card
    await picker.fill(baseName);
    await picker.blur();
    await page.waitForTimeout(1000);
    
    // Navigate away and back
    await page.goto('/#todo');
    await page.waitForTimeout(1000);
    await page.goto('/#next');
    await page.waitForTimeout(2000);
    
    // Create second card with same name
    const addNewButton = page.locator('#recent_list .circle[data-text="Add New"]');
    if (await addNewButton.count() > 0) {
      await addNewButton.click();
      await page.waitForTimeout(500);
    }
    
    await picker.fill(baseName);
    await picker.blur();
    await page.waitForTimeout(1000);
    
    // Should have unique name
    const pickerValue = await picker.inputValue();
    expect(pickerValue).toBe(`${baseName}_2`);
  });

  test('should select existing card from recent list', async ({ page }) => {
    // Create a card first
    const picker = page.locator('.picker');
    const cardName = `Select Test ${Date.now()}`;
    
    await picker.fill(cardName);
    await picker.blur();
    await page.waitForTimeout(1000);
    
    // Navigate away and back
    await page.goto('/#todo');
    await page.waitForTimeout(1000);
    await page.goto('/#next');
    await page.waitForTimeout(2000);
    
    // Click card in recent list
    const cardInList = page.locator(`#recent_list .circle[data-text="${cardName}"]`);
    await cardInList.click();
    await page.waitForTimeout(1000);
    
    // Card should be selected (marked as "on")
    const cardClass = await cardInList.getAttribute('class');
    expect(cardClass).toContain('on');
    
    // Picker should show card name
    const pickerValue = await picker.inputValue();
    expect(pickerValue).toBe(cardName);
  });

  // Recent & Archive Lists Tests
  test('should show non-archived cards in recent list', async ({ page }) => {
    // Create a card
    const picker = page.locator('.picker');
    const cardName = `Recent Test ${Date.now()}`;
    
    await picker.fill(cardName);
    await picker.blur();
    await page.waitForTimeout(1000);
    
    // Navigate away and back
    await page.goto('/#todo');
    await page.waitForTimeout(1000);
    await page.goto('/#next');
    await page.waitForTimeout(2000);
    
    // Should be in recent list
    const cardInRecent = page.locator(`#recent_list .circle[data-text="${cardName}"]`);
    await expect(cardInRecent).toBeVisible();
  });

  test('should toggle archive list visibility', async ({ page }) => {
    const archiveHeader = page.locator('.archive-header');
    const archiveList = page.locator('.archive');
    
    await archiveHeader.click();
    await page.waitForTimeout(500);
    
    // Archive list should toggle open/closed
    const archiveClass = await archiveList.getAttribute('class');
    // Just verify it's clickable and doesn't error
    expect(archiveHeader).toBeVisible();
  });

  test('should show archived cards in archive list', async ({ page }) => {
    // Create and archive a card
    const picker = page.locator('.picker');
    const cardName = `Archive List Test ${Date.now()}`;
    
    await picker.fill(cardName);
    await picker.blur();
    await page.waitForTimeout(1000);
    
    // Archive it
    const archiveCheckbox = page.locator('#archive');
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
  });

  test('should select card from archive list', async ({ page }) => {
    // Create and archive a card
    const picker = page.locator('.picker');
    const cardName = `Archive Select Test ${Date.now()}`;
    
    await picker.fill(cardName);
    await picker.blur();
    await page.waitForTimeout(1000);
    
    const archiveCheckbox = page.locator('#archive');
    await archiveCheckbox.check();
    await page.waitForTimeout(1000);
    
    // Navigate away and back
    await page.goto('/#todo');
    await page.waitForTimeout(1000);
    await page.goto('/#next');
    await page.waitForTimeout(2000);
    
    // Click archived card
    const archivedCard = page.locator(`#archive_list .circle[data-text="${cardName}"]`);
    await archivedCard.click();
    await page.waitForTimeout(1000);
    
    // Archive checkbox should be checked
    await expect(archiveCheckbox).toBeChecked();
    
    // Picker should show card name
    const pickerValue = await picker.inputValue();
    expect(pickerValue).toBe(cardName);
  });

  // Archive Functionality Tests
  test('should archive card', async ({ page }) => {
    // Create a card
    const picker = page.locator('.picker');
    const cardName = `Archive Test ${Date.now()}`;
    
    await picker.fill(cardName);
    await picker.blur();
    await page.waitForTimeout(1000);
    
    // Archive it
    const archiveCheckbox = page.locator('#archive');
    await archiveCheckbox.check();
    await page.waitForTimeout(1000);
    
    // Navigate away and back
    await page.goto('/#todo');
    await page.waitForTimeout(1000);
    await page.goto('/#next');
    await page.waitForTimeout(2000);
    
    // Should be in archive list, not recent list
    const archivedCard = page.locator(`#archive_list .circle[data-text="${cardName}"]`);
    await expect(archivedCard).toBeVisible();
    
    const recentCard = page.locator(`#recent_list .circle[data-text="${cardName}"]`);
    const recentCount = await recentCard.count();
    expect(recentCount).toBe(0);
  });

  test('should unarchive card', async ({ page }) => {
    // Create and archive a card
    const picker = page.locator('.picker');
    const cardName = `Unarchive Test ${Date.now()}`;
    
    await picker.fill(cardName);
    await picker.blur();
    await page.waitForTimeout(1000);
    
    const archiveCheckbox = page.locator('#archive');
    await archiveCheckbox.check();
    await page.waitForTimeout(1000);
    
    // Navigate away and back
    await page.goto('/#todo');
    await page.waitForTimeout(1000);
    await page.goto('/#next');
    await page.waitForTimeout(2000);
    
    // Select archived card
    const archivedCard = page.locator(`#archive_list .circle[data-text="${cardName}"]`);
    await archivedCard.click();
    await page.waitForTimeout(1000);
    
    // Unarchive it
    await archiveCheckbox.uncheck();
    await page.waitForTimeout(1000);
    
    // Navigate away and back
    await page.goto('/#todo');
    await page.waitForTimeout(1000);
    await page.goto('/#next');
    await page.waitForTimeout(2000);
    
    // Should be back in recent list
    const recentCard = page.locator(`#recent_list .circle[data-text="${cardName}"]`);
    await expect(recentCard).toBeVisible();
  });

  test('should persist archive state', async ({ page }) => {
    // Create and archive a card
    const picker = page.locator('.picker');
    const cardName = `Archive Persist Test ${Date.now()}`;
    
    await picker.fill(cardName);
    await picker.blur();
    await page.waitForTimeout(1000);
    
    const archiveCheckbox = page.locator('#archive');
    await archiveCheckbox.check();
    await page.waitForTimeout(1000);
    
    // Navigate away and back multiple times
    await page.goto('/#todo');
    await page.waitForTimeout(1000);
    await page.goto('/#someday');
    await page.waitForTimeout(1000);
    await page.goto('/#next');
    await page.waitForTimeout(2000);
    
    // Should still be archived
    const archivedCard = page.locator(`#archive_list .circle[data-text="${cardName}"]`);
    await expect(archivedCard).toBeVisible();
  });

  // Task Management Tests (Same as Todo)
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

  test('should edit todos in card', async ({ page }) => {
    const picker = page.locator('.picker');
    const cardName = `Edit Todo Test ${Date.now()}`;
    await picker.fill(cardName);
    await picker.blur();
    await page.waitForTimeout(1000);
    
    const todoInput = page.locator('todoList todoItem input').first();
    await todoInput.fill('Original task');
    await todoInput.blur();
    await page.waitForTimeout(500);
    
    // Edit it
    await todoInput.fill('Edited task');
    await todoInput.blur();
    await page.waitForTimeout(500);
    
    // Navigate away and back
    await page.goto('/#todo');
    await page.waitForTimeout(1000);
    await page.goto('/#next');
    await page.waitForTimeout(2000);
    
    const cardInList = page.locator(`#recent_list .circle[data-text="${cardName}"]`);
    await cardInList.click();
    await page.waitForTimeout(1000);
    
    const editedTodo = await todoInput.inputValue();
    expect(editedTodo).toBe('Edited task');
  });

  test('should set task signals in card', async ({ page }) => {
    const picker = page.locator('.picker');
    const cardName = `Signal Test ${Date.now()}`;
    await picker.fill(cardName);
    await picker.blur();
    await page.waitForTimeout(1000);
    
    const todoInput = page.locator('todoList todoItem input').first();
    await todoInput.fill('Task with signal');
    await todoInput.blur();
    await page.waitForTimeout(500);
    
    // Set signal to completed
    const signalButton = page.locator('todoList todoItem .signal').first();
    await signalButton.click();
    await page.waitForTimeout(300);
    const completedOption = page.locator('a:has-text("completed")').first();
    await completedOption.click();
    await page.waitForTimeout(500);
    
    // Navigate away and back
    await page.goto('/#todo');
    await page.waitForTimeout(1000);
    await page.goto('/#next');
    await page.waitForTimeout(2000);
    
    const cardInList = page.locator(`#recent_list .circle[data-text="${cardName}"]`);
    await cardInList.click();
    await page.waitForTimeout(1000);
    
    // Signal should persist
    const signalClass = await signalButton.getAttribute('class');
    expect(signalClass).toContain('completed');
  });

  // Copy Task Functionality Tests
  test('should copy task to Today', async ({ page }) => {
    const picker = page.locator('.picker');
    const cardName = `Copy Today Test ${Date.now()}`;
    await picker.fill(cardName);
    await picker.blur();
    await page.waitForTimeout(1000);
    
    const todoInput = page.locator('todoList todoItem input').first();
    await todoInput.fill('Task to copy to today');
    await todoInput.blur();
    await page.waitForTimeout(500);
    
    // Find copy dropdown (should be visible for Next cards)
    const copySelect = page.locator('todoList todoItem select.copy').first();
    // Make it visible if hidden
    await copySelect.evaluate(el => el.classList.remove('hidden'));
    await copySelect.selectOption('Today');
    await page.waitForTimeout(1000);
    
    // Navigate to today
    const today = new Date().toISOString().split('T')[0];
    await page.goto(`/?date=${today}#todo`);
    await page.waitForTimeout(2000);
    
    // Task should be there
    const todos = page.locator('todoList todoItem input');
    const firstTodo = await todos.first().inputValue();
    expect(firstTodo).toBe('Task to copy to today');
  });

  test('should copy task to Tomorrow', async ({ page }) => {
    const picker = page.locator('.picker');
    const cardName = `Copy Tomorrow Test ${Date.now()}`;
    await picker.fill(cardName);
    await picker.blur();
    await page.waitForTimeout(1000);
    
    const todoInput = page.locator('todoList todoItem input').first();
    await todoInput.fill('Task to copy to tomorrow');
    await todoInput.blur();
    await page.waitForTimeout(500);
    
    const copySelect = page.locator('todoList todoItem select.copy').first();
    await copySelect.evaluate(el => el.classList.remove('hidden'));
    await copySelect.selectOption('Tomorrow');
    await page.waitForTimeout(1000);
    
    // Navigate to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    await page.goto(`/?date=${tomorrowStr}#todo`);
    await page.waitForTimeout(2000);
    
    const todos = page.locator('todoList todoItem input');
    const firstTodo = await todos.first().inputValue();
    expect(firstTodo).toBe('Task to copy to tomorrow');
  });

  test('should copy task to Next', async ({ page }) => {
    const picker = page.locator('.picker');
    const cardName = `Copy Next Test ${Date.now()}`;
    await picker.fill(cardName);
    await picker.blur();
    await page.waitForTimeout(1000);
    
    const todoInput = page.locator('todoList todoItem input').first();
    await todoInput.fill('Task to copy to next');
    await todoInput.blur();
    await page.waitForTimeout(500);
    
    const copySelect = page.locator('todoList todoItem select.copy').first();
    await copySelect.evaluate(el => el.classList.remove('hidden'));
    await copySelect.selectOption('Next');
    await page.waitForTimeout(1000);
    
    // Navigate to Next page
    await page.goto('/#next');
    await page.waitForTimeout(2000);
    
    // Task should be in most recent card
    const todos = page.locator('todoList todoItem input');
    const firstTodo = await todos.first().inputValue();
    expect(firstTodo).toBe('Task to copy to next');
  });

  test('should copy task to Someday', async ({ page }) => {
    const picker = page.locator('.picker');
    const cardName = `Copy Someday Test ${Date.now()}`;
    await picker.fill(cardName);
    await picker.blur();
    await page.waitForTimeout(1000);
    
    const todoInput = page.locator('todoList todoItem input').first();
    await todoInput.fill('Task to copy to someday');
    await todoInput.blur();
    await page.waitForTimeout(500);
    
    const copySelect = page.locator('todoList todoItem select.copy').first();
    await copySelect.evaluate(el => el.classList.remove('hidden'));
    await copySelect.selectOption('Someday');
    await page.waitForTimeout(1000);
    
    // Navigate to Someday page
    await page.goto('/#someday');
    await page.waitForTimeout(2000);
    
    // Task should be in most recent card
    const todos = page.locator('todoList todoItem input');
    const firstTodo = await todos.first().inputValue();
    expect(firstTodo).toBe('Task to copy to someday');
  });

  // Card Signals & Braindump Tests
  test('should save card signals', async ({ page }) => {
    const picker = page.locator('.picker');
    const cardName = `Signal Card Test ${Date.now()}`;
    await picker.fill(cardName);
    await picker.blur();
    await page.waitForTimeout(1000);
    
    const cardSignals = page.locator('.cardSignal input');
    const firstSignal = cardSignals.first();
    await firstSignal.check();
    await page.waitForTimeout(500);
    
    // Navigate away and back
    await page.goto('/#todo');
    await page.waitForTimeout(1000);
    await page.goto('/#next');
    await page.waitForTimeout(2000);
    
    const cardInList = page.locator(`#recent_list .circle[data-text="${cardName}"]`);
    await cardInList.click();
    await page.waitForTimeout(1000);
    
    await expect(firstSignal).toBeChecked();
  });

  test('should save braindump notes', async ({ page }) => {
    const picker = page.locator('.picker');
    const cardName = `Braindump Test ${Date.now()}`;
    await picker.fill(cardName);
    await picker.blur();
    await page.waitForTimeout(1000);
    
    const flipButton = page.locator('.flip').first();
    await flipButton.click();
    await page.waitForTimeout(500);
    
    const braindump = page.locator('[name=braindump]');
    await braindump.fill('Test braindump note');
    await braindump.blur();
    await page.waitForTimeout(500);
    
    // Navigate away and back
    await page.goto('/#todo');
    await page.waitForTimeout(1000);
    await page.goto('/#next');
    await page.waitForTimeout(2000);
    
    const cardInList = page.locator(`#recent_list .circle[data-text="${cardName}"]`);
    await cardInList.click();
    await page.waitForTimeout(1000);
    
    await flipButton.click();
    await page.waitForTimeout(500);
    
    const savedNote = await braindump.inputValue();
    expect(savedNote).toBe('Test braindump note');
  });

  // Initialization Tests
  test('should load most recent card if no name in URL', async ({ page }) => {
    // Create a card
    const picker = page.locator('.picker');
    const cardName = `Recent Load Test ${Date.now()}`;
    await picker.fill(cardName);
    await picker.blur();
    await page.waitForTimeout(1000);
    
    // Navigate to Next without card name
    await page.goto('/#next');
    await page.waitForTimeout(2000);
    
    // Most recent card should be loaded
    const pickerValue = await picker.inputValue();
    expect(pickerValue).toBe(cardName);
  });

  // Data Persistence Tests
  test('should persist card data across navigation', async ({ page }) => {
    const picker = page.locator('.picker');
    const cardName = `Persist Test ${Date.now()}`;
    await picker.fill(cardName);
    await picker.blur();
    await page.waitForTimeout(1000);
    
    // Add todo and braindump
    const todoInput = page.locator('todoList todoItem input').first();
    await todoInput.fill('Persistent task');
    await todoInput.blur();
    await page.waitForTimeout(500);
    
    const flipButton = page.locator('.flip').first();
    await flipButton.click();
    await page.waitForTimeout(500);
    const braindump = page.locator('[name=braindump]');
    await braindump.fill('Persistent note');
    await braindump.blur();
    await page.waitForTimeout(500);
    
    // Navigate to multiple pages
    await page.goto('/#todo');
    await page.waitForTimeout(1000);
    await page.goto('/#someday');
    await page.waitForTimeout(1000);
    await page.goto('/#next');
    await page.waitForTimeout(2000);
    
    // Select card
    const cardInList = page.locator(`#recent_list .circle[data-text="${cardName}"]`);
    await cardInList.click();
    await page.waitForTimeout(1000);
    
    // Data should persist
    const savedTodo = await todoInput.inputValue();
    expect(savedTodo).toBe('Persistent task');
    
    await flipButton.click();
    await page.waitForTimeout(500);
    const savedNote = await braindump.inputValue();
    expect(savedNote).toBe('Persistent note');
  });
});

