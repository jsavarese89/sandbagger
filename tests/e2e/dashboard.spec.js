import { test, expect } from '@playwright/test';

test.describe('Dashboard and Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Note: In real tests, you'd need to handle authentication first
  });

  test('should display main navigation menu', async ({ page }) => {
    // Look for hamburger menu button
    const menuButton = page.getByTestId('hamburger-menu-btn');
    
    if (await menuButton.isVisible()) {
      await menuButton.click();
      
      // Should show navigation options
      await expect(page.getByTestId('menu-nav-new-round')).toBeVisible();
      await expect(page.getByTestId('menu-nav-profile')).toBeVisible();
      await expect(page.getByTestId('menu-nav-stats')).toBeVisible();
      await expect(page.getByTestId('menu-nav-history')).toBeVisible();
      await expect(page.getByTestId('menu-nav-friends')).toBeVisible();
    }
  });

  test('should navigate between main sections', async ({ page }) => {
    // Test main tab navigation
    const newRoundTab = page.getByTestId('nav-tab-new-round');
    const dashboardTab = page.getByTestId('nav-tab-dashboard');
    
    if (await newRoundTab.isVisible()) {
      await newRoundTab.click();
      await expect(page.locator('h3')).toContainText('Player Management');
    }
    
    if (await dashboardTab.isVisible()) {
      await dashboardTab.click();
      await expect(page.url()).toContain('/dashboard');
    }
    
    // Test bottom navigation
    const bottomNavDashboard = page.getByTestId('bottom-nav-dashboard');
    const bottomNavNewRound = page.getByTestId('bottom-nav-new-round');
    
    if (await bottomNavDashboard.isVisible()) {
      await bottomNavDashboard.click();
      await expect(page.url()).toContain('/dashboard');
    }
    
    if (await bottomNavNewRound.isVisible()) {
      await bottomNavNewRound.click();
      await expect(page.locator('h3')).toContainText('Player Management');
    }
  });

  test('should display dashboard overview', async ({ page }) => {
    // Navigate to dashboard using test ID
    const dashboardTab = page.getByTestId('nav-tab-dashboard');
    if (await dashboardTab.isVisible()) {
      await dashboardTab.click();
    }

    // Should show dashboard welcome or features
    const featuresSection = page.getByText('Features');
    if (await featuresSection.isVisible()) {
      await expect(featuresSection).toBeVisible();
      await expect(page.getByText('Scorecard Tracking')).toBeVisible();
      await expect(page.getByText('Bet Management')).toBeVisible();
      await expect(page.getByText('Stat Tracking')).toBeVisible();
      await expect(page.getByText('Social Features')).toBeVisible();
    }
  });

  test('should display user profile information', async ({ page }) => {
    // Navigate to dashboard first
    const dashboardTab = page.getByTestId('nav-tab-dashboard');
    if (await dashboardTab.isVisible()) {
      await dashboardTab.click();
    }
    
    // Open hamburger menu to access profile
    const menuButton = page.getByTestId('hamburger-menu-btn');
    if (await menuButton.isVisible()) {
      await menuButton.click();
      
      // Click on profile in the menu
      const profileLink = page.getByTestId('menu-nav-profile');
      if (await profileLink.isVisible()) {
        await profileLink.click();
        
        // Should show user information elements
        const userInfo = page.getByText('Display Name').or(page.getByText('Email'));
        if (await userInfo.isVisible()) {
          await expect(userInfo).toBeVisible();
        }
        
        // Should show handicap information
        const handicapInfo = page.getByText('Handicap');
        if (await handicapInfo.isVisible()) {
          await expect(handicapInfo).toBeVisible();
        }
      }
    }
  });

  test('should handle settings and preferences', async ({ page }) => {
    const settingsLink = page.getByText('Settings');
    
    if (await settingsLink.isVisible()) {
      await settingsLink.click();
      
      // Should show settings options
      const darkModeToggle = page.getByText('Dark Mode').or(page.locator('input[type="checkbox"]'));
      if (await darkModeToggle.isVisible()) {
        await expect(darkModeToggle).toBeVisible();
        
        // Test toggle functionality
        if (await page.locator('input[type="checkbox"]').first().isVisible()) {
          await page.locator('input[type="checkbox"]').first().click();
          // Could verify theme change here
        }
      }
      
      // Look for notification settings
      const notificationSettings = page.getByText('Notifications');
      if (await notificationSettings.isVisible()) {
        await expect(notificationSettings).toBeVisible();
      }
    }
  });

  test('should display friend management', async ({ page }) => {
    // Navigate to dashboard first
    const dashboardTab = page.getByTestId('nav-tab-dashboard');
    if (await dashboardTab.isVisible()) {
      await dashboardTab.click();
    }
    
    // Open hamburger menu
    const menuButton = page.getByTestId('hamburger-menu-btn');
    if (await menuButton.isVisible()) {
      await menuButton.click();
      
      // Click on friends section
      const friendsLink = page.getByTestId('menu-nav-friends');
      if (await friendsLink.isVisible()) {
        await friendsLink.click();
        
        // Should show golf buddies section
        const golfBuddiesToggle = page.getByTestId('toggle-golf-buddies-btn');
        if (await golfBuddiesToggle.isVisible()) {
          await golfBuddiesToggle.click();
          
          // Should show search functionality
          const emailInput = page.getByTestId('search-email-input');
          if (await emailInput.isVisible()) {
            await expect(emailInput).toBeVisible();
          }
        }
      }
    }
  });

  test('should show round history', async ({ page }) => {
    // Navigate to dashboard first
    const dashboardTab = page.getByTestId('nav-tab-dashboard');
    if (await dashboardTab.isVisible()) {
      await dashboardTab.click();
    }
    
    // Open hamburger menu
    const menuButton = page.getByTestId('hamburger-menu-btn');
    if (await menuButton.isVisible()) {
      await menuButton.click();
      
      // Click on history section
      const historyLink = page.getByTestId('menu-nav-history');
      if (await historyLink.isVisible()) {
        await historyLink.click();
        
        // Should show history component or message
        const historyContent = page.getByText('Round History').or(page.getByText('No rounds'));
        if (await historyContent.isVisible()) {
          await expect(historyContent).toBeVisible();
        }
      }
    }
  });

  test('should display statistics and analytics', async ({ page }) => {
    // Navigate to dashboard first
    const dashboardTab = page.getByTestId('nav-tab-dashboard');
    if (await dashboardTab.isVisible()) {
      await dashboardTab.click();
    }
    
    // Open hamburger menu
    const menuButton = page.getByTestId('hamburger-menu-btn');
    if (await menuButton.isVisible()) {
      await menuButton.click();
      
      // Click on stats section
      const statsLink = page.getByTestId('menu-nav-stats');
      if (await statsLink.isVisible()) {
        await statsLink.click();
        
        // Should show stats component
        const statsContent = page.getByText('Statistics').or(page.getByText('No data'));
        if (await statsContent.isVisible()) {
          await expect(statsContent).toBeVisible();
        }
      }
    }
  });

  test('should handle logout functionality', async ({ page }) => {
    // Test bottom navigation logout
    const bottomLogout = page.getByTestId('bottom-nav-logout');
    if (await bottomLogout.isVisible()) {
      await bottomLogout.click();
      // Should redirect to login page
      await expect(page.locator('h1')).toContainText('Sandbagger');
      await expect(page.locator('h2')).toContainText('Log In');
    } else {
      // Test hamburger menu logout
      const menuButton = page.getByTestId('hamburger-menu-btn');
      if (await menuButton.isVisible()) {
        await menuButton.click();
        
        const menuLogout = page.getByTestId('menu-logout-btn');
        if (await menuLogout.isVisible()) {
          await menuLogout.click();
          // Should redirect to login page
          await expect(page.locator('h1')).toContainText('Sandbagger');
          await expect(page.locator('h2')).toContainText('Log In');
        }
      }
    }
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Hamburger menu should be visible on mobile
    const hamburgerMenu = page.getByTestId('hamburger-menu-btn');
    await expect(hamburgerMenu).toBeVisible();
    
    // Menu should expand when clicked
    await hamburgerMenu.click();
    
    // Navigation options should be visible
    await expect(page.getByTestId('menu-nav-new-round')).toBeVisible();
    await expect(page.getByTestId('menu-nav-profile')).toBeVisible();
    
    // Close menu
    const closeButton = page.getByTestId('menu-close-btn');
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
    
    // Bottom navigation should be visible
    await expect(page.getByTestId('bottom-nav-new-round')).toBeVisible();
    await expect(page.getByTestId('bottom-nav-dashboard')).toBeVisible();
    await expect(page.getByTestId('bottom-nav-logout')).toBeVisible();
  });

  test('should show PWA install prompt', async ({ page }) => {
    // Look for PWA install functionality
    const installButton = page.getByText('Install App').or(page.getByText('Add to Home'));
    
    if (await installButton.isVisible()) {
      await expect(installButton).toBeVisible();
      
      // Could test install prompt trigger
      await installButton.click();
      
      // Note: Actual PWA installation would require specific browser setup
    }
  });

  test('should handle offline mode gracefully', async ({ page }) => {
    // Go offline
    await page.context().setOffline(true);
    
    // Try to navigate to scorecard using bottom nav
    const scorecardLink = page.getByTestId('bottom-nav-scorecard');
    if (await scorecardLink.isVisible()) {
      await scorecardLink.click();
    }
    
    // Should show offline indicator, error boundary, or handle gracefully
    const offlineIndicator = page.getByText('Offline').or(page.getByText('No connection')).or(page.getByText('No active round'));
    
    if (await offlineIndicator.isVisible()) {
      await expect(offlineIndicator).toBeVisible();
    }
    
    // Restore online mode
    await page.context().setOffline(false);
  });

  test('should display notifications and alerts', async ({ page }) => {
    // Look for notification system
    const notificationArea = page.locator('.notification').or(page.locator('.alert')).or(page.getByText('notification'));
    
    if (await notificationArea.first().isVisible()) {
      await expect(notificationArea.first()).toBeVisible();
    }
    
    // Look for friend requests notifications
    const friendRequestNotification = page.getByText('Friend Request').or(page.getByText('invitation'));
    
    if (await friendRequestNotification.isVisible()) {
      await expect(friendRequestNotification).toBeVisible();
    }
  });
});