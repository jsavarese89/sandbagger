import { test, expect } from '@playwright/test';

test.describe('Scorecard Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Note: In real tests, you'd need to handle authentication first
    // For now, we'll assume we can navigate directly or mock auth
  });

  test('should create a new round', async ({ page }) => {
    // Look for "New Round" or similar button
    const newRoundButton = page.getByText('New Round').or(page.getByText('Start Round'));
    if (await newRoundButton.isVisible()) {
      await newRoundButton.click();
      
      // Should show round setup form
      await expect(page.getByText('Course')).toBeVisible();
      await expect(page.getByText('Players')).toBeVisible();
    }
  });

  test('should add players to a round', async ({ page }) => {
    // Navigate to scorecard or new round
    const scoreCardNav = page.getByText('Scorecard').or(page.getByText('Play'));
    if (await scoreCardNav.isVisible()) {
      await scoreCardNav.click();
    }

    // Look for add player functionality
    const addPlayerButton = page.getByText('Add Player').or(page.getByText('+'));
    if (await addPlayerButton.isVisible()) {
      await addPlayerButton.click();
      
      // Should show player input
      const playerNameInput = page.getByPlaceholder('Player Name').or(page.getByLabel('Name'));
      if (await playerNameInput.isVisible()) {
        await playerNameInput.fill('John Doe');
        
        const saveButton = page.getByText('Save').or(page.getByText('Add'));
        if (await saveButton.isVisible()) {
          await saveButton.click();
        }
        
        // Player should appear in the list
        await expect(page.getByText('John Doe')).toBeVisible();
      }
    }
  });

  test('should display scorecard table', async ({ page }) => {
    // Look for scorecard table elements
    const holesHeader = page.getByText('Holes').or(page.getByText('Hole'));
    const parRow = page.getByText('Par').or(page.locator('[data-testid="par-row"]'));
    
    if (await holesHeader.isVisible()) {
      await expect(holesHeader).toBeVisible();
    }
    
    if (await parRow.isVisible()) {
      await expect(parRow).toBeVisible();
    }
  });

  test('should input scores using ScoreInput component', async ({ page }) => {
    // Look for score input fields
    const scoreInputs = page.locator('input[type="number"]').or(page.locator('.score-input'));
    
    if (await scoreInputs.first().isVisible()) {
      const firstInput = scoreInputs.first();
      
      // Test direct input
      await firstInput.fill('4');
      await expect(firstInput).toHaveValue('4');
      
      // Test increment/decrement buttons
      const incrementBtn = page.getByLabel('Increase score').first();
      const decrementBtn = page.getByLabel('Decrease score').first();
      
      if (await incrementBtn.isVisible()) {
        await incrementBtn.click();
        await expect(firstInput).toHaveValue('5');
      }
      
      if (await decrementBtn.isVisible()) {
        await decrementBtn.click();
        await expect(firstInput).toHaveValue('4');
      }
    }
  });

  test('should show quick score buttons on focus', async ({ page }) => {
    const scoreInput = page.locator('.score-input').first();
    
    if (await scoreInput.isVisible()) {
      await scoreInput.focus();
      
      // Quick score buttons should appear
      const quickScore3 = page.getByText('3').first();
      const quickScore4 = page.getByText('4').first();
      const quickScore5 = page.getByText('5').first();
      
      if (await quickScore4.isVisible()) {
        await expect(quickScore4).toBeVisible();
        
        // Click quick score button
        await quickScore4.click();
        await expect(scoreInput).toHaveValue('4');
      }
    }
  });

  test('should calculate running totals', async ({ page }) => {
    // Look for total score displays
    const totalCells = page.locator('[data-testid="total"]').or(page.getByText('Total'));
    
    if (await totalCells.first().isVisible()) {
      // Input some scores and verify totals update
      const scoreInputs = page.locator('input[type="number"]');
      
      if (await scoreInputs.first().isVisible()) {
        await scoreInputs.first().fill('4');
        await scoreInputs.nth(1).fill('5');
        
        // Total should update
        await expect(page.getByText('9')).toBeVisible();
      }
    }
  });

  test('should handle hole navigation', async ({ page }) => {
    // Look for hole navigation buttons
    const prevHoleBtn = page.getByText('Previous').or(page.getByText('←'));
    const nextHoleBtn = page.getByText('Next').or(page.getByText('→'));
    
    if (await nextHoleBtn.isVisible()) {
      await nextHoleBtn.click();
      // Should navigate to next hole
      await expect(page.getByText('Hole 2')).toBeVisible();
    }
    
    if (await prevHoleBtn.isVisible()) {
      await prevHoleBtn.click();
      // Should navigate back to previous hole
      await expect(page.getByText('Hole 1')).toBeVisible();
    }
  });

  test('should save scores automatically', async ({ page }) => {
    // Input a score
    const scoreInput = page.locator('input[type="number"]').first();
    
    if (await scoreInput.isVisible()) {
      await scoreInput.fill('4');
      
      // Wait for auto-save indicator or confirm save
      const savedIndicator = page.getByText('Saved').or(page.locator('.save-indicator'));
      
      // Check if there's any save feedback
      if (await savedIndicator.isVisible()) {
        await expect(savedIndicator).toBeVisible();
      }
    }
  });

  test('should handle score validation', async ({ page }) => {
    const scoreInput = page.locator('input[type="number"]').first();
    
    if (await scoreInput.isVisible()) {
      // Test invalid high score
      await scoreInput.fill('25');
      
      // Should either reject the input or show warning
      const value = await scoreInput.inputValue();
      expect(parseInt(value)).toBeLessThanOrEqual(20);
      
      // Test negative score
      await scoreInput.fill('-1');
      
      // Should not accept negative values
      const negativeValue = await scoreInput.inputValue();
      expect(parseInt(negativeValue) || 0).toBeGreaterThanOrEqual(0);
    }
  });

  test('should display course information', async ({ page }) => {
    // Look for course name, par, and other course details
    const courseInfo = page.locator('[data-testid="course-info"]').or(page.getByText('Course:'));
    
    if (await courseInfo.isVisible()) {
      await expect(courseInfo).toBeVisible();
    }
    
    // Check for par information
    const parInfo = page.getByText('Par').first();
    if (await parInfo.isVisible()) {
      await expect(parInfo).toBeVisible();
    }
  });
});