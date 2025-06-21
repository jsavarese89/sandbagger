import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login form on initial load', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Sandbagger');
    await expect(page.locator('h2')).toContainText('Log In');
    await expect(page.getByText("Don't have an account? Sign Up")).toBeVisible();
  });

  test('should switch between sign in and sign up forms', async ({ page }) => {
    // Start with log in form
    await expect(page.locator('h2')).toContainText('Log In');
    await expect(page.getByTestId('email-input')).toBeVisible();
    await expect(page.getByTestId('password-input')).toBeVisible();
    
    // Switch to sign up
    await page.getByText("Don't have an account? Sign Up").click();
    await expect(page.locator('h2')).toContainText('Sign Up');
    await expect(page.getByTestId('displayname-input')).toBeVisible();
    await expect(page.getByTestId('signup-email-input')).toBeVisible();
    await expect(page.getByTestId('signup-password-input')).toBeVisible();
    
    // Switch back to log in
    await page.getByText('Already have an account? Log In').click();
    await expect(page.locator('h2')).toContainText('Log In');
    await expect(page.getByTestId('displayname-input')).not.toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.getByTestId('email-input').fill('invalid-email');
    await page.getByTestId('password-input').fill('password123');
    await page.getByTestId('login-submit').click();
    
    // Should show validation error
    await expect(page.locator('.alert-danger')).toBeVisible();
  });

  test('should validate password requirements on sign up', async ({ page }) => {
    await page.getByText("Don't have an account? Sign Up").click();
    await page.getByTestId('displayname-input').fill('Test User');
    await page.getByTestId('signup-email-input').fill('test@example.com');
    await page.getByTestId('signup-password-input').fill('123'); // Too short
    await page.getByTestId('signup-submit').click();
    
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
    await page.getByTestId('email-input').fill('test@example.com');
    await page.getByTestId('password-input').fill('password123');
    
    // Simulate offline mode
    await page.context().setOffline(true);
    await page.getByTestId('login-submit').click();
    
    // Should show network error message
    await expect(page.locator('.alert-danger')).toBeVisible();
    
    // Restore online mode
    await page.context().setOffline(false);
  });

  test('should handle anonymous sign-in option', async ({ page }) => {
    // Look for anonymous/guest option if available
    const guestButton = page.getByText('Continue as Guest');
    if (await guestButton.isVisible()) {
      await guestButton.click();
      // Should navigate to main app
      await expect(page.url()).toContain('/dashboard');
    }
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    // Check for ARIA attributes
    await expect(page.getByTestId('email-input')).toHaveAttribute('aria-label', 'Email');
    await expect(page.getByTestId('password-input')).toHaveAttribute('aria-label', 'Password');
    
    // Check for error association when error occurs
    await page.getByTestId('email-input').fill('invalid-email');
    await page.getByTestId('password-input').fill('password123');
    await page.getByTestId('login-submit').click();
    
    // Error message should have proper role
    await expect(page.locator('.alert-danger')).toHaveAttribute('role', 'alert');
    await expect(page.locator('.alert-danger')).toHaveAttribute('aria-live', 'polite');
  });

  test('should handle form submission with empty fields', async ({ page }) => {
    await page.getByTestId('login-submit').click();
    
    // Should show validation error for empty fields
    await expect(page.locator('.alert-danger')).toBeVisible();
    await expect(page.locator('.alert-danger')).toContainText('Please fill in all fields');
  });

  test('should handle sign up form validation', async ({ page }) => {
    await page.getByText("Don't have an account? Sign Up").click();
    
    // Try to submit without filling fields
    await page.getByTestId('signup-submit').click();
    
    // Should show validation error
    await expect(page.locator('.alert-danger')).toBeVisible();
  });

  test('should handle password confirmation mismatch', async ({ page }) => {
    await page.getByText("Don't have an account? Sign Up").click();
    
    await page.getByTestId('displayname-input').fill('Test User');
    await page.getByTestId('signup-email-input').fill('test@example.com');
    await page.getByTestId('signup-password-input').fill('password123');
    await page.getByTestId('confirm-password-input').fill('differentpassword');
    await page.getByTestId('signup-submit').click();
    
    // Should show password mismatch error
    await expect(page.locator('.alert-danger')).toBeVisible();
    await expect(page.locator('.alert-danger')).toContainText('Passwords do not match');
  });
});