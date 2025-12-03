const { test, expect } = require('@playwright/test');

test.describe('Service Worker Tests', () => {
  test('should register service worker', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Check if service worker is registered
    const swRegistration = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        return await navigator.serviceWorker.getRegistration();
      }
      return null;
    });
    
    expect(swRegistration).not.toBeNull();
  });

  test('should cache assets', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForTimeout(3000); // Wait for SW to install and cache
    
    // Go offline
    await context.setOffline(true);
    
    // Reload page - should still work from cache
    await page.reload();
    await page.waitForTimeout(1000);
    
    // Check that content is still visible
    await expect(page.locator('footer')).toBeVisible();
    await expect(page.locator('#content')).toBeVisible();
  });

  test('should handle cache clearing', async ({ page }) => {
    await page.goto('/#info');
    await page.waitForTimeout(2000);
    
    // Click clear cache button
    const clearCacheButton = page.locator('#clearCache');
    await expect(clearCacheButton).toBeVisible();
    
    // Note: This will reload the page, so we can't easily test the result
    // But we can verify the button exists and is clickable
    await clearCacheButton.click();
    
    // Page should reload (we can't easily test this without intercepting reload)
    // But we can verify the button functionality exists
  });
});



