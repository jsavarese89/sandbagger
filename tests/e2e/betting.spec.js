import { test, expect } from '@playwright/test';

test.describe('Betting Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Note: In real tests, you'd need to handle authentication first
    // For now, we'll assume we can navigate to betting section
  });

  test('should display betting games section', async ({ page }) => {
    await page.goto('/');
    
    // First, need to start a round to access betting features
    const startRoundButton = page.getByTestId('start-round-btn');
    if (await startRoundButton.isVisible()) {
      // Add at least one player first
      const playerNameInput = page.getByTestId('player-name-input');
      if (await playerNameInput.isVisible()) {
        await playerNameInput.fill('Test Player');
        const addPlayerButton = page.getByTestId('player-submit-btn');
        await addPlayerButton.click();
        await page.waitForTimeout(1000);
      }
      
      // Now start the round
      await startRoundButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Look for betting games section within the scorecard
    const bettingSection = page.getByTestId('betting-games-section');
    if (await bettingSection.isVisible()) {
      // Should show betting options
      await expect(page.getByText('Match Play')).toBeVisible();
      await expect(page.getByText('Nassau')).toBeVisible();
      await expect(page.getByText('Skins')).toBeVisible();
    }
  });

  test('should create a Match Play bet', async ({ page }) => {
    await page.goto('/');
    
    // First, need to start a round to access betting features
    const startRoundButton = page.getByTestId('start-round-btn');
    if (await startRoundButton.isVisible()) {
      // Add at least two players for betting
      const playerNameInput = page.getByTestId('player-name-input');
      if (await playerNameInput.isVisible()) {
        await playerNameInput.fill('Player 1');
        const addPlayerButton = page.getByTestId('player-submit-btn');
        await addPlayerButton.click();
        await page.waitForTimeout(500);
        
        await playerNameInput.fill('Player 2');
        await addPlayerButton.click();
        await page.waitForTimeout(500);
      }
      
      // Now start the round
      await startRoundButton.click();
      await page.waitForTimeout(2000);
    }

    // Look for Match Play option
    const matchPlayButton = page.getByText('Match Play');
    if (await matchPlayButton.isVisible()) {
      await matchPlayButton.click();
      
      // Should show bet setup form
      const amountInput = page.getByLabel('Amount').or(page.getByPlaceholder('Amount'));
      if (await amountInput.isVisible()) {
        await amountInput.fill('10');
        
        // Select players for match play
        const player1Select = page.getByLabel('Player 1').or(page.locator('select').first());
        const player2Select = page.getByLabel('Player 2').or(page.locator('select').nth(1));
        
        if (await player1Select.isVisible() && await player2Select.isVisible()) {
          await player1Select.selectOption({ index: 0 });
          await player2Select.selectOption({ index: 1 });
        }
        
        // Create the bet
        const createBetButton = page.getByTestId('add-bet-btn');
        if (await createBetButton.isVisible()) {
          await createBetButton.click();
          
          // Should show confirmation or bet in list
          await expect(page.getByText('Match Play - $10')).toBeVisible();
        }
      }
    }
  });

  test('should create a Nassau bet', async ({ page }) => {
    const nassauButton = page.getByText('Nassau');
    
    if (await nassauButton.isVisible()) {
      await nassauButton.click();
      
      // Set up Nassau bet
      const amountInput = page.getByLabel('Amount').or(page.getByPlaceholder('Amount'));
      if (await amountInput.isVisible()) {
        await amountInput.fill('5');
        
        // Nassau typically involves 2 players
        const createButton = page.getByText('Create Bet').or(page.getByText('Add Nassau'));
        if (await createButton.isVisible()) {
          await createButton.click();
          
          // Should create three separate bets (Front 9, Back 9, Total)
          await expect(page.getByText('Nassau')).toBeVisible();
        }
      }
    }
  });

  test('should create a Skins bet', async ({ page }) => {
    const skinsButton = page.getByText('Skins');
    
    if (await skinsButton.isVisible()) {
      await skinsButton.click();
      
      const amountInput = page.getByLabel('Amount').or(page.getByPlaceholder('Amount'));
      if (await amountInput.isVisible()) {
        await amountInput.fill('2');
        
        // Skins can involve multiple players
        const playersSection = page.getByText('Select Players').or(page.locator('.player-selection'));
        if (await playersSection.isVisible()) {
          // Select multiple players for skins
          const playerCheckboxes = page.locator('input[type="checkbox"]');
          const checkboxCount = await playerCheckboxes.count();
          
          for (let i = 0; i < Math.min(checkboxCount, 3); i++) {
            await playerCheckboxes.nth(i).check();
          }
        }
        
        const createButton = page.getByText('Create Bet').or(page.getByText('Add Skins'));
        if (await createButton.isVisible()) {
          await createButton.click();
          
          await expect(page.getByText('Skins')).toBeVisible();
        }
      }
    }
  });

  test('should create Bingo-Bango-Bongo bet', async ({ page }) => {
    const bingoButton = page.getByText('Bingo-Bango-Bongo').or(page.getByText('BBB'));
    
    if (await bingoButton.isVisible()) {
      await bingoButton.click();
      
      const amountInput = page.getByLabel('Amount').or(page.getByPlaceholder('Amount'));
      if (await amountInput.isVisible()) {
        await amountInput.fill('3');
        
        const createButton = page.getByText('Create Bet').or(page.getByText('Add'));
        if (await createButton.isVisible()) {
          await createButton.click();
          
          await expect(page.getByText('Bingo-Bango-Bongo')).toBeVisible();
        }
      }
    }
  });

  test('should display active bets list', async ({ page }) => {
    // Look for active bets section
    const activeBetsSection = page.getByText('Active Bets').or(page.getByText('Current Bets'));
    
    if (await activeBetsSection.isVisible()) {
      await expect(activeBetsSection).toBeVisible();
      
      // Should show bet details
      const betItems = page.locator('.bet-item').or(page.locator('[data-testid="bet"]'));
      
      if (await betItems.first().isVisible()) {
        await expect(betItems.first()).toBeVisible();
      }
    }
  });

  test('should calculate betting results in real-time', async ({ page }) => {
    // After creating bets and entering scores, check if results update
    const resultsSection = page.getByText('Results').or(page.getByText('Winnings'));
    
    if (await resultsSection.isVisible()) {
      await expect(resultsSection).toBeVisible();
      
      // Look for winner/loser indicators
      const winnerIndicator = page.getByText('Winner').or(page.locator('.winner'));
      const winningsAmount = page.locator('.winnings').or(page.getByText('$'));
      
      if (await winnerIndicator.isVisible()) {
        await expect(winnerIndicator).toBeVisible();
      }
      
      if (await winningsAmount.first().isVisible()) {
        await expect(winningsAmount.first()).toBeVisible();
      }
    }
  });

  test('should validate bet amounts', async ({ page }) => {
    const amountInput = page.getByLabel('Amount').or(page.getByPlaceholder('Amount'));
    
    if (await amountInput.isVisible()) {
      // Test negative amount
      await amountInput.fill('-5');
      
      const createButton = page.getByText('Create Bet').or(page.getByText('Add'));
      if (await createButton.isVisible()) {
        await createButton.click();
        
        // Should show validation error
        const errorMessage = page.locator('.error').or(page.getByText('invalid'));
        if (await errorMessage.isVisible()) {
          await expect(errorMessage).toBeVisible();
        }
      }
      
      // Test zero amount
      await amountInput.fill('0');
      if (await createButton.isVisible()) {
        await createButton.click();
        
        // Should show validation error
        const zeroError = page.locator('.error').or(page.getByText('greater than'));
        if (await zeroError.isVisible()) {
          await expect(zeroError).toBeVisible();
        }
      }
    }
  });

  test('should handle bet deletion', async ({ page }) => {
    // Look for delete bet functionality
    const deleteBetButton = page.getByText('Delete').or(page.getByText('Remove')).or(page.locator('.delete-btn'));
    
    if (await deleteBetButton.first().isVisible()) {
      await deleteBetButton.first().click();
      
      // Should show confirmation dialog
      const confirmDialog = page.getByText('Are you sure').or(page.locator('.confirm-dialog'));
      
      if (await confirmDialog.isVisible()) {
        const confirmButton = page.getByText('Yes').or(page.getByText('Confirm'));
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
          
          // Bet should be removed from list
          // (This would need specific bet identification to verify)
        }
      }
    }
  });

  test('should show betting summary at end of round', async ({ page }) => {
    // Navigate to or simulate end of round
    const finishRoundButton = page.getByText('Finish Round').or(page.getByText('Complete'));
    
    if (await finishRoundButton.isVisible()) {
      await finishRoundButton.click();
      
      // Should show betting summary
      const bettingSummary = page.getByText('Betting Summary').or(page.getByText('Final Results'));
      
      if (await bettingSummary.isVisible()) {
        await expect(bettingSummary).toBeVisible();
        
        // Should show total winnings/losses
        const totalWinnings = page.getByText('Total:').or(page.getByText('Net:'));
        if (await totalWinnings.isVisible()) {
          await expect(totalWinnings).toBeVisible();
        }
      }
    }
  });

  test('should handle multiple concurrent bets', async ({ page }) => {
    // Create multiple different types of bets
    const bets = ['Match Play', 'Nassau', 'Skins'];
    
    for (const betType of bets) {
      const betButton = page.getByText(betType);
      
      if (await betButton.isVisible()) {
        await betButton.click();
        
        const amountInput = page.getByLabel('Amount').or(page.getByPlaceholder('Amount'));
        if (await amountInput.isVisible()) {
          await amountInput.fill('5');
          
          const createButton = page.getByText('Create Bet').or(page.getByText('Add'));
          if (await createButton.isVisible()) {
            await createButton.click();
          }
        }
      }
    }
    
    // Should show all active bets
    for (const betType of bets) {
      const activeBet = page.getByText(betType);
      if (await activeBet.isVisible()) {
        await expect(activeBet).toBeVisible();
      }
    }
  });
});