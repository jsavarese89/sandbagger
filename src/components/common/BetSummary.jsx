import React, { memo } from 'react';

import { useBettingCalculations } from '../../hooks/useBettingCalculations';

const betTypes = [
  { id: 'match', name: 'Match Play' },
  { id: 'nassau', name: 'Nassau' },
  { id: 'skins', name: 'Skins' },
  { id: 'bingo-bango-bongo', name: 'Bingo-Bango-Bongo' },
];

const BetSummary = memo(({ bets, scores, players, course }) => {
  const { calculateBetWinningsTotal } = useBettingCalculations(scores, players, course);

  if (bets.length === 0) {
    return (
      <div className="bet-summary-container">
        <h3 className="info-card-header">Bet Summary</h3>
        <div className="bet-summary">
          <p className="no-bets-message">No active bets. Add a bet below.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bet-summary-container">
      <h3 className="info-card-header">Bet Summary</h3>
      <div className="bet-summary">
        <div className="bet-summary-cards">
          {bets.map((bet, index) => {
            // Safety check for bet structure
            if (!bet || !bet.participants || !Array.isArray(bet.participants)) {
              console.error('Invalid bet structure:', bet);
              return null;
            }

            try {
              const betResults = calculateBetWinningsTotal(bet);
              return (
                <div key={index} className="bet-summary-card">
                  <div className="bet-summary-header">
                    <span className="bet-type-pill">
                      {betTypes.find(t => t.id === bet.type)?.name || 'Unknown'}
                    </span>
                    <span className="bet-amount-pill">${bet.amount || 0}</span>
                  </div>
                  {Object.entries(betResults).map(([player, amount]) => (
                    <div key={player} className="bet-summary-player">
                      <span>{player}</span>
                      <span
                        className={`bet-summary-amount ${
                          amount > 0 ? 'positive' : amount < 0 ? 'negative' : ''
                        }`}
                      >
                        {amount > 0 ? '+' : ''}{amount !== 0 ? `$${Math.abs(amount)}` : '--'}
                      </span>
                    </div>
                  ))}
                </div>
              );
            } catch (error) {
              console.error('Error calculating bet results:', error, bet);
              return null;
            }
          }).filter(Boolean)}
        </div>
      </div>
    </div>
  );
});

BetSummary.displayName = 'BetSummary';

export default BetSummary;
