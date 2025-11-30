const { test, expect } = require('@playwright/test');

test.describe('Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for the app to initialize
    await page.waitForSelector('footer', { timeout: 5000 });
    
    // Wait for database to initialize
    await page.waitForTimeout(1000);
  });

  test('should load the page without errors', async ({ page }) => {
    // Check for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.waitForLoadState('networkidle');
    
    // Check that footer is visible
    await expect(page.locator('footer')).toBeVisible();
    
    // Check that content area exists
    await expect(page.locator('#content')).toBeVisible();
    
    // Assert no errors occurred
    expect(errors.length).toBe(0);
  });

  test('should navigate to Goal page', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Click Goal link
    await page.click('footer a[href="#goal"]');
    
    // Wait for route to load
    await page.waitForTimeout(500);
    
    // Check URL hash
    expect(page.url()).toContain('#goal');
    
    // Check that content loaded
    await expect(page.locator('#content')).not.toBeEmpty();
    
    // Assert no errors
    expect(errors.length).toBe(0);
  });

  test('should navigate to Calendar page', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Click Calendar link
    await page.click('footer a[href="#calendar"]');
    
    // Wait for route to load
    await page.waitForTimeout(500);
    
    // Check URL hash
    expect(page.url()).toContain('#calendar');
    
    // Check that content loaded
    await expect(page.locator('#content')).not.toBeEmpty();
    
    // Assert no errors
    expect(errors.length).toBe(0);
  });

  test('should navigate to Todo page', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Click Todo link
    await page.click('footer a[href="#todo"]');
    
    // Wait for route to load
    await page.waitForTimeout(500);
    
    // Check URL hash
    expect(page.url()).toContain('#todo');
    
    // Check that content loaded
    await expect(page.locator('#content')).not.toBeEmpty();
    
    // Assert no errors
    expect(errors.length).toBe(0);
  });

  test('should navigate to Next page', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Click Next link
    await page.click('footer a[href="#next"]');
    
    // Wait for route to load
    await page.waitForTimeout(500);
    
    // Check URL hash
    expect(page.url()).toContain('#next');
    
    // Check that content loaded
    await expect(page.locator('#content')).not.toBeEmpty();
    
    // Assert no errors
    expect(errors.length).toBe(0);
  });

  test('should navigate to Someday page', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Click Someday link
    await page.click('footer a[href="#someday"]');
    
    // Wait for route to load
    await page.waitForTimeout(500);
    
    // Check URL hash
    expect(page.url()).toContain('#someday');
    
    // Check that content loaded
    await expect(page.locator('#content')).not.toBeEmpty();
    
    // Assert no errors
    expect(errors.length).toBe(0);
  });

  test('should navigate through all nav links without errors', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    const navLinks = [
      { href: '#goal', name: 'Goal' },
      { href: '#calendar', name: 'Calendar' },
      { href: '#todo', name: 'Todo' },
      { href: '#next', name: 'Next' },
      { href: '#someday', name: 'Someday' },
    ];

    // Navigate through all links
    for (const link of navLinks) {
      await page.click(`footer a[href="${link.href}"]`);
      await page.waitForTimeout(500);
      
      // Verify URL changed
      expect(page.url()).toContain(link.href);
      
      // Verify content is loaded
      await expect(page.locator('#content')).not.toBeEmpty();
    }
    
    // Assert no errors occurred during navigation
    expect(errors.length).toBe(0);
  });
});

