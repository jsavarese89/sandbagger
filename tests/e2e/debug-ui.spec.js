import { test, expect } from '@playwright/test';

test.describe('Debug UI Structure', () => {
  test('should show actual page structure', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait a bit more for any async loading
    await page.waitForTimeout(2000);
    
    // Get page title
    const title = await page.title();
    console.log('Page title:', title);
    
    // Get all headings
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
    console.log('All headings:', headings);
    
    // Get all form labels
    const labels = await page.locator('label').allTextContents();
    console.log('All labels:', labels);
    
    // Get all input placeholders
    const inputs = await page.locator('input');
    const inputCount = await inputs.count();
    console.log('Number of inputs:', inputCount);
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const placeholder = await input.getAttribute('placeholder');
      const type = await input.getAttribute('type');
      console.log(`Input ${i}: type=${type}, placeholder=${placeholder}`);
    }
    
    // Get all buttons
    const buttons = await page.locator('button').allTextContents();
    console.log('All buttons:', buttons);
    
    // Get page content
    const pageText = await page.locator('body').textContent();
    console.log('Page contains "Welcome":', pageText.includes('Welcome'));
    console.log('Page contains "Sandbagger":', pageText.includes('Sandbagger'));
    console.log('Page contains "Log In":', pageText.includes('Log In'));
    console.log('Page contains "Sign Up":', pageText.includes('Sign Up'));
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
    
    // This test should always pass, it's just for debugging
    expect(true).toBe(true);
  });
});