# Sandbagger Golf App - Testing Guide

## Overview

This document provides comprehensive guidelines for testing the Sandbagger golf application, covering unit tests, integration tests, and end-to-end (E2E) tests.

## Testing Stack

- **E2E Testing**: Playwright
- **Unit Testing**: Vitest + React Testing Library (when implemented)
- **Test Browsers**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **CI/CD**: Ready for GitHub Actions integration

## Project Structure

```
tests/
├── e2e/
│   ├── auth.spec.js              # Authentication flows
│   ├── dashboard.spec.js         # Dashboard and navigation
│   ├── scorecard.spec.js         # Golf scoring functionality  
│   ├── betting.spec.js           # Betting system tests
│   ├── integration.spec.js       # Full workflow integration
│   ├── auth-fixed.spec.js        # Enhanced auth tests
│   └── debug-ui.spec.js          # Debugging utilities
├── unit/ (future)
└── docs/
    └── testing-guide.md          # This document
```

## Test Selector Best Practices

### ✅ Recommended Selectors (In Order of Preference)

1. **data-testid attributes** (Most Reliable)
```javascript
page.getByTestId('email-input')
page.getByTestId('login-submit')
page.getByTestId('nav-tab-dashboard')
```

2. **Role-based selectors** (Semantic)
```javascript
page.getByRole('button', { name: 'Log In' })
page.getByRole('textbox', { name: 'Email' })
```

3. **Label associations** (Accessible)
```javascript
page.getByLabel('Email')
page.getByLabel('Password')
```

### ❌ Avoid These Selectors

1. **Text-only selectors** (Brittle)
```javascript
// BAD - can match multiple elements
page.getByText('Scorecard')
page.getByText('Dashboard')
```

2. **CSS class selectors** (Implementation-dependent)
```javascript
// BAD - tied to styling
page.locator('.btn-primary')
page.locator('.card-title')
```

3. **Complex CSS paths** (Fragile)
```javascript
// BAD - breaks with DOM changes
page.locator('div.container > .form > input:nth-child(2)')
```

## Component Test ID Reference

### Authentication Components

```javascript
// Login.jsx
'login-form'           // Form container
'email-input'          // Email input field
'password-input'       // Password input field
'login-submit'         // Submit button
'google-signin-btn'    // Google OAuth button
'apple-signin-btn'     // Apple OAuth button
'toggle-signup-btn'    // Switch to signup

// Signup.jsx
'signup-form'          // Form container
'displayname-input'    // Display name field
'signup-email-input'   // Email field
'signup-password-input' // Password field
'confirm-password-input' // Confirm password
'signup-submit'        // Submit button
'signup-google-btn'    // Google OAuth
'signup-apple-btn'     // Apple OAuth
'toggle-login-btn'     // Switch to login
```

### Navigation Components

```javascript
// App.jsx - Main Navigation
'nav-tab-new-round'    // New Round tab
'nav-tab-dashboard'    // Dashboard tab
'start-round-btn'      // Start Round button
'end-round-btn'        // End Round button

// Bottom Navigation
'bottom-nav-new-round' // New Round nav
'bottom-nav-scorecard' // Scorecard nav
'bottom-nav-dashboard' // Dashboard nav
'bottom-nav-logout'    // Logout nav

// NavigationMenu.jsx - Hamburger Menu
'hamburger-menu-btn'   // Menu toggle
'menu-nav-new-round'   // New Round option
'menu-nav-profile'     // Profile option
'menu-nav-stats'       // Stats option
'menu-nav-history'     // History option
'menu-nav-friends'     // Friends option
'menu-nav-rounds'      // Rounds option
'menu-nav-notifications' // Notifications
'menu-logout-btn'      // Logout button
'menu-close-btn'       // Close menu
```

### Player Management Components

```javascript
// PlayerManagement.jsx
'toggle-golf-buddies-btn' // Show/hide golf buddies
'search-email-input'      // Friend search input
'search-submit-btn'       // Search button
'add-search-result-btn'   // Add search result
'add-friend-btn'          // Add friend to round
'player-name-input'       // Player name field
'player-handicap-input'   // Player handicap
'player-submit-btn'       // Add/update player
'player-cancel-btn'       // Cancel editing
'player-edit-btn'         // Edit player
'player-delete-btn'       // Delete player
```

### Error Handling Components

```javascript
// ErrorBoundary.jsx
'retry-network-btn'    // Network retry button
'try-again-btn'        // General retry
'reload-app-btn'       // Reload application
'copy-error-report-btn' // Copy error details
```

## Writing Robust Tests

### 1. Wait Strategies

```javascript
// Wait for page to be ready
await page.goto('/');
await page.waitForLoadState('networkidle');

// Wait for specific elements
await page.waitForSelector('input[type="number"]', { timeout: 10000 });

// Wait with timeout for optional elements
if (await element.isVisible({ timeout: 5000 }).catch(() => false)) {
  // Element exists, interact with it
}
```

### 2. Error Handling

```javascript
// Graceful error handling for optional elements
const optionalButton = page.getByTestId('optional-feature');
if (await optionalButton.isVisible().catch(() => false)) {
  await optionalButton.click();
}

// Multiple fallback selectors
const errorMessage = page.locator('.alert-danger')
  .or(page.getByText('Error'))
  .or(page.locator('[role="alert"]'));
```

### 3. Network Simulation

```javascript
// Offline testing
await page.context().setOffline(true);
await page.waitForTimeout(1000); // Allow offline state to register

// Perform offline actions
await page.getByTestId('email-input').fill('test@example.com');
await page.getByTestId('login-submit').click();

// Restore connection
await page.context().setOffline(false);
await page.waitForTimeout(2000); // Allow recovery
```

### 4. Form Testing Patterns

```javascript
// Comprehensive form testing
test('should validate form inputs', async ({ page }) => {
  // Test empty form submission
  await page.getByTestId('login-submit').click();
  await expect(page.locator('.alert-danger')).toBeVisible();
  await expect(page.locator('.alert-danger')).toContainText('Please fill in all fields');
  
  // Test invalid email
  await page.getByTestId('email-input').fill('invalid-email');
  await page.getByTestId('password-input').fill('password123');
  await page.getByTestId('login-submit').click();
  await expect(page.locator('.alert-danger')).toBeVisible();
  
  // Test valid submission
  await page.getByTestId('email-input').fill('valid@example.com');
  await page.getByTestId('password-input').fill('validpassword');
  await page.getByTestId('login-submit').click();
  // Assert expected behavior
});
```

## Accessibility Testing

### ARIA Attributes Testing

```javascript
// Check for proper ARIA attributes
await expect(page.getByTestId('email-input')).toHaveAttribute('aria-label', 'Email');
await expect(page.locator('.alert-danger')).toHaveAttribute('role', 'alert');
await expect(page.locator('.alert-danger')).toHaveAttribute('aria-live', 'polite');

// Test form association
await page.getByTestId('email-input').fill('invalid-email');
await page.getByTestId('login-submit').click();
await expect(page.getByTestId('email-input')).toHaveAttribute('aria-invalid', 'true');
```

### Screen Reader Testing

```javascript
// Test screen reader announcements
const errorMessage = page.locator('.alert-danger');
await expect(errorMessage).toContainText('Error:'); // Screen reader prefix
```

## Mobile Testing

### Viewport Configuration

```javascript
test.describe('Mobile Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
  });

  test('should be touch-friendly', async ({ page }) => {
    // Test touch interactions
    await page.getByTestId('hamburger-menu-btn').tap();
    await expect(page.getByTestId('menu-nav-profile')).toBeVisible();
    
    // Test bottom navigation
    await page.getByTestId('bottom-nav-dashboard').tap();
    await expect(page.url()).toContain('/dashboard');
  });
});
```

## Cross-Browser Testing

### Browser-Specific Considerations

```javascript
// Chrome/Chromium
test.describe('Chrome Tests', () => {
  test.use({ browserName: 'chromium' });
  // Chrome-specific tests
});

// Firefox
test.describe('Firefox Tests', () => {
  test.use({ browserName: 'firefox' });
  // Firefox-specific tests
});

// Safari (WebKit)
test.describe('Safari Tests', () => {
  test.use({ browserName: 'webkit' });
  // Safari-specific tests
});
```

## Performance Testing

### Load Testing

```javascript
test('should handle performance under load', async ({ page }) => {
  // Rapid input simulation
  const scoreInputs = page.locator('input[type="number"]');
  const inputCount = Math.min(await scoreInputs.count(), 72);
  
  for (let i = 0; i < inputCount; i++) {
    const input = scoreInputs.nth(i);
    if (await input.isVisible()) {
      await input.fill((Math.floor(Math.random() * 6) + 3).toString());
    }
  }
  
  // Verify app remains responsive
  const navigationMenu = page.getByTestId('hamburger-menu-btn');
  await navigationMenu.click();
  await expect(page.getByTestId('menu-nav-profile')).toBeVisible({ timeout: 5000 });
});
```

## Common Issues and Troubleshooting

### 1. Selector Conflicts

**Problem**: Multiple elements match the same selector
```javascript
// BAD
const scoreCardNav = page.getByText('Scorecard'); // Matches multiple elements
```

**Solution**: Use specific test IDs
```javascript
// GOOD
const scoreCardNav = page.getByTestId('bottom-nav-scorecard');
```

### 2. Timing Issues

**Problem**: Tests fail intermittently due to timing
```javascript
// BAD
await page.click('button');
await expect(page.locator('.result')).toBeVisible(); // May fail
```

**Solution**: Add proper waits
```javascript
// GOOD
await page.click('button');
await page.waitForSelector('.result', { timeout: 10000 });
await expect(page.locator('.result')).toBeVisible();
```

### 3. Network Simulation Issues

**Problem**: Network state not properly handled
```javascript
// BAD
await page.context().setOffline(true);
await page.click('button'); // Immediate action
```

**Solution**: Allow state to register
```javascript
// GOOD
await page.context().setOffline(true);
await page.waitForTimeout(1000); // Allow offline state
await page.click('button');
```

### 4. Element Re-rendering

**Problem**: Elements become stale after page changes
```javascript
// BAD
const input = page.getByTestId('score-input');
await page.reload();
await input.fill('5'); // May fail - element stale
```

**Solution**: Re-locate elements after page changes
```javascript
// GOOD
await page.reload();
await page.waitForSelector('[data-testid="score-input"]');
const input = page.getByTestId('score-input'); // Fresh reference
await input.fill('5');
```

## Test Commands

### Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npm run test:e2e -- tests/e2e/auth.spec.js

# Run tests with specific browser
npm run test:e2e -- --project=chromium
npm run test:e2e -- --project=firefox
npm run test:e2e -- --project=webkit

# Run tests in headed mode (see browser)
npm run test:e2e -- --headed

# Run tests with debug mode
npm run test:e2e -- --debug

# Run specific test by name
npm run test:e2e -- --grep "should display login form"
```

### Debugging Tests

```bash
# Run with UI mode
npm run test:e2e -- --ui

# Generate test report
npm run test:e2e -- --reporter=html

# Run with trace
npm run test:e2e -- --trace=on
```

## Test Maintenance

### 1. Regular Updates

- Update test IDs when components change
- Review and update selectors quarterly
- Validate cross-browser compatibility monthly

### 2. Performance Monitoring

- Monitor test execution times
- Identify and fix flaky tests
- Optimize slow test scenarios

### 3. Coverage Analysis

- Ensure all critical user paths are tested
- Add tests for new features immediately
- Review test coverage reports monthly

## Writing New Tests

### 1. Test Structure

```javascript
test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup code
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should do something specific', async ({ page }) => {
    // Arrange - set up test data
    
    // Act - perform actions
    
    // Assert - verify results
    await expect(page.getByTestId('result')).toBeVisible();
  });
});
```

### 2. Test Naming Convention

- Use descriptive names: `should display error message when email is invalid`
- Start with action: `should`, `must`, `can`
- Include expected outcome
- Be specific about conditions

### 3. Test Documentation

```javascript
test('should handle network recovery after offline period', async ({ page }) => {
  // Test verifies the ErrorBoundary network recovery features work correctly
  // when the app goes offline and then comes back online
  
  // This test covers:
  // 1. Offline state detection
  // 2. Error boundary activation
  // 3. Network recovery UI
  // 4. Successful reconnection
  
  // Setup and test implementation...
});
```

## Success Criteria

### Test Quality Metrics

- **Pass Rate**: >95% across all browsers
- **Execution Time**: <5 minutes for full suite
- **Flaky Test Rate**: <5%
- **Coverage**: >90% of critical user paths

### Browser Compatibility

- Chrome/Chromium: 100% pass rate
- Firefox: 100% pass rate  
- Safari/WebKit: 100% pass rate
- Mobile Chrome: 100% pass rate
- Mobile Safari: 100% pass rate

### Performance Benchmarks

- Page load: <3 seconds
- Test execution: <300ms per test
- Network simulation: <2 seconds recovery
- Mobile responsiveness: <500ms interaction

---

## Conclusion

This testing guide provides the foundation for maintaining high-quality, reliable tests for the Sandbagger golf application. By following these practices, we ensure the app works correctly across all browsers and devices while providing excellent user experience.

For questions or issues not covered in this guide, please refer to the [Playwright documentation](https://playwright.dev/) or contact the development team.