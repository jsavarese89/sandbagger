import { test, expect } from '@playwright/test';

test.describe('Debug Menu Structure', () => {
  test('should inspect hamburger menu visibility and icon', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // First, let's see what's on the page initially
    console.log('=== INITIAL PAGE STATE ===');
    const pageContent = await page.content();
    console.log('Page contains hamburger-menu-btn:', pageContent.includes('hamburger-menu-btn'));
    
    // Try to skip authentication to see the main app
    const guestButton = page.getByText('Continue as Guest').or(page.getByText('Skip'));
    if (await guestButton.isVisible().catch(() => false)) {
      console.log('Found guest/skip button, clicking...');
      await guestButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Look for navigation elements
    console.log('=== NAVIGATION ELEMENTS ===');
    const navElements = await page.locator('.navbar, nav, header').all();
    console.log('Number of navigation containers:', navElements.length);
    
    for (let i = 0; i < navElements.length; i++) {
      const navText = await navElements[i].textContent();
      console.log(`Nav container ${i}:`, navText);
    }
    
    // Look specifically for hamburger menu
    console.log('=== HAMBURGER MENU SEARCH ===');
    const hamburgerSelectors = [
      '[data-testid="hamburger-menu-btn"]',
      '.hamburger-btn',
      '.hamburger',
      'button[aria-label="Toggle menu"]',
      '.menu-toggle'
    ];
    
    for (const selector of hamburgerSelectors) {
      const element = page.locator(selector);
      const isVisible = await element.isVisible().catch(() => false);
      const count = await element.count();
      console.log(`Selector "${selector}": visible=${isVisible}, count=${count}`);
      
      if (isVisible) {
        const boundingBox = await element.boundingBox();
        const styles = await element.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            position: computed.position,
            top: computed.top,
            right: computed.right,
            zIndex: computed.zIndex,
            display: computed.display,
            visibility: computed.visibility,
            opacity: computed.opacity
          };
        });
        console.log('Hamburger button position:', boundingBox);
        console.log('Hamburger button styles:', styles);
        
        // Try to click and see what happens
        await element.click();
        await page.waitForTimeout(1000);
        
        // Check for menu popup
        const menuPopup = page.locator('.nav-menu, .mobile-menu, .menu-dropdown, [role="menu"]');
        const menuVisible = await menuPopup.isVisible().catch(() => false);
        console.log('Menu popup visible after click:', menuVisible);
        
        if (menuVisible) {
          const menuBox = await menuPopup.boundingBox();
          const menuStyles = await menuPopup.evaluate(el => {
            const computed = window.getComputedStyle(el);
            return {
              position: computed.position,
              top: computed.top,
              right: computed.right,
              width: computed.width,
              height: computed.height,
              zIndex: computed.zIndex,
              overflow: computed.overflow
            };
          });
          console.log('Menu popup position:', menuBox);
          console.log('Menu popup styles:', menuStyles);
        }
      }
    }
    
    // Look for the menu content regardless of trigger
    console.log('=== MENU CONTENT SEARCH ===');
    const menuContentSelectors = [
      'text="Profile"',
      'text="Dashboard"', 
      'text="New Round"',
      'text="Stats"',
      'text="Navigation"',
      '[data-testid*="menu-nav"]'
    ];
    
    for (const selector of menuContentSelectors) {
      const element = page.locator(selector);
      const isVisible = await element.isVisible().catch(() => false);
      const count = await element.count();
      console.log(`Menu content "${selector}": visible=${isVisible}, count=${count}`);
    }
    
    // Check viewport and responsive behavior
    console.log('=== VIEWPORT INFO ===');
    const viewport = page.viewportSize();
    console.log('Current viewport:', viewport);
    
    // Take a screenshot for visual inspection
    await page.screenshot({ 
      path: 'debug-menu-screenshot.png', 
      fullPage: true 
    });
    console.log('Screenshot saved as debug-menu-screenshot.png');
    
    // This test should always pass - it's just for debugging
    expect(true).toBe(true);
  });
});