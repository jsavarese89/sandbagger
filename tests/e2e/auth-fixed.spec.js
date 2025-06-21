import { test, expect } from '@playwright/test';

test.describe('Authentication Flow (Fixed)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display login form on initial load', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Sandbagger');
    await expect(page.locator('h2')).toContainText('Log In');
    await expect(page.getByText("Don't have an account? Sign Up")).toBeVisible();
  });

  test('should switch between sign in and sign up forms', async ({ page }) => {
    // Start with log in form
    await expect(page.locator('h2')).toContainText('Log In');
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    
    // Switch to sign up
    await page.getByText("Don't have an account? Sign Up").click();
    await expect(page.locator('h2')).toContainText('Sign Up');
    await expect(page.getByLabel('Display Name')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    
    // Switch back to log in
    await page.getByText('Already have an account? Log In').click();
    await expect(page.locator('h2')).toContainText('Log In');
    await expect(page.getByLabel('Display Name')).not.toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.getByLabel('Email').fill('invalid-email');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Log In' }).click();
    
    // Should show validation error
    await expect(page.locator('.alert-danger')).toBeVisible();
  });

  test('should validate password requirements on sign up', async ({ page }) => {
    await page.getByText("Don't have an account? Sign Up").click();
    await page.getByLabel('Display Name').fill('Test User');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('123'); // Too short
    await page.getByRole('button', { name: 'Sign Up' }).click();
    
    // Should show password validation error
    await expect(page.locator('.alert-danger')).toBeVisible();
  });

  test('should show Google sign-in button', async ({ page }) => {
    await expect(page.getByText('Continue with Google')).toBeVisible();
  });

  test('should show Apple sign-in button', async ({ page }) => {
    await expect(page.getByText('Continue with Apple')).toBeVisible();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Fill in valid credentials first
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    
    // Simulate offline mode
    await page.context().setOffline(true);
    await page.getByRole('button', { name: 'Log In' }).click();
    
    // Should show network error message
    await expect(page.locator('.alert-danger')).toBeVisible();
    
    // Restore online mode
    await page.context().setOffline(false);
  });

  test('should display app features section', async ({ page }) => {
    await expect(page.getByText('Features')).toBeVisible();
    await expect(page.getByText('Scorecard Tracking')).toBeVisible();
    await expect(page.getByText('Bet Management')).toBeVisible();
    await expect(page.getByText('Stat Tracking')).toBeVisible();
    await expect(page.getByText('Social Features')).toBeVisible();
  });

  test('should show debug buttons', async ({ page }) => {
    await expect(page.getByText('Force Refresh')).toBeVisible();
    await expect(page.getByText('Reset App')).toBeVisible();
  });

  test('should handle form submission with empty fields', async ({ page }) => {
    await page.getByRole('button', { name: 'Log In' }).click();
    
    // Should show validation error for empty fields
    await expect(page.locator('.alert-danger')).toBeVisible();
    await expect(page.locator('.alert-danger')).toContainText('Please fill in all fields');
  });

  test('should handle sign up form validation', async ({ page }) => {
    await page.getByText("Don't have an account? Sign Up").click();
    
    // Try to submit without filling fields
    await page.getByRole('button', { name: 'Sign Up' }).click();
    
    // Should show validation error
    await expect(page.locator('.alert-danger')).toBeVisible();
  });
});

test.describe('Mobile Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Check that main elements are visible and properly sized
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('h2')).toContainText('Log In');
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    
    // Check that buttons are touch-friendly
    const loginButton = page.getByRole('button', { name: 'Log In' });
    await expect(loginButton).toBeVisible();
    
    // Check Google and Apple buttons are visible
    await expect(page.getByText('Continue with Google')).toBeVisible();
    await expect(page.getByText('Continue with Apple')).toBeVisible();
  });

  test('should handle mobile form interactions', async ({ page }) => {
    // Test touch interactions
    await page.getByLabel('Email').tap();
    await page.getByLabel('Email').fill('mobile@test.com');
    
    await page.getByLabel('Password').tap();
    await page.getByLabel('Password').fill('password123');
    
    // Test form switching on mobile
    await page.getByText("Don't have an account? Sign Up").tap();
    await expect(page.locator('h2')).toContainText('Sign Up');
  });
});