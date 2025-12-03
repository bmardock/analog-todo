// Shared test helpers for all test files

/**
 * Wait for a route to load completely
 * Handles redirects, waits for DOM and JS initialization
 */
async function waitForRoute(page, hash) {
  await page.goto(hash);
  
  // Wait for hash to be set (handles any redirects)
  await page.waitForFunction((expectedHash) => {
    const currentHash = window.location.hash;
    // Accept the hash or #info redirect (only on first load with empty DB)
    return currentHash === expectedHash || currentHash === '#info';
  }, hash, { timeout: 5000 });
  
  // If redirected to #info, navigate back (database was empty)
  const currentHash = await page.evaluate(() => window.location.hash);
  if (currentHash === '#info' && hash !== '#info') {
    // Force navigation back - the DB will have data after first test
    await page.goto(hash);
    await page.waitForFunction((expectedHash) => {
      return window.location.hash === expectedHash;
    }, hash, { timeout: 3000 });
  }
  
  // Wait for route to load and initialize
  await page.waitForSelector('todoList', { timeout: 10000 });
  await page.waitForFunction(() => window.TodoApp && window.TodoApp.cardManager, { timeout: 5000 });
}

module.exports = { waitForRoute };



