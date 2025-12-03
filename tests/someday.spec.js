const { test, expect } = require('@playwright/test');
const { waitForRoute } = require('./helpers');

test.describe('Someday Page Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await waitForRoute(page, '/#someday');
  });

  // Card Name Management Tests
  test('should display picker with year placeholder', async ({ page }) => {
    const picker = page.locator('.picker[name="name"]');
    await expect(picker).toBeVisible();
    
    const placeholder = await picker.getAttribute('placeholder');
    const currentYear = new Date().getFullYear().toString();
    expect(placeholder).toBe(currentYear);
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
    const cardName = `Someday Card ${Date.now()}`;
    
    await picker.fill(cardName);
    await picker.blur();
    
    // Wait for save to complete
    await page.waitForFunction(() => window.TodoApp?.cardManager, { timeout: 2000 });
    
    // Navigate away and back - wait for routes
    await waitForRoute(page, '/#todo');
    await waitForRoute(page, '/#someday');
    
    // Card should be in recent list
    const cardInList = page.locator(`#recent_list .circle[data-text="${cardName}"]`);
    await expect(cardInList).toBeVisible();
  });

  test('should make card name readonly after saving', async ({ page }) => {
    const picker = page.locator('.picker');
    const cardName = `Someday Readonly ${Date.now()}`;
    
    await picker.fill(cardName);
    await picker.blur();
    await page.waitForTimeout(1000);
    
    // Navigate away and back
    await page.goto('/#todo');
    await page.waitForTimeout(1000);
    await page.goto('/#someday');
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
    const baseName = `Someday Unique ${Date.now()}`;
    
    // Create first card
    await picker.fill(baseName);
    await picker.blur();
    await page.waitForTimeout(1000);
    
    // Navigate away and back
    await page.goto('/#todo');
    await page.waitForTimeout(1000);
    await page.goto('/#someday');
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
    const cardName = `Someday Select ${Date.now()}`;
    
    await picker.fill(cardName);
    await picker.blur();
    await page.waitForTimeout(1000);
    
    // Navigate away and back
    await page.goto('/#todo');
    await page.waitForTimeout(1000);
    await page.goto('/#someday');
    await page.waitForTimeout(2000);
    
    // Click card in recent list
    const cardInList = page.locator(`#recent_list .circle[data-text="${cardName}"]`);
    await cardInList.click();
    await page.waitForTimeout(1000);
    
    // Card should be selected
    const cardClass = await cardInList.getAttribute('class');
    expect(cardClass).toContain('on');
    
    // Picker should show card name
    const pickerValue = await picker.inputValue();
    expect(pickerValue).toBe(cardName);
  });

  // Archive Functionality Tests
  test('should archive card', async ({ page }) => {
    // Create a card
    const picker = page.locator('.picker');
    const cardName = `Someday Archive ${Date.now()}`;
    
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
    await page.goto('/#someday');
    await page.waitForTimeout(2000);
    
    // Should be in archive list
    const archivedCard = page.locator(`#archive_list .circle[data-text="${cardName}"]`);
    await expect(archivedCard).toBeVisible();
  });

  test('should unarchive card', async ({ page }) => {
    // Create and archive a card
    const picker = page.locator('.picker');
    const cardName = `Someday Unarchive ${Date.now()}`;
    
    await picker.fill(cardName);
    await picker.blur();
    await page.waitForTimeout(1000);
    
    const archiveCheckbox = page.locator('#archive');
    await archiveCheckbox.check();
    await page.waitForTimeout(1000);
    
    // Navigate away and back
    await page.goto('/#todo');
    await page.waitForTimeout(1000);
    await page.goto('/#someday');
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
    await page.goto('/#someday');
    await page.waitForTimeout(2000);
    
    // Should be back in recent list
    const recentCard = page.locator(`#recent_list .circle[data-text="${cardName}"]`);
    await expect(recentCard).toBeVisible();
  });

  // Task Management Tests
  test('should create todos in card', async ({ page }) => {
    const picker = page.locator('.picker');
    const cardName = `Someday Todo ${Date.now()}`;
    await picker.fill(cardName);
    await picker.blur();
    await page.waitForTimeout(1000);
    
    const todoInput = page.locator('todoList todoItem input').first();
    await todoInput.fill('Someday todo item');
    await todoInput.blur();
    await page.waitForTimeout(500);
    
    // Navigate away and back
    await page.goto('/#todo');
    await page.waitForTimeout(1000);
    await page.goto('/#someday');
    await page.waitForTimeout(2000);
    
    // Select the card again
    const cardInList = page.locator(`#recent_list .circle[data-text="${cardName}"]`);
    await cardInList.click();
    await page.waitForTimeout(1000);
    
    // Todo should still be there
    const savedTodo = await todoInput.inputValue();
    expect(savedTodo).toBe('Someday todo item');
  });

  test('should set task signals in card', async ({ page }) => {
    const picker = page.locator('.picker');
    const cardName = `Someday Signal ${Date.now()}`;
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
    await page.goto('/#someday');
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
    const cardName = `Someday Copy Today ${Date.now()}`;
    await picker.fill(cardName);
    await picker.blur();
    await page.waitForTimeout(1000);
    
    const todoInput = page.locator('todoList todoItem input').first();
    await todoInput.fill('Task to copy to today');
    await todoInput.blur();
    await page.waitForTimeout(500);
    
    const copySelect = page.locator('todoList todoItem select.copy').first();
    await copySelect.evaluate(el => el.classList.remove('hidden'));
    await copySelect.selectOption('Today');
    await page.waitForTimeout(1000);
    
    // Navigate to today
    const today = new Date().toISOString().split('T')[0];
    await page.goto(`/?date=${today}#todo`);
    await page.waitForTimeout(2000);
    
    const todos = page.locator('todoList todoItem input');
    const firstTodo = await todos.first().inputValue();
    expect(firstTodo).toBe('Task to copy to today');
  });

  test('should copy task to Tomorrow', async ({ page }) => {
    const picker = page.locator('.picker');
    const cardName = `Someday Copy Tomorrow ${Date.now()}`;
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
    const cardName = `Someday Copy Next ${Date.now()}`;
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
    
    const todos = page.locator('todoList todoItem input');
    const firstTodo = await todos.first().inputValue();
    expect(firstTodo).toBe('Task to copy to next');
  });

  test('should copy task to Someday', async ({ page }) => {
    const picker = page.locator('.picker');
    const cardName = `Someday Copy Someday ${Date.now()}`;
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
    
    const todos = page.locator('todoList todoItem input');
    const firstTodo = await todos.first().inputValue();
    expect(firstTodo).toBe('Task to copy to someday');
  });

  // Card Signals & Braindump Tests
  test('should save card signals', async ({ page }) => {
    const picker = page.locator('.picker');
    const cardName = `Someday Signal Card ${Date.now()}`;
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
    await page.goto('/#someday');
    await page.waitForTimeout(2000);
    
    const cardInList = page.locator(`#recent_list .circle[data-text="${cardName}"]`);
    await cardInList.click();
    await page.waitForTimeout(1000);
    
    await expect(firstSignal).toBeChecked();
  });

  test('should save braindump notes', async ({ page }) => {
    const picker = page.locator('.picker');
    const cardName = `Someday Braindump ${Date.now()}`;
    await picker.fill(cardName);
    await picker.blur();
    await page.waitForTimeout(1000);
    
    const flipButton = page.locator('.flip').first();
    await flipButton.click();
    await page.waitForTimeout(500);
    
    const braindump = page.locator('[name=braindump]');
    await braindump.fill('Someday braindump note');
    await braindump.blur();
    await page.waitForTimeout(500);
    
    // Navigate away and back
    await page.goto('/#todo');
    await page.waitForTimeout(1000);
    await page.goto('/#someday');
    await page.waitForTimeout(2000);
    
    const cardInList = page.locator(`#recent_list .circle[data-text="${cardName}"]`);
    await cardInList.click();
    await page.waitForTimeout(1000);
    
    await flipButton.click();
    await page.waitForTimeout(500);
    
    const savedNote = await braindump.inputValue();
    expect(savedNote).toBe('Someday braindump note');
  });

  // Initialization Tests
  test('should load most recent card if no name in URL', async ({ page }) => {
    // Create a card
    const picker = page.locator('.picker');
    const cardName = `Someday Recent ${Date.now()}`;
    await picker.fill(cardName);
    await picker.blur();
    await page.waitForTimeout(1000);
    
    // Navigate to Someday without card name
    await page.goto('/#someday');
    await page.waitForTimeout(2000);
    
    // Most recent card should be loaded
    const pickerValue = await picker.inputValue();
    expect(pickerValue).toBe(cardName);
  });

  // Data Persistence Tests
  test('should persist card data across navigation', async ({ page }) => {
    const picker = page.locator('.picker');
    const cardName = `Someday Persist ${Date.now()}`;
    await picker.fill(cardName);
    await picker.blur();
    await page.waitForTimeout(1000);
    
    // Add todo and braindump
    const todoInput = page.locator('todoList todoItem input').first();
    await todoInput.fill('Someday persistent task');
    await todoInput.blur();
    await page.waitForTimeout(500);
    
    const flipButton = page.locator('.flip').first();
    await flipButton.click();
    await page.waitForTimeout(500);
    const braindump = page.locator('[name=braindump]');
    await braindump.fill('Someday persistent note');
    await braindump.blur();
    await page.waitForTimeout(500);
    
    // Navigate to multiple pages
    await page.goto('/#todo');
    await page.waitForTimeout(1000);
    await page.goto('/#next');
    await page.waitForTimeout(1000);
    await page.goto('/#someday');
    await page.waitForTimeout(2000);
    
    // Select card
    const cardInList = page.locator(`#recent_list .circle[data-text="${cardName}"]`);
    await cardInList.click();
    await page.waitForTimeout(1000);
    
    // Data should persist
    const savedTodo = await todoInput.inputValue();
    expect(savedTodo).toBe('Someday persistent task');
    
    await flipButton.click();
    await page.waitForTimeout(500);
    const savedNote = await braindump.inputValue();
    expect(savedNote).toBe('Someday persistent note');
  });
});

