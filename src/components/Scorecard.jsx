import React, { useState, useEffect } from 'react';

import { subscribeToRound, updateScore, addBet as updateBet } from '../firebase';

import BettingGames from './BettingGames';
import BetTracker from './BetTracker';
import CourseSelector from './CourseSelector';
import HoleInfo from './HoleInfo';
import ScoreInput from './ScoreInput';
import ShareRound from './ShareRound';


const defaultCourse = {
  name: 'Sample Golf Course',
  par: [4, 5, 3, 4, 4, 5, 3, 4, 4, 4, 5, 3, 4, 4, 5, 3, 4, 4],
  handicap: [7, 1, 15, 5, 11, 3, 17, 13, 9, 8, 2, 16, 6, 12, 4, 18, 14, 10],
};

const betTypes = [
  { id: 'match', name: 'Match Play' },
  { id: 'nassau', name: 'Nassau' },
  { id: 'skins', name: 'Skins' },
  { id: 'bingo-bango-bongo', name: 'Bingo-Bango-Bongo' },
];

function Scorecard({ players, roundId, course = defaultCourse, isConnected }) {
  const [scores, setScores] = useState({});
  const [bets, setBets] = useState([]);
  const [currentView, setCurrentView] = useState('front-9');
  const [viewIndex, setViewIndex] = useState(0);
  const viewSequence = ['front-9', 'back-9', 'total-view'];
  const [loading, setLoading] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Initialize scores object
  useEffect(() => {
    const initialScores = {};
    players.forEach(player => {
      initialScores[player.name] = Array(18).fill(0);
    });
    setScores(initialScores);
  }, [players]);

  // Subscribe to real-time updates if roundId is provided
  useEffect(() => {
    if (roundId) {
      const unsubscribe = subscribeToRound(roundId, (roundData) => {
        if (roundData.scores) {
          setScores(roundData.scores);
        }
        if (roundData.bets) {
          setBets(roundData.bets);
        }
      });

      return () => unsubscribe();
    }
  }, [roundId]);

  const updateScoreWithSync = async (playerName, holeIndex, score) => {
    // Update local state immediately for responsiveness
    setScores(prev => {
      const newScores = { ...prev };
      if (!newScores[playerName]) {
        newScores[playerName] = Array(18).fill(0);
      }
      newScores[playerName][holeIndex] = parseInt(score) || 0;
      return newScores;
    });

    // Sync with Firebase if roundId is provided
    if (roundId) {
      try {
        setLoading(true);
        await updateScore(roundId, playerName, holeIndex, score);
      } catch (error) {
        console.error('Error updating score:', error);
        // Could add toast notification here for error
      } finally {
        setLoading(false);
      }
    }
  };

  const addBet = (bet) => {
    // Check if this is a new bet by comparing with existing bets
    const isDuplicateBet = bets.some(existingBet =>
      existingBet.type === bet.type &&
      existingBet.amount === bet.amount &&
      JSON.stringify(existingBet.players || existingBet.participants || []).sort() ===
      JSON.stringify(bet.players || bet.participants || []).sort(),
    );

    if (!isDuplicateBet) {
      setBets(prev => [...prev, bet]);
    } else {
      console.log('Skipping duplicate bet', bet);
    }
  };

  const calculateGrossScore = (playerName, start = 0, end = 18) => {
    if (!scores[playerName]) return 0;
    return scores[playerName].slice(start, end).reduce((sum, score) => sum + score, 0);
  };

  const calculateNetScore = (playerName) => {
    const player = players.find(p => p.name === playerName);
    if (!player) return 0;

    const grossScore = calculateGrossScore(playerName);
    return grossScore - player.handicap;
  };

  const getStrokesGiven = (playerName, holeIndex) => {
    const player = players.find(p => p.name === playerName);
    if (!player) return 0;

    const holeHandicap = course.handicap[holeIndex];
    return player.handicap >= holeHandicap ? 1 : 0;
  };

  // Calculate the total bet winnings for a player across different bet types
  const calculateBetWinningsTotal = (bet) => {
    if (!bet) {
      console.warn('Invalid bet data in calculateBetWinningsTotal: undefined bet');
      return {};
    }

    // Handle both naming conventions
    const playerList = bet.participants || bet.players;

    if (!playerList || !Array.isArray(playerList)) {
      console.warn('Invalid bet data in calculateBetWinningsTotal:', bet);
      return {};
    }

    const playerResults = {};

    // Make sure we have scores for each participant
    const hasScores = playerList.every(player =>
      scores[player] && scores[player].some(score => score > 0),
    );

    if (!hasScores) {
      // Return placeholder if no scores are entered yet
      playerList.forEach(player => {
        playerResults[player] = 0;
      });
      return playerResults;
    }

    // Calculate based on bet type
    switch (bet.type) {
      case 'match':
        return calculateMatchPlayWinnings(bet);
      case 'nassau':
        return calculateNassauWinnings(bet);
      case 'skins':
        return calculateSkinsWinnings(bet);
      case 'bingo-bango-bongo':
        return calculateBingoBangoBongoWinnings(bet);
      default:
        bet.participants.forEach(player => {
          playerResults[player] = 0;
        });
        return playerResults;
    }
  };

  // Calculate match play winnings
  const calculateMatchPlayWinnings = (bet) => {
    const results = {};

    // Handle both naming conventions
    const playerList = bet.participants || bet.players || [];

    // Need at least 2 players
    if (playerList.length < 2) {
      playerList.forEach(player => { results[player] = 0; });
      return results;
    }

    // For simplicity, just compare first two players
    const player1 = playerList[0];
    const player2 = playerList[1];

    // Initialize results
    results[player1] = 0;
    results[player2] = 0;

    // Count wins for each player
    let player1Wins = 0;
    let player2Wins = 0;
    let holesPlayed = 0;

    for (let hole = 0; hole < 18; hole++) {
      const score1 = scores[player1]?.[hole] || 0;
      const score2 = scores[player2]?.[hole] || 0;

      // Skip holes that haven't been played
      if (score1 === 0 || score2 === 0) continue;

      holesPlayed++;

      // Apply handicap
      const player1Handicap = players.find(p => p.name === player1)?.handicap || 0;
      const player2Handicap = players.find(p => p.name === player2)?.handicap || 0;

      const holeHandicap = hole + 1;
      const adjustedScore1 = score1 - (player1Handicap >= holeHandicap ? 1 : 0);
      const adjustedScore2 = score2 - (player2Handicap >= holeHandicap ? 1 : 0);

      if (adjustedScore1 < adjustedScore2) {
        player1Wins++;
      } else if (adjustedScore2 < adjustedScore1) {
        player2Wins++;
      }
    }

    // Only calculate winnings if enough holes have been played
    if (holesPlayed > 0) {
      const difference = player1Wins - player2Wins;
      const holesRemaining = 18 - holesPlayed;

      // If match is mathematically decided
      if (Math.abs(difference) > holesRemaining) {
        if (difference > 0) {
          results[player1] = bet.amount;
          results[player2] = -bet.amount;
        } else {
          results[player1] = -bet.amount;
          results[player2] = bet.amount;
        }
      } else if (holesPlayed === 18) {
        // If all holes played, determine winner
        if (difference > 0) {
          results[player1] = bet.amount;
          results[player2] = -bet.amount;
        } else if (difference < 0) {
          results[player1] = -bet.amount;
          results[player2] = bet.amount;
        } else {
          // Tie - no money changes hands
          results[player1] = 0;
          results[player2] = 0;
        }
      }
    }

    return results;
  };

  // Calculate Nassau winnings
  const calculateNassauWinnings = (bet) => {
    const results = {};

    // Handle both naming conventions
    const playerList = bet.participants || bet.players || [];

    playerList.forEach(player => { results[player] = 0; });

    // Need at least 2 players
    if (playerList.length < 2) return results;

    // For simplicity, just compare first two players
    const player1 = playerList[0];
    const player2 = playerList[1];

    // Calculate front 9 scores
    const player1Front9 = scores[player1]?.slice(0, 9).reduce((sum, s) => sum + (s || 0), 0) || 0;
    const player2Front9 = scores[player2]?.slice(0, 9).reduce((sum, s) => sum + (s || 0), 0) || 0;

    // Calculate back 9 scores
    const player1Back9 = scores[player1]?.slice(9, 18).reduce((sum, s) => sum + (s || 0), 0) || 0;
    const player2Back9 = scores[player2]?.slice(9, 18).reduce((sum, s) => sum + (s || 0), 0) || 0;

    // Calculate total scores
    const player1Total = player1Front9 + player1Back9;
    const player2Total = player2Front9 + player2Back9;

    // Front 9 bet
    if (player1Front9 > 0 && player2Front9 > 0) {
      if (player1Front9 < player2Front9) {
        results[player1] += bet.amount;
        results[player2] -= bet.amount;
      } else if (player2Front9 < player1Front9) {
        results[player1] -= bet.amount;
        results[player2] += bet.amount;
      }
    }

    // Back 9 bet
    if (player1Back9 > 0 && player2Back9 > 0) {
      if (player1Back9 < player2Back9) {
        results[player1] += bet.amount;
        results[player2] -= bet.amount;
      } else if (player2Back9 < player1Back9) {
        results[player1] -= bet.amount;
        results[player2] += bet.amount;
      }
    }

    // Total bet
    if (player1Total > 0 && player2Total > 0 &&
        player1Front9 > 0 && player2Front9 > 0 &&
        player1Back9 > 0 && player2Back9 > 0) {
      if (player1Total < player2Total) {
        results[player1] += bet.amount;
        results[player2] -= bet.amount;
      } else if (player2Total < player1Total) {
        results[player1] -= bet.amount;
        results[player2] += bet.amount;
      }
    }

    return results;
  };

  // Calculate Skins winnings
  const calculateSkinsWinnings = (bet) => {
    const results = {};

    // Handle both naming conventions
    const playerList = bet.participants || bet.players || [];

    playerList.forEach(player => { results[player] = 0; });

    // Need enough players
    if (playerList.length < 2) return results;

    // Count skins for each player
    const skinCount = {};
    playerList.forEach(player => { skinCount[player] = 0; });

    // Check each hole
    for (let hole = 0; hole < 18; hole++) {
      // Skip holes not played by everyone
      const allPlayed = playerList.every(player =>
        (scores[player]?.[hole] || 0) > 0,
      );
      if (!allPlayed) continue;

      // Find best score
      let bestScore = Infinity;
      let bestPlayers = [];

      playerList.forEach(player => {
        const score = scores[player]?.[hole] || 0;
        if (score < bestScore) {
          bestScore = score;
          bestPlayers = [player];
        } else if (score === bestScore) {
          bestPlayers.push(player);
        }
      });

      // Award skin if there's a clear winner
      if (bestPlayers.length === 1) {
        skinCount[bestPlayers[0]]++;
      }
    }

    // Calculate total skins
    const totalSkins = Object.values(skinCount).reduce((sum, count) => sum + count, 0);

    // Distribute winnings
    if (totalSkins > 0) {
      const potSize = bet.amount * playerList.length;
      const skinValue = potSize / totalSkins;

      playerList.forEach(player => {
        // Players with skins win money from those without
        if (skinCount[player] > 0) {
          results[player] = Math.round(skinCount[player] * skinValue * 100) / 100;
        } else {
          results[player] = -bet.amount;
        }
      });
    }

    return results;
  };

  // Calculate Bingo-Bango-Bongo winnings
  const calculateBingoBangoBongoWinnings = (bet) => {
    const results = {};

    // Handle both naming conventions
    const playerList = bet.participants || bet.players || [];

    playerList.forEach(player => { results[player] = 0; });

    // This is a simplified implementation
    // Normally you'd track specific events (first on green, closest to pin, first in hole)

    // Calculate points based on scores (simplified)
    const points = {};
    playerList.forEach(player => { points[player] = 0; });

    // Award points based on score relative to par
    playerList.forEach(player => {
      for (let hole = 0; hole < 18; hole++) {
        const score = scores[player]?.[hole] || 0;
        if (score === 0) continue;

        const par = course.par[hole];

        // Award points for good scores (birdie or better)
        if (score < par) {
          points[player] += (par - score + 1);
        }
        // Award fractional points for pars (simplified)
        else if (score === par) {
          points[player] += 0.5;
        }
      }
    });

    // Calculate total points
    const totalPoints = Object.values(points).reduce((sum, p) => sum + p, 0);

    // Distribute winnings
    if (totalPoints > 0) {
      const potSize = bet.amount * playerList.length;

      playerList.forEach(player => {
        if (points[player] > 0) {
          results[player] = Math.round((points[player] / totalPoints * potSize - bet.amount) * 100) / 100;
        } else {
          results[player] = -bet.amount;
        }
      });
    }

    return results;
  };

  const showNextView = () => {
    const newIndex = (viewIndex + 1) % viewSequence.length;
    setViewIndex(newIndex);
    setCurrentView(viewSequence[newIndex]);
  };

  const showPrevView = () => {
    const newIndex = (viewIndex - 1 + viewSequence.length) % viewSequence.length;
    setViewIndex(newIndex);
    setCurrentView(viewSequence[newIndex]);
  };

  // Touch gesture handling for swipe navigation
  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;

    if (Math.abs(distance) < minSwipeDistance) return;

    if (distance > minSwipeDistance) {
      // Swipe left - next view
      showNextView();
    } else if (distance < -minSwipeDistance) {
      // Swipe right - previous view
      showPrevView();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">{course.name} Scorecard</h2>

        {isConnected !== undefined && (
          <div className={`sync-indicator ${isConnected ? 'online' : 'offline'}`}>
            <span className={`sync-dot ${isConnected ? 'online' : 'offline'}`} />
            <span>{isConnected ? 'Online' : 'Offline'}</span>
          </div>
        )}
      </div>

      <div className="scorecard-nav">
        <button className="scorecard-nav-btn" onClick={showPrevView}>
          ← {viewIndex === 0 ? 'Summary' : 'Front 9'}
        </button>
        <div className="scorecard-view-label">
          <span className="view-title">
            {currentView === 'front-9' ? 'Front 9' :
              currentView === 'back-9' ? 'Back 9' : 'Summary'}
          </span>
          <div className="view-indicators">
            {viewSequence.map((_, index) => (
              <div
                key={index}
                className={`view-dot ${index === viewIndex ? 'active' : ''}`}
                onClick={() => {
                  setViewIndex(index);
                  setCurrentView(viewSequence[index]);
                }}
              />
            ))}
          </div>
        </div>
        <button className="scorecard-nav-btn" onClick={showNextView}>
          {viewIndex === 2 ? 'Front 9' : 'Back 9'} →
        </button>
      </div>

      {/* Mobile compact view - Front 9 */}
      <div
        className="scorecard scorecard-compact overflow-x-auto"
        style={{ display: currentView === 'front-9' ? 'block' : 'none' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="border px-2 py-2 text-left">Hole</th>
              {Array.from({ length: 9 }, (_, i) => (
                <th key={i} className="border px-2 py-2 text-center hole-number" style={{ minWidth: '36px' }}>{i + 1}</th>
              ))}
              <th className="border px-2 py-2 text-center" style={{ minWidth: '45px' }}>F9</th>
            </tr>
            <tr className="bg-gray-100">
              <th className="border px-2 py-2 text-left">Par</th>
              {course.par.slice(0, 9).map((par, i) => (
                <td key={i} className="border px-2 py-2 text-center">{par}</td>
              ))}
              <td className="border px-2 py-2 text-center font-bold total-score">
                {course.par.slice(0, 9).reduce((sum, par) => sum + par, 0)}
              </td>
            </tr>
            <tr className="bg-gray-50">
              <th className="border px-2 py-2 text-left">HCP</th>
              {course.handicap.slice(0, 9).map((hcp, i) => (
                <td key={i} className="border px-2 py-2 text-center">{hcp}</td>
              ))}
              <td className="border px-2 py-2 text-center" />
            </tr>
          </thead>
          <tbody>
            {players.map((player, playerIndex) => (
              <tr key={player.name} className={playerIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <th className="border px-2 py-2 text-left">
                  {player.name.length > 8 ? `${player.name.slice(0, 6)}...` : player.name} ({player.handicap})
                </th>
                {Array.from({ length: 9 }, (_, i) => (
                  <td key={i} className="border px-2 py-2 text-center" style={{ position: 'relative' }}>
                    <ScoreInput
                      value={scores[player.name]?.[i] || ''}
                      onChange={(value) => updateScoreWithSync(player.name, i, value)}
                    />
                    {getStrokesGiven(player.name, i) > 0 && (
                      <span className="strokes-dot">•</span>
                    )}
                  </td>
                ))}
                <td className="border px-2 py-2 text-center font-bold total-score">
                  {calculateGrossScore(player.name, 0, 9)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile compact view - Back 9 */}
      <div
        className="scorecard scorecard-compact overflow-x-auto"
        style={{ display: currentView === 'back-9' ? 'block' : 'none' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="border px-2 py-2 text-left">Hole</th>
              {Array.from({ length: 9 }, (_, i) => (
                <th key={i} className="border px-2 py-2 text-center hole-number" style={{ minWidth: '36px' }}>{i + 10}</th>
              ))}
              <th className="border px-2 py-2 text-center" style={{ minWidth: '45px' }}>B9</th>
            </tr>
            <tr className="bg-gray-100">
              <th className="border px-2 py-2 text-left">Par</th>
              {course.par.slice(9, 18).map((par, i) => (
                <td key={i} className="border px-2 py-2 text-center">{par}</td>
              ))}
              <td className="border px-2 py-2 text-center font-bold total-score">
                {course.par.slice(9, 18).reduce((sum, par) => sum + par, 0)}
              </td>
            </tr>
            <tr className="bg-gray-50">
              <th className="border px-2 py-2 text-left">HCP</th>
              {course.handicap.slice(9, 18).map((hcp, i) => (
                <td key={i} className="border px-2 py-2 text-center">{hcp}</td>
              ))}
              <td className="border px-2 py-2 text-center" />
            </tr>
          </thead>
          <tbody>
            {players.map((player, playerIndex) => (
              <tr key={player.name} className={playerIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <th className="border px-2 py-2 text-left">
                  {player.name.length > 8 ? `${player.name.slice(0, 6)}...` : player.name} ({player.handicap})
                </th>
                {Array.from({ length: 9 }, (_, i) => (
                  <td key={i} className="border px-2 py-2 text-center" style={{ position: 'relative' }}>
                    <ScoreInput
                      value={scores[player.name]?.[i + 9] || ''}
                      onChange={(value) => updateScoreWithSync(player.name, i + 9, value)}
                    />
                    {getStrokesGiven(player.name, i + 9) > 0 && (
                      <span className="strokes-dot">•</span>
                    )}
                  </td>
                ))}
                <td className="border px-2 py-2 text-center font-bold total-score">
                  {calculateGrossScore(player.name, 9, 18)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile view - Summary */}
      <div
        className="scorecard scorecard-compact"
        style={{ display: currentView === 'total-view' ? 'block' : 'none' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="border px-3 py-2 text-left">Player</th>
              <th className="border px-3 py-2 text-center">F9</th>
              <th className="border px-3 py-2 text-center">B9</th>
              <th className="border px-3 py-2 text-center">Total</th>
              <th className="border px-3 py-2 text-center">Net</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player, playerIndex) => (
              <tr key={player.name} className={playerIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <th className="border px-3 py-2 text-left">{player.name}</th>
                <td className="border px-3 py-2 text-center">{calculateGrossScore(player.name, 0, 9)}</td>
                <td className="border px-3 py-2 text-center">{calculateGrossScore(player.name, 9, 18)}</td>
                <td className="border px-3 py-2 text-center font-bold total-score">{calculateGrossScore(player.name)}</td>
                <td className="border px-3 py-2 text-center font-bold total-score">{calculateNetScore(player.name)}</td>
              </tr>
            ))}
            <tr className="bg-gray-100">
              <th className="border px-3 py-2 text-left font-bold">Par</th>
              <td className="border px-3 py-2 text-center">{course.par.slice(0, 9).reduce((sum, par) => sum + par, 0)}</td>
              <td className="border px-3 py-2 text-center">{course.par.slice(9, 18).reduce((sum, par) => sum + par, 0)}</td>
              <td className="border px-3 py-2 text-center font-bold total-score">{course.par.reduce((sum, par) => sum + par, 0)}</td>
              <td className="border px-3 py-2 text-center">-</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Full desktop view */}
      <div className="scorecard scorecard-full overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="border px-2 py-2 text-left" style={{ minWidth: '120px' }}>Hole</th>
              {Array.from({ length: 18 }, (_, i) => (
                <th key={i} className="border px-2 py-2 text-center hole-number" style={{ minWidth: '36px' }}>{i + 1}</th>
              ))}
              <th className="border px-2 py-2 text-center" style={{ minWidth: '80px' }}>Total</th>
            </tr>
            <tr className="bg-gray-100">
              <th className="border px-2 py-2 text-left">Par</th>
              {course.par.map((par, i) => (
                <td key={i} className="border px-2 py-2 text-center">{par}</td>
              ))}
              <td className="border px-2 py-2 text-center font-bold total-score">
                {course.par.reduce((sum, par) => sum + par, 0)}
              </td>
            </tr>
            <tr className="bg-gray-50">
              <th className="border px-2 py-2 text-left">Handicap</th>
              {course.handicap.map((hcp, i) => (
                <td key={i} className="border px-2 py-2 text-center">{hcp}</td>
              ))}
              <td className="border px-2 py-2 text-center" />
            </tr>
          </thead>
          <tbody>
            {players.map((player, playerIndex) => (
              <tr key={player.name} className={playerIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <th className="border px-2 py-2 text-left">
                  {player.name} (HCP: {player.handicap})
                </th>
                {Array.from({ length: 18 }, (_, i) => (
                  <td key={i} className="border px-2 py-2 text-center" style={{ position: 'relative' }}>
                    <ScoreInput
                      value={scores[player.name]?.[i] || ''}
                      onChange={(value) => updateScoreWithSync(player.name, i, value)}
                    />
                    {getStrokesGiven(player.name, i) > 0 && (
                      <span className="strokes-dot">•</span>
                    )}
                  </td>
                ))}
                <td className="border px-2 py-2 text-center font-bold total-score">
                  {calculateGrossScore(player.name)} ({calculateNetScore(player.name)})
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {roundId && (
        <ShareRound roundId={roundId} />
      )}

      <div className="info-section">
        <div className="bet-summary-container">
          <h3 className="info-card-header">Bet Summary</h3>
          <div className="bet-summary">
            {bets.length === 0 ? (
              <p className="no-bets-message">No active bets. Add a bet below.</p>
            ) : (
              <div className="bet-summary-cards">
                {bets.map((bet, index) => {
                  // Add safety check for bet structure
                  if (!bet || !bet.participants || !Array.isArray(bet.participants)) {
                    console.error('Invalid bet structure:', bet);
                    return null;
                  }

                  try {
                    const betResults = calculateBetWinningsTotal(bet);
                    return (
                      <div key={index} className="bet-summary-card">
                        <div className="bet-summary-header">
                          <span className="bet-type-pill">{betTypes.find(t => t.id === bet.type)?.name || 'Unknown'}</span>
                          <span className="bet-amount-pill">${bet.amount || 0}</span>
                        </div>
                        {Object.entries(betResults).map(([player, amount]) => (
                          <div key={player} className="bet-summary-player">
                            <span>{player}</span>
                            <span
                              className={`bet-summary-amount ${amount > 0 ? 'positive' : amount < 0 ? 'negative' : ''}`}
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
            )}
          </div>
        </div>

        <HoleInfo course={course} />
        <BettingGames
          round={{
            players: players.map(p => p.name),
            scores,
            pars: course.par,
          }}
          onBetAdd={(bet) => {
            // Add to local state
            addBet(bet);
            // Sync with Firebase if roundId exists
            if (roundId) {
              updateBet(roundId, bet);
            }
          }}
        />
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="spinner" />
        </div>
      )}
    </div>
  );
}

export default Scorecard;
