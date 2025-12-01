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
    // Check for console errors and JavaScript errors
    const errors = [];
    const jsErrors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Wait for scripts to initialize
    
    // Check that footer is visible
    await expect(page.locator('footer')).toBeVisible();
    
    // Check that content area exists
    await expect(page.locator('#content')).toBeVisible();
    
    // Filter out expected warnings (like allowfullscreen)
    const criticalErrors = errors.filter(err => 
      !err.includes('Allow attribute') && 
      !err.includes('favicon') &&
      !err.toLowerCase().includes('deprecated')
    );
    
    // Assert no critical errors occurred
    expect(criticalErrors.length).toBe(0);
    expect(jsErrors.length).toBe(0);
  });

  test('should navigate to Goal page', async ({ page }) => {
    const errors = [];
    const jsErrors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });

    // Click Goal link
    await page.click('footer a[href="#goal"]');
    
    // Wait for route to load
    await page.waitForTimeout(1000);
    
    // Check URL hash
    expect(page.url()).toContain('#goal');
    
    // Check that content loaded
    await expect(page.locator('#content')).not.toBeEmpty();
    
    // Filter out expected warnings
    const criticalErrors = errors.filter(err => 
      !err.includes('Allow attribute') && 
      !err.includes('favicon')
    );
    
    // Assert no errors
    expect(criticalErrors.length).toBe(0);
    expect(jsErrors.length).toBe(0);
  });

  test('should navigate to Calendar page', async ({ page }) => {
    const errors = [];
    const jsErrors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });

    // Click Calendar link
    await page.click('footer a[href="#calendar"]');
    
    // Wait for route to load and scripts to execute
    await page.waitForTimeout(3000);
    
    // Check URL hash
    expect(page.url()).toContain('#calendar');
    
    // Check that content loaded
    await expect(page.locator('#content')).not.toBeEmpty();
    
    // Give scripts time to execute and any errors to surface
    await page.waitForTimeout(1000);
    
    const criticalErrors = errors.filter(err => 
      !err.includes('Allow attribute') && 
      !err.includes('favicon')
    );
    
    // Specifically check for the errors we fixed
    const debugRedeclarationError = jsErrors.find(err => 
      err.includes("Identifier 'DEBUG' has already been declared")
    );
    const getWeeklyGoalsError = jsErrors.find(err => 
      err.includes('getWeeklyGoals is not defined')
    );
    
    // Log all errors for debugging
    if (jsErrors.length > 0 || criticalErrors.length > 0) {
      console.log('Found errors:', { 
        debugRedeclarationError, 
        getWeeklyGoalsError, 
        allJsErrors: jsErrors,
        criticalErrors: criticalErrors
      });
    }
    
    // Assert no specific errors occurred
    expect(debugRedeclarationError).toBeUndefined();
    expect(getWeeklyGoalsError).toBeUndefined();
    
    // Assert no other critical errors
    expect(criticalErrors.length).toBe(0);
    expect(jsErrors.length).toBe(0);
  });

  test('should navigate to Todo page', async ({ page }) => {
    const errors = [];
    const jsErrors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });

    // Click Todo link
    await page.click('footer a[href="#todo"]');
    
    // Wait for route to load
    await page.waitForTimeout(1000);
    
    // Check URL hash
    expect(page.url()).toContain('#todo');
    
    // Check that content loaded
    await expect(page.locator('#content')).not.toBeEmpty();
    
    const criticalErrors = errors.filter(err => 
      !err.includes('Allow attribute') && 
      !err.includes('favicon')
    );
    
    // Assert no errors
    expect(criticalErrors.length).toBe(0);
    expect(jsErrors.length).toBe(0);
  });

  test('should navigate to Next page', async ({ page }) => {
    const errors = [];
    const jsErrors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });

    // Click Next link
    await page.click('footer a[href="#next"]');
    
    // Wait for route to load
    await page.waitForTimeout(1000);
    
    // Check URL hash
    expect(page.url()).toContain('#next');
    
    // Check that content loaded
    await expect(page.locator('#content')).not.toBeEmpty();
    
    const criticalErrors = errors.filter(err => 
      !err.includes('Allow attribute') && 
      !err.includes('favicon')
    );
    
    // Assert no errors
    expect(criticalErrors.length).toBe(0);
    expect(jsErrors.length).toBe(0);
  });

  test('should navigate to Someday page', async ({ page }) => {
    const errors = [];
    const jsErrors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });

    // Click Someday link
    await page.click('footer a[href="#someday"]');
    
    // Wait for route to load
    await page.waitForTimeout(1000);
    
    // Check URL hash
    expect(page.url()).toContain('#someday');
    
    // Check that content loaded
    await expect(page.locator('#content')).not.toBeEmpty();
    
    const criticalErrors = errors.filter(err => 
      !err.includes('Allow attribute') && 
      !err.includes('favicon')
    );
    
    // Assert no errors
    expect(criticalErrors.length).toBe(0);
    expect(jsErrors.length).toBe(0);
  });

  test('should navigate to Export page', async ({ page }) => {
    const errors = [];
    const jsErrors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });

    // Navigate to export page
    await page.goto('/#export');
    await page.waitForTimeout(2000);
    
    // Check URL hash
    expect(page.url()).toContain('#export');
    
    // Check that content loaded
    await expect(page.locator('#content')).not.toBeEmpty();
    
    const criticalErrors = errors.filter(err => 
      !err.includes('Allow attribute') && 
      !err.includes('favicon')
    );
    
    // Assert no errors
    expect(criticalErrors.length).toBe(0);
    expect(jsErrors.length).toBe(0);
  });

  test('should navigate to Info page', async ({ page }) => {
    const errors = [];
    const jsErrors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });

    // Navigate to info page
    await page.goto('/#info');
    await page.waitForTimeout(2000);
    
    // Check URL hash
    expect(page.url()).toContain('#info');
    
    // Check that content loaded
    await expect(page.locator('#content')).not.toBeEmpty();
    
    const criticalErrors = errors.filter(err => 
      !err.includes('Allow attribute') && 
      !err.includes('favicon')
    );
    
    // Assert no errors
    expect(criticalErrors.length).toBe(0);
    expect(jsErrors.length).toBe(0);
  });

  test('should navigate to Coach page', async ({ page }) => {
    const errors = [];
    const jsErrors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });

    // Navigate to coach page
    await page.goto('/#coach');
    await page.waitForTimeout(2000);
    
    // Check URL hash
    expect(page.url()).toContain('#coach');
    
    // Check that content loaded
    await expect(page.locator('#content')).not.toBeEmpty();
    
    const criticalErrors = errors.filter(err => 
      !err.includes('Allow attribute') && 
      !err.includes('favicon')
    );
    
    // Assert no errors
    expect(criticalErrors.length).toBe(0);
    expect(jsErrors.length).toBe(0);
  });

  test('should navigate to Reminder page', async ({ page }) => {
    const errors = [];
    const jsErrors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });

    // Navigate to reminder page
    await page.goto('/#remind');
    await page.waitForTimeout(2000);
    
    // Check URL hash
    expect(page.url()).toContain('#remind');
    
    // Check that content loaded
    await expect(page.locator('#content')).not.toBeEmpty();
    
    const criticalErrors = errors.filter(err => 
      !err.includes('Allow attribute') && 
      !err.includes('favicon')
    );
    
    // Assert no errors
    expect(criticalErrors.length).toBe(0);
    expect(jsErrors.length).toBe(0);
  });

  test('should navigate to JAB Code page', async ({ page }) => {
    const errors = [];
    const jsErrors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });

    // Navigate to jabcode page
    await page.goto('/#jabcode');
    await page.waitForTimeout(2000);
    
    // Check URL hash
    expect(page.url()).toContain('#jabcode');
    
    // Check that content loaded
    await expect(page.locator('#content')).not.toBeEmpty();
    
    const criticalErrors = errors.filter(err => 
      !err.includes('Allow attribute') && 
      !err.includes('favicon')
    );
    
    // Assert no errors
    expect(criticalErrors.length).toBe(0);
    expect(jsErrors.length).toBe(0);
  });

  test('should navigate to WebRTC page', async ({ page }) => {
    const errors = [];
    const jsErrors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });

    // Navigate to webrtc page
    await page.goto('/#webrtc');
    await page.waitForTimeout(2000);
    
    // Check URL hash
    expect(page.url()).toContain('#webrtc');
    
    // Check that content loaded
    await expect(page.locator('#content')).not.toBeEmpty();
    
    const criticalErrors = errors.filter(err => 
      !err.includes('Allow attribute') && 
      !err.includes('favicon')
    );
    
    // Assert no errors
    expect(criticalErrors.length).toBe(0);
    expect(jsErrors.length).toBe(0);
  });

  test('should navigate to QR Code page', async ({ page }) => {
    const errors = [];
    const jsErrors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });

    // Navigate to qrcode page
    await page.goto('/#qrcode');
    await page.waitForTimeout(2000);
    
    // Check URL hash
    expect(page.url()).toContain('#qrcode');
    
    // Check that content loaded
    await expect(page.locator('#content')).not.toBeEmpty();
    
    const criticalErrors = errors.filter(err => 
      !err.includes('Allow attribute') && 
      !err.includes('favicon')
    );
    
    // Assert no errors
    expect(criticalErrors.length).toBe(0);
    expect(jsErrors.length).toBe(0);
  });

  test('should navigate through all nav links without errors', async ({ page }) => {
    const errors = [];
    const jsErrors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      jsErrors.push(error.message);
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
      await page.waitForTimeout(1000); // Wait longer for scripts to load
      
      // Verify URL changed
      expect(page.url()).toContain(link.href);
      
      // Verify content is loaded
      await expect(page.locator('#content')).not.toBeEmpty();
    }
    
    // Filter out expected warnings
    const criticalErrors = errors.filter(err => 
      !err.includes('Allow attribute') && 
      !err.includes('favicon') &&
      !err.toLowerCase().includes('deprecated')
    );
    
    // Log errors for debugging
    if (criticalErrors.length > 0 || jsErrors.length > 0) {
      console.log('Errors found:', { criticalErrors, jsErrors });
    }
    
    // Assert no critical errors occurred during navigation
    expect(criticalErrors.length).toBe(0);
    expect(jsErrors.length).toBe(0);
  });
});

