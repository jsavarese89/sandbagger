import React, { useState } from 'react';

import { addBet as addBetToFirebase } from '../firebase';

function BetTracker({ players, bets, addBet, scores, roundId }) {
  const [betType, setBetType] = useState('match');
  const [amount, setAmount] = useState(5);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);

  const betTypes = [
    { id: 'match', name: 'Match Play' },
    { id: 'nassau', name: 'Nassau' },
    { id: 'skins', name: 'Skins' },
    { id: 'bingo-bango-bongo', name: 'Bingo-Bango-Bongo' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (participants.length < 2) return;

    const newBet = {
      type: betType,
      amount,
      participants,
      timestamp: new Date().toISOString(),
    };

    // Add to local state
    addBet(newBet);

    // Reset form
    setParticipants([]);

    // Sync with Firebase if roundId is provided
    if (roundId) {
      try {
        setLoading(true);
        await addBetToFirebase(roundId, newBet);
      } catch (error) {
        console.error('Error adding bet:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleParticipant = (playerName) => {
    setParticipants(prev => {
      if (prev.includes(playerName)) {
        return prev.filter(p => p !== playerName);
      } else {
        return [...prev, playerName];
      }
    });
  };

  // Calculate results for different bet types
  const calculateBetResults = (bet) => {
    const results = {};
    const playerNetScores = {};

    // Check for both possible player key names (participants or players)
    const playerList = bet.participants || bet.players || [];

    if (!Array.isArray(playerList)) {
      console.error('Invalid player list in bet:', bet);
      return {};
    }

    // Calculate net scores first for all players
    playerList.forEach(playerName => {
      const player = players.find(p => p.name === playerName);
      if (!player || !scores[playerName]) return;

      const grossScore = scores[playerName].reduce((sum, score) => sum + (score || 0), 0);
      const netScore = grossScore - (player.handicap || 0);

      playerNetScores[playerName] = {
        gross: grossScore,
        net: netScore,
        handicap: player.handicap || 0,
        scores: [...scores[playerName]],
      };
    });

    // Different calculation based on bet type
    switch (bet.type) {
      case 'match':
        return calculateMatchPlay(bet, playerNetScores);
      case 'nassau':
        return calculateNassau(bet, playerNetScores);
      case 'skins':
        return calculateSkins(bet, playerNetScores);
      case 'bingo-bango-bongo':
        return calculateBingoBangoBongo(bet, playerNetScores);
      default:
        return playerNetScores;
    }
  };

  // Match Play scoring - player vs player per hole with handicap adjustment
  const calculateMatchPlay = (bet, playerNetScores) => {
    // Need at least 2 players for match play
    if (Object.keys(playerNetScores).length < 2) return playerNetScores;

    const results = {};
    const players = Object.keys(playerNetScores);

    // Set up initial results structure with wins and status
    players.forEach(player => {
      results[player] = {
        ...playerNetScores[player],
        wins: 0,
        status: 'Even',
      };
    });

    // For simplicity, just compare the first two players
    const player1 = players[0];
    const player2 = players[1];

    // If either player is missing, return early
    if (!player1 || !player2) return results;

    // Make sure both players have scores
    if (!playerNetScores[player1]?.scores || !playerNetScores[player2]?.scores) {
      return results;
    }

    // Track overall match status
    let player1Wins = 0;
    let player2Wins = 0;

    // Calculate hole-by-hole results
    for (let hole = 0; hole < 18; hole++) {
      const score1 = playerNetScores[player1].scores[hole] || 0;
      const score2 = playerNetScores[player2].scores[hole] || 0;

      // Skip holes that haven't been played
      if (score1 === 0 || score2 === 0) continue;

      // Apply handicap strokes if needed
      const holeHandicap = hole + 1; // Simplified for example
      const adjustedScore1 = score1 - (playerNetScores[player1].handicap >= holeHandicap ? 1 : 0);
      const adjustedScore2 = score2 - (playerNetScores[player2].handicap >= holeHandicap ? 1 : 0);

      if (adjustedScore1 < adjustedScore2) {
        player1Wins++;
      } else if (adjustedScore2 < adjustedScore1) {
        player2Wins++;
      }
    }

    // Calculate match status
    const matchDiff = player1Wins - player2Wins;
    const holesRemaining = 18 - (playerNetScores[player1].scores.filter(s => s > 0).length);

    results[player1].wins = player1Wins;
    results[player2].wins = player2Wins;

    // Determine match status
    if (matchDiff > 0) {
      results[player1].status = `${matchDiff} UP`;
      results[player2].status = `${Math.abs(matchDiff)} DOWN`;

      if (matchDiff > holesRemaining) {
        results[player1].status = `WIN ${matchDiff} & ${holesRemaining}`;
        results[player2].status = 'LOSS';
      }
    } else if (matchDiff < 0) {
      results[player1].status = `${Math.abs(matchDiff)} DOWN`;
      results[player2].status = `${Math.abs(matchDiff)} UP`;

      if (Math.abs(matchDiff) > holesRemaining) {
        results[player1].status = 'LOSS';
        results[player2].status = `WIN ${Math.abs(matchDiff)} & ${holesRemaining}`;
      }
    } else {
      results[player1].status = 'AS';
      results[player2].status = 'AS';
    }

    return results;
  };

  // Nassau betting - front 9, back 9, and total 18
  const calculateNassau = (bet, playerNetScores) => {
    const results = {};
    const players = Object.keys(playerNetScores);

    players.forEach(player => {
      const front9 = playerNetScores[player].scores.slice(0, 9).reduce((sum, s) => sum + (s || 0), 0);
      const back9 = playerNetScores[player].scores.slice(9, 18).reduce((sum, s) => sum + (s || 0), 0);
      const total = front9 + back9;

      results[player] = {
        ...playerNetScores[player],
        front9,
        back9,
        total,
        winnings: 0,
      };
    });

    // For simplicity, compare the first two players
    if (players.length >= 2) {
      const player1 = players[0];
      const player2 = players[1];

      // Front 9
      if (results[player1].front9 < results[player2].front9 && results[player1].front9 > 0 && results[player2].front9 > 0) {
        results[player1].winnings += bet.amount;
        results[player2].winnings -= bet.amount;
      } else if (results[player2].front9 < results[player1].front9 && results[player1].front9 > 0 && results[player2].front9 > 0) {
        results[player2].winnings += bet.amount;
        results[player1].winnings -= bet.amount;
      }

      // Back 9
      if (results[player1].back9 < results[player2].back9 && results[player1].back9 > 0 && results[player2].back9 > 0) {
        results[player1].winnings += bet.amount;
        results[player2].winnings -= bet.amount;
      } else if (results[player2].back9 < results[player1].back9 && results[player1].back9 > 0 && results[player2].back9 > 0) {
        results[player2].winnings += bet.amount;
        results[player1].winnings -= bet.amount;
      }

      // Total
      if (results[player1].total < results[player2].total && results[player1].total > 0 && results[player2].total > 0) {
        results[player1].winnings += bet.amount;
        results[player2].winnings -= bet.amount;
      } else if (results[player2].total < results[player1].total && results[player1].total > 0 && results[player2].total > 0) {
        results[player2].winnings += bet.amount;
        results[player1].winnings -= bet.amount;
      }
    }

    return results;
  };

  // Skins game - lowest score on a hole wins that skin
  const calculateSkins = (bet, playerNetScores) => {
    const results = {};
    const players = Object.keys(playerNetScores);

    // Initialize results with skins count
    players.forEach(player => {
      results[player] = {
        ...playerNetScores[player],
        skins: 0,
        value: 0,
      };
    });

    // Calculate skins for each hole
    for (let hole = 0; hole < 18; hole++) {
      // Skip holes that haven't been played by all players
      const allPlayed = players.every(player => (playerNetScores[player].scores[hole] || 0) > 0);
      if (!allPlayed) continue;

      // Find the best score for this hole
      let bestScore = Infinity;
      let bestPlayers = [];

      players.forEach(player => {
        const score = playerNetScores[player].scores[hole] || 0;
        // Apply handicap adjustment
        const adjustedScore = score - (playerNetScores[player].handicap >= (hole + 1) ? 1 : 0);

        if (adjustedScore < bestScore) {
          bestScore = adjustedScore;
          bestPlayers = [player];
        } else if (adjustedScore === bestScore) {
          bestPlayers.push(player);
        }
      });

      // Award skin if there's a single winner
      if (bestPlayers.length === 1) {
        results[bestPlayers[0]].skins++;
      }
    }

    // Calculate skin value
    const totalSkins = players.reduce((sum, player) => sum + results[player].skins, 0);
    if (totalSkins > 0) {
      const skinValue = bet.amount * players.length / totalSkins;

      players.forEach(player => {
        results[player].value = results[player].skins * skinValue;
      });
    }

    return results;
  };

  // Bingo-Bango-Bongo points system
  const calculateBingoBangoBongo = (bet, playerNetScores) => {
    // This is a simplified implementation
    // In a real system, you'd need to track who hit the green first, etc.
    const results = {};
    const players = Object.keys(playerNetScores);

    players.forEach(player => {
      results[player] = {
        ...playerNetScores[player],
        points: 0,
        value: 0,
      };

      // For simplicity, award points based on gross scores
      const playerScores = playerNetScores[player].scores;
      for (let hole = 0; hole < 18; hole++) {
        const score = playerScores[hole] || 0;
        if (score === 0) continue;

        // Award random points as a placeholder
        // In a real app, you'd have a proper tracking system
        if (score <= 3) results[player].points += 1; // Simulating points
      }
    });

    // Calculate point value
    const totalPoints = players.reduce((sum, player) => sum + results[player].points, 0);
    if (totalPoints > 0) {
      const pointValue = bet.amount * players.length / totalPoints;

      players.forEach(player => {
        results[player].value = results[player].points * pointValue;
      });
    }

    return results;
  };

  return (
    <div className="info-card">
      <h3 className="info-card-header">Bet Tracker</h3>

      <form onSubmit={handleSubmit} className="bet-form">
        <div className="form-group">
          <label>Bet Type</label>
          <select
            value={betType}
            onChange={(e) => setBetType(e.target.value)}
          >
            {betTypes.map(type => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Amount ($)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            min="1"
          />
        </div>

        <div className="form-group">
          <label>Participants</label>
          <div className="checkbox-group">
            {players.map(player => (
              <label key={player.name} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={participants.includes(player.name)}
                  onChange={() => toggleParticipant(player.name)}
                  className="checkbox"
                />
                {player.name}
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="btn"
          disabled={participants.length < 2 || loading}
        >
          {loading ? 'Adding...' : 'Add Bet'}
        </button>
      </form>

      {bets.length > 0 && (
        <div>
          <h4 className="active-bets-header">Active Bets</h4>
          <div className="space-y-3">
            {bets.map((bet, index) => {
              const betResults = calculateBetResults(bet);

              return (
                <div key={index} className="bet-item">
                  <div className="bet-header">
                    <span className="bet-type">
                      {betTypes.find(t => t.id === bet.type)?.name}
                    </span>
                    <span>${bet.amount}</span>
                  </div>
                  <div className="bet-participants">
                    {bet.participants.join(', ')}
                  </div>

                  {Object.keys(betResults).length > 0 && (
                    <div className="bet-results">
                      {Object.entries(betResults).map(([playerName, result]) => {
                        // Different display based on bet type
                        let resultDisplay;

                        switch (bet.type) {
                          case 'match':
                            resultDisplay = (
                              <div className="player-result">
                                <div className="player-name">{playerName}</div>
                                <div
                                  className="bet-status"
                                  style={{
                                    color: result.status.includes('WIN') ? 'green' :
                                      result.status.includes('LOSS') ? 'red' : 'inherit',
                                  }}
                                >
                                  {result.status}
                                </div>
                              </div>
                            );
                            break;

                          case 'nassau':
                            resultDisplay = (
                              <div className="player-result">
                                <div className="player-name">{playerName}</div>
                                <div className="bet-details">
                                  <div>F9: {result.front9}</div>
                                  <div>B9: {result.back9}</div>
                                  <div className="bet-total">
                                    Total: {result.total}
                                  </div>
                                </div>
                                <div
                                  className="bet-winnings"
                                  style={{
                                    color: result.winnings > 0 ? 'green' :
                                      result.winnings < 0 ? 'red' : 'inherit',
                                  }}
                                >
                                  {result.winnings > 0 ? '+' : ''}{result.winnings !== 0 ? `$${Math.abs(result.winnings)}` : 'Even'}
                                </div>
                              </div>
                            );
                            break;

                          case 'skins':
                            resultDisplay = (
                              <div className="player-result">
                                <div className="player-name">{playerName}</div>
                                <div className="bet-skins">
                                  Skins: {result.skins}
                                </div>
                                <div
                                  className="bet-value"
                                  style={{
                                    color: result.value > 0 ? 'green' : 'inherit',
                                  }}
                                >
                                  {result.value > 0 ? `$${result.value.toFixed(2)}` : '—'}
                                </div>
                              </div>
                            );
                            break;

                          case 'bingo-bango-bongo':
                            resultDisplay = (
                              <div className="player-result">
                                <div className="player-name">{playerName}</div>
                                <div className="bet-points">
                                  Points: {result.points}
                                </div>
                                <div
                                  className="bet-value"
                                  style={{
                                    color: result.value > 0 ? 'green' : 'inherit',
                                  }}
                                >
                                  {result.value > 0 ? `$${result.value.toFixed(2)}` : '—'}
                                </div>
                              </div>
                            );
                            break;

                          default:
                            // Default fallback display for unknown bet types
                            resultDisplay = (
                              <div className="player-result">
                                <span>{playerName}</span>
                                <span>Gross: {result.gross}</span>
                                <span>Net: {result.net}</span>
                              </div>
                            );
                        }

                        return (
                          <div key={playerName} className="player-bet-result">
                            {resultDisplay}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default BetTracker;
