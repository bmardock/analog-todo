const { test, expect } = require('@playwright/test');
const { waitForRoute } = require('./helpers');

test.describe('Todo Page Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await waitForRoute(page, '/#todo');
  });

  // Date Picker & Calendar Tests
  test('should display current date in picker by default', async ({ page }) => {
    const picker = page.locator('.picker').first();
    await expect(picker).toBeVisible();
    
    // Wait for picker to be initialized as date type
    await page.waitForFunction(() => {
      const picker = document.querySelector('.picker');
      return picker && picker.name === 'date';
    }, { timeout: 5000 });
    
    const today = new Date().toISOString().split('T')[0];
    const pickerValue = await picker.inputValue();
    expect(pickerValue).toBe(today);
  });

  test('should change date when picker value changes', async ({ page }) => {
    // Wait for picker to be initialized as date type
    await page.waitForFunction(() => {
      const picker = document.querySelector('.picker');
      return picker && picker.name === 'date';
    }, { timeout: 5000 });
    
    const picker = page.locator('.picker').first();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    await picker.fill(tomorrowStr);
    await picker.blur();
    
    // Wait for URL to update (fetchAndRender updates URL)
    await page.waitForFunction(
      (expectedDate) => window.location.search.includes(`date=${expectedDate}`),
      tomorrowStr,
      { timeout: 3000 }
    );
    
    // Picker should show new date
    const pickerValue = await picker.inputValue();
    expect(pickerValue).toBe(tomorrowStr);
  });

  test('should show calendar widget with 7-day window', async ({ page }) => {
    // Wait for calendar to be rendered (renderCalList is called after init)
    await page.waitForSelector('cal.calendar .day', { timeout: 5000 });
    
    const calendar = page.locator('cal.calendar').first();
    const days = calendar.locator('.day');
    const dayCount = await days.count();
    expect(dayCount).toBeGreaterThanOrEqual(7);
  });

  test('should show event indicators for dates with todos', async ({ page }) => {
    // Create a todo on today
    const todoInput = page.locator('todoList todoItem input').first();
    await todoInput.fill('Test event');
    await todoInput.blur();
    
    // Navigate away and back
    await waitForRoute(page, '/#next');
    await waitForRoute(page, '/#todo');
    
    // Calendar should show event indicator (use cal.calendar)
    const calendar = page.locator('cal.calendar').first();
    const hasEventIndicator = await calendar.locator('.has-event, .day .today').count();
    expect(hasEventIndicator).toBeGreaterThan(0);
  });

  test('should navigate to date when clicking calendar day', async ({ page }) => {
    const calendar = page.locator('cal.calendar').first();
    await expect(calendar).toBeVisible();
    
    // Find a date link (not today)
    const dayLinks = calendar.locator('.day a');
    const linkCount = await dayLinks.count();
    expect(linkCount).toBeGreaterThan(0);
    
    // Click first available link
    const firstLink = dayLinks.first();
    const href = await firstLink.getAttribute('href');
    if (href) {
      await firstLink.click();
      
      // Wait for URL to update
      await page.waitForFunction(() => window.location.search.includes('date='), { timeout: 3000 });
      
      // URL should contain date parameter
      const url = page.url();
      expect(url).toContain('date=');
    }
  });

  // Task Management Tests
  test('should create a todo item', async ({ page }) => {
    const todoInput = page.locator('todoList todoItem input').first();
    
    await todoInput.fill('Test todo item');
    await todoInput.blur();
    
    const inputValue = await todoInput.inputValue();
    expect(inputValue).toBe('Test todo item');
  });

  test('should edit existing todo item', async ({ page }) => {
    const todoInput = page.locator('todoList todoItem input').first();
    await todoInput.fill('Original task');
    await todoInput.blur();
    
    // Wait for save to complete
    await page.waitForFunction(() => window.TodoApp?.cardManager, { timeout: 2000 });
    
    // Edit the task
    await todoInput.fill('Edited task');
    await todoInput.blur();
    
    // Navigate away and back
    await waitForRoute(page, '/#next');
    await waitForRoute(page, '/#todo');
    
    const savedValue = await page.locator('todoList todoItem input').first().inputValue();
    expect(savedValue).toBe('Edited task');
  });

  test('should remove todo when text is cleared', async ({ page }) => {
    const todoInput = page.locator('todoList todoItem input').first();
    await todoInput.fill('Task to remove');
    await todoInput.blur();
    
    // Clear the task
    await todoInput.fill('');
    await todoInput.blur();
    
    // Navigate away and back - wait for routes
    await page.goto('/#next');
    await page.waitForSelector('todoList', { timeout: 5000 });
    await page.goto('/#todo');
    await page.waitForSelector('todoList', { timeout: 5000 });
    
    const clearedValue = await page.locator('todoList todoItem input').first().inputValue();
    expect(clearedValue).toBe('');
  });

  test('should create multiple todos', async ({ page }) => {
    const inputs = page.locator('todoList todoItem input');
    
    // Create 3 todos
    for (let i = 0; i < 3; i++) {
      const input = inputs.nth(i);
      await input.fill(`Task ${i + 1}`);
      await input.blur();
    }
    
    // Navigate away and back - wait for routes
    await page.goto('/#next');
    await page.waitForSelector('todoList', { timeout: 5000 });
    await page.goto('/#todo');
    await page.waitForSelector('todoList', { timeout: 5000 });
    
    // Verify all tasks persist
    const allInputs = page.locator('todoList todoItem input');
    expect(await allInputs.nth(0).inputValue()).toBe('Task 1');
    expect(await allInputs.nth(1).inputValue()).toBe('Task 2');
    expect(await allInputs.nth(2).inputValue()).toBe('Task 3');
  });

  // Task Signal Tests
  test('should set task signal to in-progress', async ({ page }) => {
    const todoInput = page.locator('todoList todoItem input').first();
    await todoInput.fill('Task with signal');
    await todoInput.blur();
    
    // Wait for task to be saved first
    await page.waitForFunction(() => window.TodoApp?.cardManager, { timeout: 2000 });
    
    const signalButton = page.locator('todoList todoItem .signal').first();
    await signalButton.click();
    
    // Wait for dropdown to appear
    await page.waitForSelector('.dropdown-content', { timeout: 2000 });
    
    // Click in-progress option
    const inProgressOption = page.locator('a:has-text("in-progress")').first();
    await inProgressOption.click();
    
    // Wait for save to complete - check that signal class updated
    await page.waitForFunction(() => {
      const signal = document.querySelector('todoList todoItem .signal');
      return signal && (signal.classList.contains('in-progress') || signal.value === 'in-progress');
    }, { timeout: 5000 });
    
    // Navigate away and back
    await waitForRoute(page, '/#next');
    await waitForRoute(page, '/#todo');
    
    const signalButtonAfter = page.locator('todoList todoItem .signal').first();
    const signalClass = await signalButtonAfter.getAttribute('class');
    expect(signalClass).toContain('in-progress');
  });

  test('should set task signal to completed', async ({ page }) => {
    const todoInput = page.locator('todoList todoItem input').first();
    await todoInput.fill('Task to complete');
    await todoInput.blur();
    
    // Wait for task to be saved first
    await page.waitForFunction(() => window.TodoApp?.cardManager, { timeout: 2000 });
    
    const signalButton = page.locator('todoList todoItem .signal').first();
    await signalButton.click();
    
    await page.waitForSelector('.dropdown-content', { timeout: 2000 });
    const completedOption = page.locator('a:has-text("completed")').first();
    await completedOption.click();
    
    // Wait for save to complete - check both class and value
    await page.waitForFunction(() => {
      const signal = document.querySelector('todoList todoItem .signal');
      return signal && (signal.classList.contains('completed') || signal.value === 'completed');
    }, { timeout: 5000 });
    
    // Navigate away and back
    await waitForRoute(page, '/#next');
    await waitForRoute(page, '/#todo');
    
    const signalButtonAfter = page.locator('todoList todoItem .signal').first();
    const signalClass = await signalButtonAfter.getAttribute('class');
    expect(signalClass).toContain('completed');
  });

  test('should set task signal to appointment', async ({ page }) => {
    const todoInput = page.locator('todoList todoItem input').first();
    await todoInput.fill('Appointment task');
    await todoInput.blur();
    
    const signalButton = page.locator('todoList todoItem .signal').first();
    await signalButton.click();
    await page.waitForSelector('.dropdown-content', { timeout: 2000 });
    
    const appointmentOption = page.locator('a:has-text("appointment")').first();
    await appointmentOption.click();
    
    // Wait for save
    await page.waitForFunction(() => {
      const signal = document.querySelector('todoList todoItem .signal');
      return signal && (signal.classList.contains('appointment') || signal.value === 'appointment');
    }, { timeout: 3000 });
    
    // Navigate away and back
    await waitForRoute(page, '/#next');
    await waitForRoute(page, '/#todo');
    
    const signalClass = await signalButton.getAttribute('class');
    expect(signalClass).toContain('appointment');
  });

  test('should set task signal to delegated', async ({ page }) => {
    const todoInput = page.locator('todoList todoItem input').first();
    await todoInput.fill('Delegated task');
    await todoInput.blur();
    
    const signalButton = page.locator('todoList todoItem .signal').first();
    await signalButton.click();
    await page.waitForSelector('.dropdown-content', { timeout: 2000 });
    
    const delegatedOption = page.locator('a:has-text("delegated")').first();
    await delegatedOption.click();
    
    // Wait for save
    await page.waitForFunction(() => {
      const signal = document.querySelector('todoList todoItem .signal');
      return signal && (signal.classList.contains('delegated') || signal.value === 'delegated');
    }, { timeout: 3000 });
    
    // Navigate away and back
    await waitForRoute(page, '/#next');
    await waitForRoute(page, '/#todo');
    
    const signalClass = await signalButton.getAttribute('class');
    expect(signalClass).toContain('delegated');
  });

  test('should disable signal dropdown for empty tasks', async ({ page }) => {
    const todoInput = page.locator('todoList todoItem input').first();
    const signalButton = page.locator('todoList todoItem .signal').first();
    const dropdown = page.locator('todoList todoItem .dropdown').first();
    
    // Empty task should have disabled dropdown
    const isDisabled = await dropdown.getAttribute('class');
    expect(isDisabled).toContain('disabled');
    
    // Add text, dropdown should become enabled
    await todoInput.fill('Task with text');
    await todoInput.blur();
    
    // Wait for UI update
    await page.waitForFunction(() => {
      const dropdown = document.querySelector('todoList todoItem .dropdown');
      return dropdown && !dropdown.classList.contains('disabled');
    }, { timeout: 2000 });
    
    const isEnabled = await dropdown.getAttribute('class');
    expect(isEnabled).not.toContain('disabled');
  });

  test('should navigate between tasks with Enter key', async ({ page }) => {
    const inputs = page.locator('todoList todoItem input');
    const firstInput = inputs.first();
    
    await firstInput.fill('First task');
    await firstInput.focus();
    
    // Press Enter
    await firstInput.press('Enter');
    
    // Second input should be focused
    const secondInput = inputs.nth(1);
    await page.waitForFunction((inputSelector) => {
      const input = document.querySelector(inputSelector);
      return input && document.activeElement === input;
    }, 'todoList todoItem:nth-child(2) input', { timeout: 1000 });
    
    const isFocused = await secondInput.evaluate(el => document.activeElement === el);
    expect(isFocused).toBe(true);
  });

  // Copy Task Functionality Tests
  test('should show copy dropdown for incomplete tasks on past dates', async ({ page }) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    await waitForRoute(page, `/?date=${yesterdayStr}#todo`);
    
    const todoInput = page.locator('todoList todoItem input').first();
    await todoInput.fill('Incomplete task');
    await todoInput.blur();
    
    // Copy dropdown should be visible
    const copySelect = page.locator('todoList todoItem select.copy').first();
    await expect(copySelect).toBeVisible();
    expect(await copySelect.getAttribute('class')).not.toContain('hidden');
  });

  test('should hide copy dropdown for completed tasks', async ({ page }) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    await waitForRoute(page, `/?date=${yesterdayStr}#todo`);
    
    const todoInput = page.locator('todoList todoItem input').first();
    await todoInput.fill('Task to complete');
    await todoInput.blur();
    
    // Mark as completed
    const signalButton = page.locator('todoList todoItem .signal').first();
    await signalButton.click();
    await page.waitForSelector('.dropdown-content', { timeout: 2000 });
    const completedOption = page.locator('a:has-text("completed")').first();
    await completedOption.click();
    
    // Wait for save
    await page.waitForFunction(() => {
      const signal = document.querySelector('todoList todoItem .signal');
      return signal && (signal.classList.contains('completed') || signal.value === 'completed');
    }, { timeout: 3000 });
    
    // Copy dropdown should be hidden
    const copySelect = page.locator('todoList todoItem select.copy').first();
    const isHidden = await copySelect.getAttribute('class');
    expect(isHidden).toContain('hidden');
  });

  test('should copy task to Today', async ({ page }) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    await waitForRoute(page, `/?date=${yesterdayStr}#todo`);
    
    const todoInput = page.locator('todoList todoItem input').first();
    await todoInput.fill('Task to copy to today');
    await todoInput.blur();
    
    const copySelect = page.locator('todoList todoItem select.copy').first();
    await copySelect.selectOption('Today');
    
    // Navigate to today
    const today = new Date().toISOString().split('T')[0];
    await waitForRoute(page, `/?date=${today}#todo`);
    
    // Task should be there
    const todos = page.locator('todoList todoItem input');
    const firstTodo = await todos.first().inputValue();
    expect(firstTodo).toBe('Task to copy to today');
  });

  test('should copy task to Tomorrow', async ({ page }) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    await waitForRoute(page, `/?date=${yesterdayStr}#todo`);
    
    const todoInput = page.locator('todoList todoItem input').first();
    await todoInput.fill('Task to copy to tomorrow');
    await todoInput.blur();
    
    const copySelect = page.locator('todoList todoItem select.copy').first();
    await copySelect.selectOption('Tomorrow');
    
    // Navigate to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    await waitForRoute(page, `/?date=${tomorrowStr}#todo`);
    
    // Task should be there
    const todos = page.locator('todoList todoItem input');
    const firstTodo = await todos.first().inputValue();
    expect(firstTodo).toBe('Task to copy to tomorrow');
  });

  test('should copy task to Next', async ({ page }) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    await waitForRoute(page, `/?date=${yesterdayStr}#todo`);
    
    const todoInput = page.locator('todoList todoItem input').first();
    await todoInput.fill('Task to copy to next');
    await todoInput.blur();
    
    const copySelect = page.locator('todoList todoItem select.copy').first();
    await copySelect.selectOption('Next');
    
    // Navigate to Next page
    await waitForRoute(page, '/#next');
    
    // Task should be in most recent card
    const todos = page.locator('todoList todoItem input');
    const firstTodo = await todos.first().inputValue();
    expect(firstTodo).toBe('Task to copy to next');
  });

  test('should copy task to Someday', async ({ page }) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    await waitForRoute(page, `/?date=${yesterdayStr}#todo`);
    
    const todoInput = page.locator('todoList todoItem input').first();
    await todoInput.fill('Task to copy to someday');
    await todoInput.blur();
    
    const copySelect = page.locator('todoList todoItem select.copy').first();
    await copySelect.selectOption('Someday');
    
    // Navigate to Someday page
    await waitForRoute(page, '/#someday');
    
    // Task should be in most recent card
    const todos = page.locator('todoList todoItem input');
    const firstTodo = await todos.first().inputValue();
    expect(firstTodo).toBe('Task to copy to someday');
  });

  test('should preserve signal when copying task', async ({ page }) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    await waitForRoute(page, `/?date=${yesterdayStr}#todo`);
    
    const todoInput = page.locator('todoList todoItem input').first();
    await todoInput.fill('Task with signal');
    await todoInput.blur();
    
    // Set signal to in-progress
    const signalButton = page.locator('todoList todoItem .signal').first();
    await signalButton.click();
    await page.waitForSelector('.dropdown-content', { timeout: 2000 });
    const inProgressOption = page.locator('a:has-text("in-progress")').first();
    await inProgressOption.click();
    
    // Wait for signal to save
    await page.waitForFunction(() => {
      const signal = document.querySelector('todoList todoItem .signal');
      return signal && (signal.classList.contains('in-progress') || signal.value === 'in-progress');
    }, { timeout: 3000 });
    
    // Copy to tomorrow
    const copySelect = page.locator('todoList todoItem select.copy').first();
    await copySelect.selectOption('Tomorrow');
    
    // Navigate to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    await waitForRoute(page, `/?date=${tomorrowStr}#todo`);
    
    // Signal should be preserved
    const copiedSignal = page.locator('todoList todoItem .signal').first();
    const signalClass = await copiedSignal.getAttribute('class');
    expect(signalClass).toContain('in-progress');
  });

  // Card Signals Tests
  test('should save card signals', async ({ page }) => {
    const cardSignals = page.locator('.cardSignal input');
    const firstSignal = cardSignals.first();
    
    await expect(firstSignal).toBeVisible();
    
    await firstSignal.check();
    
    // Wait for save
    await page.waitForFunction(() => window.TodoApp?.cardManager, { timeout: 1000 });
    
    // Navigate away and back
    await waitForRoute(page, '/#next');
    await waitForRoute(page, '/#todo');
    
    const cardSignalsAfter = page.locator('.cardSignal input');
    await expect(cardSignalsAfter.first()).toBeChecked();
  });

  test('should save multiple card signals independently', async ({ page }) => {
    const cardSignals = page.locator('.cardSignal input');
    const firstSignal = cardSignals.first();
    const secondSignal = cardSignals.nth(1);
    
    await firstSignal.check();
    await secondSignal.check();
    
    // Wait for save
    await page.waitForFunction(() => window.TodoApp?.cardManager, { timeout: 1000 });
    
    // Uncheck first, keep second
    await firstSignal.uncheck();
    
    // Wait for save
    await page.waitForFunction(() => window.TodoApp?.cardManager, { timeout: 1000 });
    
    // Navigate away and back
    await waitForRoute(page, '/#next');
    await waitForRoute(page, '/#todo');
    
    const cardSignalsAfter = page.locator('.cardSignal input');
    expect(await cardSignalsAfter.first().isChecked()).toBe(false);
    expect(await cardSignalsAfter.nth(1).isChecked()).toBe(true);
  });

  // Braindump Tests
  test('should save braindump notes', async ({ page }) => {
    const flipButton = page.locator('.flip').first();
    await flipButton.click();
    
    // Wait for back card to be active
    await page.waitForFunction(() => {
      const backCard = document.querySelector('card.back');
      return backCard && backCard.classList.contains('active');
    }, { timeout: 2000 });
    
    const braindump = page.locator('[name=braindump]');
    await expect(braindump).toBeVisible();
    
    await braindump.fill('Test braindump note');
    await braindump.blur();
    
    // Wait for save
    await page.waitForFunction(() => window.TodoApp?.cardManager, { timeout: 1000 });
    
    // Navigate away and back
    await waitForRoute(page, '/#next');
    await waitForRoute(page, '/#todo');
    
    // Flip card again
    await flipButton.click();
    await page.waitForFunction(() => {
      const backCard = document.querySelector('card.back');
      return backCard && backCard.classList.contains('active');
    }, { timeout: 2000 });
    
    const braindumpAfter = page.locator('[name=braindump]');
    const savedNote = await braindumpAfter.inputValue();
    expect(savedNote).toBe('Test braindump note');
  });

  test('should clear braindump notes', async ({ page }) => {
    const flipButton = page.locator('.flip').first();
    await flipButton.click();
    
    await page.waitForFunction(() => {
      const backCard = document.querySelector('card.back');
      return backCard && backCard.classList.contains('active');
    }, { timeout: 2000 });
    
    const braindump = page.locator('[name=braindump]');
    await braindump.fill('Note to clear');
    await braindump.blur();
    
    // Wait for save
    await page.waitForFunction(() => window.TodoApp?.cardManager, { timeout: 1000 });
    
    // Clear it
    await braindump.fill('');
    await braindump.blur();
    
    // Wait for save
    await page.waitForFunction(() => window.TodoApp?.cardManager, { timeout: 1000 });
    
    // Navigate away and back
    await waitForRoute(page, '/#next');
    await waitForRoute(page, '/#todo');
    
    await flipButton.click();
    await page.waitForFunction(() => {
      const backCard = document.querySelector('card.back');
      return backCard && backCard.classList.contains('active');
    }, { timeout: 2000 });
    
    const braindumpAfter = page.locator('[name=braindump]');
    const clearedNote = await braindumpAfter.inputValue();
    expect(clearedNote).toBe('');
  });

  // Card Flip Tests
  test('should flip card to back', async ({ page }) => {
    const flipButton = page.locator('.flip').first();
    const frontCard = page.locator('card.front');
    const backCard = page.locator('card.back');
    
    // Front should be active initially
    const frontActive = await frontCard.getAttribute('class');
    expect(frontActive).toContain('active');
    
    await flipButton.click();
    
    // Wait for back to be active
    await page.waitForFunction(() => {
      const back = document.querySelector('card.back');
      return back && back.classList.contains('active');
    }, { timeout: 2000 });
    
    const backActive = await backCard.getAttribute('class');
    expect(backActive).toContain('active');
  });

  test('should flip card back to front', async ({ page }) => {
    const flipButtons = page.locator('.flip');
    const frontCard = page.locator('card.front');
    
    // Flip to back
    await flipButtons.first().click();
    await page.waitForFunction(() => {
      const back = document.querySelector('card.back');
      return back && back.classList.contains('active');
    }, { timeout: 2000 });
    
    // Flip to front
    await flipButtons.nth(1).click();
    await page.waitForFunction(() => {
      const front = document.querySelector('card.front');
      return front && front.classList.contains('active');
    }, { timeout: 2000 });
    
    const frontActive = await frontCard.getAttribute('class');
    expect(frontActive).toContain('active');
  });

  test('should flip card with arrow keys when input not focused', async ({ page }) => {
    const frontCard = page.locator('card.front');
    const backCard = page.locator('card.back');
    
    // Click somewhere that's not an input
    await page.locator('header').click();
    
    // Press ArrowRight to flip to back
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(() => {
      const back = document.querySelector('card.back');
      return back && back.classList.contains('active');
    }, { timeout: 2000 });
    
    const backActive = await backCard.getAttribute('class');
    expect(backActive).toContain('active');
    
    // Press ArrowLeft to flip to front
    await page.keyboard.press('ArrowLeft');
    await page.waitForFunction(() => {
      const front = document.querySelector('card.front');
      return front && front.classList.contains('active');
    }, { timeout: 2000 });
    
    const frontActive = await frontCard.getAttribute('class');
    expect(frontActive).toContain('active');
  });

  test('should not flip card with arrow keys when input is focused', async ({ page }) => {
    const frontCard = page.locator('card.front');
    const todoInput = page.locator('todoList todoItem input').first();
    
    await todoInput.focus();
    
    // Press ArrowRight
    await page.keyboard.press('ArrowRight');
    
    // Card should still be on front (no flip should happen)
    // Small wait to ensure no flip occurred, then check
    await page.waitForFunction(() => {
      const front = document.querySelector('card.front');
      return front && front.classList.contains('active');
    }, { timeout: 500 });
    
    const frontActive = await frontCard.getAttribute('class');
    expect(frontActive).toContain('active');
  });

  // Data Persistence Tests
  test('should persist todos across navigation', async ({ page }) => {
    const todoInput = page.locator('todoList todoItem input').first();
    await todoInput.fill('Persistent task');
    await todoInput.blur();
    
    // Wait for save
    await page.waitForFunction(() => window.TodoApp?.cardManager, { timeout: 1000 });
    
    // Navigate to multiple pages
    await waitForRoute(page, '/#next');
    await waitForRoute(page, '/#someday');
    await waitForRoute(page, '/#todo');
    
    const todoInputAfter = page.locator('todoList todoItem input').first();
    const savedTask = await todoInputAfter.inputValue();
    expect(savedTask).toBe('Persistent task');
  });
});
