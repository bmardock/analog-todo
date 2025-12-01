const { test, expect } = require('@playwright/test');

test.describe('Export Page Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#export');
    await page.waitForTimeout(2000);
  });

  test('should generate connection code', async ({ page }) => {
    const generateButton = page.locator('#generateButton');
    const codeInput = page.locator('#code-input');
    
    await expect(generateButton).toBeVisible();
    await expect(codeInput).toBeVisible();
    
    await generateButton.click();
    await page.waitForTimeout(500);
    
    const code = await codeInput.inputValue();
    // Should match pattern XXX-XXX
    expect(code).toMatch(/^\d{3}-\d{3}$/);
  });

  test('should format code input correctly', async ({ page }) => {
    const codeInput = page.locator('#code-input');
    
    await codeInput.fill('123456');
    await page.waitForTimeout(500);
    
    const formatted = await codeInput.inputValue();
    expect(formatted).toBe('123-456');
  });

  test('should show export data when clicked', async ({ page }) => {
    const showDataButton = page.locator('#showData');
    const jsonTextarea = page.locator('#json');
    const dataContainer = page.locator('.data');
    
    await expect(showDataButton).toBeVisible();
    
    // Initially closed
    await expect(dataContainer).not.toHaveClass(/open/);
    
    await showDataButton.click();
    await page.waitForTimeout(1000);
    
    // Should be open and have data
    await expect(dataContainer).toHaveClass(/open/);
    await expect(jsonTextarea).toBeVisible();
    
    const jsonData = await jsonTextarea.inputValue();
    expect(jsonData.length).toBeGreaterThan(0);
    // Should be valid JSON
    expect(() => JSON.parse(jsonData)).not.toThrow();
  });

  test('should validate JSON before saving', async ({ page }) => {
    const showDataButton = page.locator('#showData');
    const jsonTextarea = page.locator('#json');
    const saveButton = page.locator('#saveData');
    
    await showDataButton.click();
    await page.waitForTimeout(1000);
    
    // Initially should be enabled (valid JSON)
    await expect(saveButton).toBeEnabled();
    
    // Enter invalid JSON
    await jsonTextarea.fill('invalid json {');
    await jsonTextarea.blur();
    await page.waitForTimeout(500);
    
    // Should be disabled
    await expect(saveButton).toBeDisabled();
    
    // Fix JSON
    await jsonTextarea.fill('{"todo": []}');
    await jsonTextarea.blur();
    await page.waitForTimeout(500);
    
    // Should be enabled again
    await expect(saveButton).toBeEnabled();
  });

  test('should import valid JSON data', async ({ page }) => {
    const showDataButton = page.locator('#showData');
    const jsonTextarea = page.locator('#json');
    const saveButton = page.locator('#saveData');
    const msgsTextarea = page.locator('#msgs');
    
    await showDataButton.click();
    await page.waitForTimeout(1000);
    
    // Enter valid test data
    const testData = JSON.stringify({
      todo: [{
        date: '2024-01-01',
        todos: [{ text: 'Test import', signal: '' }],
        cardSignal: [false, false, false],
        braindump: ''
      }],
      next: [],
      someday: [],
      weeklyGoals: []
    });
    
    await jsonTextarea.fill(testData);
    await jsonTextarea.blur();
    await page.waitForTimeout(500);
    
    await saveButton.click();
    await page.waitForTimeout(2000);
    
    // Should show success message
    const messages = await msgsTextarea.inputValue();
    expect(messages).toContain('Import completed');
  });
});

