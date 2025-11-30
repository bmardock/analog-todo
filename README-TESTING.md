# Testing Guide

This project uses [Playwright](https://playwright.dev) for end-to-end testing.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npx playwright install
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in headed mode (see browser)
```bash
npm run test:headed
```

### Run tests with UI mode (interactive)
```bash
npm run test:ui
```

## Test Structure

Tests are located in the `tests/` directory:

- `navigation.spec.js` - Tests for bottom navigation links and page loading

## What Tests Cover

- Page loads without errors
- All navigation links work correctly
- No console errors during navigation
- Content loads properly for each route

## Continuous Integration

The tests are configured to:
- Run on Chromium, Firefox, and WebKit
- Automatically start a local server on port 8080
- Retry failed tests in CI environments
- Generate HTML reports for test results

