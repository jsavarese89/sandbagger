import React, { useState, useEffect } from 'react';

const BettingGames = ({ round, onBetAdd }) => {
  const [gameType, setGameType] = useState('');
  const [betAmount, setBetAmount] = useState(5);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [gameOptions, setGameOptions] = useState({});
  const [bettingResults, setBettingResults] = useState(null);

  const gameTypes = [
    { id: 'nassau', name: 'Nassau', description: 'Front 9, Back 9, and 18-hole match' },
    { id: 'skins', name: 'Skins', description: 'Win holes outright to win skins' },
    { id: 'bingo-bango-bongo', name: 'Bingo-Bango-Bongo', description: 'First on green, closest to pin, first in hole' },
    { id: 'vegas', name: 'Vegas', description: 'Team game with dynamic odds based on scores' },
    { id: 'wolf', name: 'Wolf', description: 'Rotating team selection on each hole' },
    { id: 'stableford', name: 'Stableford', description: 'Points for scores relative to par' },
    { id: 'match', name: 'Match Play', description: 'Head-to-head match play' },
  ];

  useEffect(() => {
    if (round && round.players) {
      setSelectedPlayers(Object.keys(round.scores || {}).slice(0, 2));
    }
  }, [round]);

  // Recalculate betting results when scores change
  useEffect(() => {
    if (gameType && round && round.scores && selectedPlayers.length >= 2) {
      calculateBettingResults();
    }
  }, [round?.scores, gameType, selectedPlayers]);

  const handleGameTypeChange = (type) => {
    setGameType(type);

    // Reset game options based on game type
    switch (type) {
      case 'nassau':
        setGameOptions({
          pressOption: 'automatic',
          pressAmount: 2,
          useHandicaps: true,
        });
        break;
      case 'skins':
        setGameOptions({
          carryovers: true,
          useHandicaps: true,
        });
        break;
      case 'vegas':
        setGameOptions({
          teamRotation: 'fixed',
          multiplier: 1,
        });
        break;
      case 'wolf':
        setGameOptions({
          superWolf: false,
          blindWolf: false,
        });
        break;
      case 'stableford':
        setGameOptions({
          scoring: 'standard',
          useHandicaps: true,
        });
        break;
      case 'bingo-bango-bongo':
        setGameOptions({
          bingoPoints: 1,   // First on green
          bangoPoints: 1,   // Closest to pin
          bongoPoints: 1,   // First in hole
          useHandicaps: false,
        });
        break;
      case 'match':
        setGameOptions({
          useHandicaps: true,
        });
        break;
      default:
        setGameOptions({});
    }

    // Reset betting results
    setBettingResults(null);
  };

  const handlePlayerToggle = (playerName) => {
    if (selectedPlayers.includes(playerName)) {
      setSelectedPlayers(selectedPlayers.filter(p => p !== playerName));
    } else {
      setSelectedPlayers([...selectedPlayers, playerName]);
    }
  };

  const handleAddBet = () => {
    const bet = {
      type: gameType,
      amount: betAmount,
      participants: selectedPlayers, // Standardized naming
      options: gameOptions,
      timestamp: new Date().toISOString(),
    };

    onBetAdd(bet);

    // Calculate and display betting results
    calculateBettingResults();
  };

  const calculateBettingResults = () => {
    if (!round || !round.scores || selectedPlayers.length < 2) {
      return;
    }

    let results = {};

    switch (gameType) {
      case 'nassau':
        results = calculateNassauResults();
        break;
      case 'skins':
        results = calculateSkinsResults();
        break;
      case 'match':
        results = calculateMatchPlayResults();
        break;
      case 'stableford':
        results = calculateStablefordResults();
        break;
      case 'bingo-bango-bongo':
        results = calculateBingoBangoBongoResults();
        break;
      default:
        results = { message: 'Calculation not implemented for this game type' };
    }

    setBettingResults(results);
  };

  const calculateNassauResults = () => {
    const { scores } = round;
    const player1 = selectedPlayers[0];
    const player2 = selectedPlayers[1];

    if (!player1 || !player2) return { message: 'Need two players for Nassau' };

    const player1Scores = scores[player1] || [];
    const player2Scores = scores[player2] || [];

    // Count completed holes
    const completedHoles = Math.min(
      player1Scores.filter(s => s > 0).length,
      player2Scores.filter(s => s > 0).length,
    );

    if (completedHoles < 9) {
      return { message: 'Need at least 9 completed holes' };
    }

    // Front 9
    let front9Player1 = 0;
    let front9Player2 = 0;

    for (let i = 0; i < 9 && i < completedHoles; i++) {
      front9Player1 += player1Scores[i] || 0;
      front9Player2 += player2Scores[i] || 0;
    }

    const front9Result = front9Player1 < front9Player2 ?
      { winner: player1, amount: betAmount } :
      front9Player2 < front9Player1 ?
        { winner: player2, amount: betAmount } :
        { winner: 'tie', amount: 0 };

    // Back 9
    let back9Player1 = 0;
    let back9Player2 = 0;
    let back9Completed = false;

    if (completedHoles >= 18) {
      for (let i = 9; i < 18; i++) {
        back9Player1 += player1Scores[i] || 0;
        back9Player2 += player2Scores[i] || 0;
      }
      back9Completed = true;
    }

    const back9Result = back9Completed ?
      (back9Player1 < back9Player2 ?
        { winner: player1, amount: betAmount } :
        back9Player2 < back9Player1 ?
          { winner: player2, amount: betAmount } :
          { winner: 'tie', amount: 0 }) :
      { winner: 'incomplete', amount: 0 };

    // Overall
    const totalPlayer1 = front9Player1 + back9Player1;
    const totalPlayer2 = front9Player2 + back9Player2;

    const totalResult = completedHoles >= 18 ?
      (totalPlayer1 < totalPlayer2 ?
        { winner: player1, amount: betAmount } :
        totalPlayer2 < totalPlayer1 ?
          { winner: player2, amount: betAmount } :
          { winner: 'tie', amount: 0 }) :
      { winner: 'incomplete', amount: 0 };

    // Calculate presses if enabled
    const presses = [];

    if (gameOptions.pressOption === 'automatic' && completedHoles >= 18) {
      // Check for automatic presses (when down by 2 or more after a hole)
      let player1FrontRunning = 0;
      let player2FrontRunning = 0;

      for (let i = 0; i < completedHoles; i++) {
        const p1Score = player1Scores.slice(0, i + 1).reduce((sum, s) => sum + s, 0);
        const p2Score = player2Scores.slice(0, i + 1).reduce((sum, s) => sum + s, 0);

        const diff = p1Score - p2Score;

        if (Math.abs(diff) >= gameOptions.pressAmount) {
          if (diff < 0 && player1FrontRunning < Math.floor(Math.abs(diff) / gameOptions.pressAmount)) {
            player1FrontRunning = Math.floor(Math.abs(diff) / gameOptions.pressAmount);
            presses.push({
              hole: i + 1,
              leader: player1,
              amount: betAmount / 2,
            });
          } else if (diff > 0 && player2FrontRunning < Math.floor(diff / gameOptions.pressAmount)) {
            player2FrontRunning = Math.floor(diff / gameOptions.pressAmount);
            presses.push({
              hole: i + 1,
              leader: player2,
              amount: betAmount / 2,
            });
          }
        }
      }
    }

    // Calculate total winnings
    let player1Winnings = 0;
    let player2Winnings = 0;

    if (front9Result.winner === player1) player1Winnings += front9Result.amount;
    if (front9Result.winner === player2) player2Winnings += front9Result.amount;

    if (back9Result.winner === player1) player1Winnings += back9Result.amount;
    if (back9Result.winner === player2) player2Winnings += back9Result.amount;

    if (totalResult.winner === player1) player1Winnings += totalResult.amount;
    if (totalResult.winner === player2) player2Winnings += totalResult.amount;

    presses.forEach(press => {
      if (press.leader === player1) player1Winnings += press.amount;
      if (press.leader === player2) player2Winnings += press.amount;
    });

    const netWinnings = player1Winnings - player2Winnings;

    return {
      front9: front9Result,
      back9: back9Result,
      total: totalResult,
      presses,
      netResult: netWinnings > 0 ?
        `${player1} wins $${netWinnings}` :
        netWinnings < 0 ?
          `${player2} wins $${Math.abs(netWinnings)}` :
          'Tie - no money exchanged',
    };
  };

  const calculateSkinsResults = () => {
    const { scores } = round;
    const pars = round.pars || Array(18).fill(4);
    const playerNames = selectedPlayers;

    if (playerNames.length < 2) {
      return { message: 'Need at least two players for Skins' };
    }

    // Find number of completed holes across all players
    let completedHoles = 18;

    playerNames.forEach(player => {
      const playerScores = scores[player] || [];
      const playerCompleted = playerScores.filter(s => s > 0).length;
      completedHoles = Math.min(completedHoles, playerCompleted);
    });

    if (completedHoles === 0) {
      return { message: 'No completed holes found' };
    }

    // Calculate skins for each hole
    const skins = [];
    let carryover = 0;

    for (let hole = 0; hole < completedHoles; hole++) {
      // Get all scores for this hole
      const holeScores = playerNames.map(player => ({
        player,
        score: scores[player][hole] || 0,
        netScore: gameOptions.useHandicaps ?
          Math.max(0, (scores[player][hole] || 0) - (round.playerHandicaps?.[player] || 0) / 18) :
          (scores[player][hole] || 0),
      })).filter(s => s.score > 0);

      // Sort by net score (ascending)
      holeScores.sort((a, b) => a.netScore - b.netScore);

      // Check if there's a winner (lowest unique score)
      if (holeScores.length > 0 &&
          (holeScores.length === 1 || holeScores[0].netScore < holeScores[1].netScore)) {
        const winner = holeScores[0];

        // Value of this skin includes any carryovers
        const skinValue = betAmount + carryover;

        skins.push({
          hole: hole + 1,
          winner: winner.player,
          score: winner.score,
          par: pars[hole],
          value: skinValue,
        });

        carryover = 0;
      } else {
        // Tie - carryover if enabled
        if (gameOptions.carryovers) {
          carryover += betAmount;
        }
      }
    }

    // Calculate totals by player
    const playerTotals = {};
    playerNames.forEach(player => {
      playerTotals[player] = 0;
    });

    skins.forEach(skin => {
      playerTotals[skin.winner] += skin.value;
    });

    return {
      skins,
      playerTotals,
      carryover,
      totalSkins: skins.length,
      totalValue: skins.reduce((sum, skin) => sum + skin.value, 0),
    };
  };

  const calculateMatchPlayResults = () => {
    const { scores } = round;
    const player1 = selectedPlayers[0];
    const player2 = selectedPlayers[1];

    if (!player1 || !player2) {
      return { message: 'Need two players for Match Play' };
    }

    const player1Scores = scores[player1] || [];
    const player2Scores = scores[player2] || [];

    // Count completed holes
    const completedHoles = Math.min(
      player1Scores.filter(s => s > 0).length,
      player2Scores.filter(s => s > 0).length,
    );

    if (completedHoles === 0) {
      return { message: 'No completed holes found' };
    }

    // Calculate match status after each hole
    let player1Up = 0;
    const holeResults = [];

    for (let hole = 0; hole < completedHoles; hole++) {
      const p1Score = player1Scores[hole];
      const p2Score = player2Scores[hole];

      if (p1Score === 0 || p2Score === 0) continue;

      let holeWinner = '';
      if (p1Score < p2Score) {
        holeWinner = player1;
        player1Up++;
      } else if (p2Score < p1Score) {
        holeWinner = player2;
        player1Up--;
      } else {
        holeWinner = 'halved';
      }

      holeResults.push({
        hole: hole + 1,
        winner: holeWinner,
        status: player1Up > 0 ?
          `${player1} ${player1Up} UP` :
          player1Up < 0 ?
            `${player2} ${Math.abs(player1Up)} UP` :
            'ALL SQUARE',
      });
    }

    // Determine if match is dormie or closed out
    let matchStatus = '';
    const holesRemaining = 18 - completedHoles;

    if (Math.abs(player1Up) > holesRemaining) {
      // Match is closed out
      matchStatus = player1Up > 0 ?
        `${player1} wins ${Math.abs(player1Up)} and ${holesRemaining}` :
        `${player2} wins ${Math.abs(player1Up)} and ${holesRemaining}`;
    } else if (Math.abs(player1Up) === holesRemaining) {
      // Match is dormie
      matchStatus = player1Up > 0 ?
        `${player1} dormie ${player1Up}` :
        `${player2} dormie ${Math.abs(player1Up)}`;
    } else if (completedHoles === 18) {
      // Final result after 18
      matchStatus = player1Up > 0 ?
        `${player1} wins ${player1Up} UP` :
        player1Up < 0 ?
          `${player2} wins ${Math.abs(player1Up)} UP` :
          'Match halved';
    } else {
      // Match ongoing
      matchStatus = player1Up > 0 ?
        `${player1} ${player1Up} UP with ${holesRemaining} to play` :
        player1Up < 0 ?
          `${player2} ${Math.abs(player1Up)} UP with ${holesRemaining} to play` :
          `All square with ${holesRemaining} to play`;
    }

    return {
      holeResults,
      matchStatus,
      winner: player1Up > 0 ? player1 : player1Up < 0 ? player2 : 'halved',
      amount: player1Up !== 0 ? betAmount : 0,
    };
  };

  const calculateStablefordResults = () => {
    const { scores } = round;
    const pars = round.pars || Array(18).fill(4);
    const playerNames = selectedPlayers;

    if (playerNames.length < 1) {
      return { message: 'Need at least one player for Stableford' };
    }

    // Define scoring system
    let pointSystem;

    if (gameOptions.scoring === 'modified') {
      // Modified Stableford (like in the International)
      pointSystem = {
        eagle: 5,    // -2
        birdie: 2,   // -1
        par: 0,      // 0
        bogey: -1,   // +1
        double: -3,   // +2 or worse
      };
    } else {
      // Standard Stableford
      pointSystem = {
        albatross: 5, // -3
        eagle: 4,     // -2
        birdie: 3,    // -1
        par: 2,       // 0
        bogey: 1,     // +1
        double: 0,     // +2 or worse
      };
    }

    // Calculate points for each player
    const playerResults = {};

    playerNames.forEach(player => {
      const playerScores = scores[player] || [];
      let totalPoints = 0;
      const holePoints = [];

      for (let hole = 0; hole < playerScores.length; hole++) {
        const score = playerScores[hole];
        if (score === 0) continue; // Skip incomplete holes

        const par = pars[hole] || 4;
        const scoreToPar = score - par;

        let points = 0;

        if (gameOptions.scoring === 'modified') {
          // Modified Stableford
          if (scoreToPar <= -2) points = pointSystem.eagle;
          else if (scoreToPar === -1) points = pointSystem.birdie;
          else if (scoreToPar === 0) points = pointSystem.par;
          else if (scoreToPar === 1) points = pointSystem.bogey;
          else points = pointSystem.double;
        } else {
          // Standard Stableford
          if (scoreToPar <= -3) points = pointSystem.albatross;
          else if (scoreToPar === -2) points = pointSystem.eagle;
          else if (scoreToPar === -1) points = pointSystem.birdie;
          else if (scoreToPar === 0) points = pointSystem.par;
          else if (scoreToPar === 1) points = pointSystem.bogey;
          else points = pointSystem.double;
        }

        holePoints.push({
          hole: hole + 1,
          score,
          par,
          points,
        });

        totalPoints += points;
      }

      playerResults[player] = {
        total: totalPoints,
        holes: holePoints,
      };
    });

    // Determine winner
    let winner = '';
    let maxPoints = -Infinity;

    for (const [player, result] of Object.entries(playerResults)) {
      if (result.total > maxPoints) {
        maxPoints = result.total;
        winner = player;
      } else if (result.total === maxPoints) {
        winner = 'tie';
      }
    }

    return {
      playerResults,
      winner: winner !== 'tie' ? winner : 'Tie',
      winningPoints: maxPoints,
      amount: winner !== 'tie' ? betAmount : 0,
    };
  };

  const calculateBingoBangoBongoResults = () => {
    const { scores } = round;
    const pars = round.pars || Array(18).fill(4);
    const playerNames = selectedPlayers;

    if (playerNames.length < 2) {
      return { message: 'Need at least two players for Bingo-Bango-Bongo' };
    }

    // Find number of completed holes across all players
    let completedHoles = 18;

    playerNames.forEach(player => {
      const playerScores = scores[player] || [];
      const playerCompleted = playerScores.filter(s => s > 0).length;
      completedHoles = Math.min(completedHoles, playerCompleted);
    });

    if (completedHoles === 0) {
      return { message: 'No completed holes found' };
    }

    // Track points for each player
    const playerPoints = {};
    playerNames.forEach(player => {
      playerPoints[player] = {
        bingo: 0,   // First on green
        bango: 0,   // Closest to pin
        bongo: 0,   // First in hole
        total: 0,
      };
    });

    // For each hole, award points
    const holeResults = [];

    for (let hole = 0; hole < completedHoles; hole++) {
      const holeScores = playerNames.map(player => ({
        player,
        score: scores[player][hole] || 0,
      })).filter(s => s.score > 0);

      if (holeScores.length === 0) continue;

      const par = pars[hole] || 4;

      // BINGO: First on green (simplified - award to best approach shot)
      // In real golf, this would be based on who reaches the green first
      // Here we'll award it to whoever gets closest to regulation
      let bingoWinner = null;
      let bestApproach = Infinity;

      holeScores.forEach(({ player, score }) => {
        // Award bingo to player who gets closest to par on approach
        // This is a simplification - real bingo tracking would need GPS/manual input
        const approachScore = Math.abs(score - par);
        if (approachScore < bestApproach) {
          bestApproach = approachScore;
          bingoWinner = player;
        }
      });

      // BANGO: Closest to pin (award to lowest score)
      const sortedScores = [...holeScores].sort((a, b) => a.score - b.score);
      let bangoWinner = null;

      if (sortedScores.length > 0) {
        // If there's a tie for lowest score, no bango awarded
        if (sortedScores.length === 1 || sortedScores[0].score < sortedScores[1].score) {
          bangoWinner = sortedScores[0].player;
        }
      }

      // BONGO: First in hole (award to lowest score, representing finishing first)
      const bongoWinner = bangoWinner; // Same as bango in this simplified version

      // Award points
      if (bingoWinner) {
        playerPoints[bingoWinner].bingo += gameOptions.bingoPoints || 1;
        playerPoints[bingoWinner].total += gameOptions.bingoPoints || 1;
      }

      if (bangoWinner) {
        playerPoints[bangoWinner].bango += gameOptions.bangoPoints || 1;
        playerPoints[bangoWinner].total += gameOptions.bangoPoints || 1;
      }

      if (bongoWinner && bongoWinner !== bangoWinner) {
        playerPoints[bongoWinner].bongo += gameOptions.bongoPoints || 1;
        playerPoints[bongoWinner].total += gameOptions.bongoPoints || 1;
      }

      holeResults.push({
        hole: hole + 1,
        par,
        bingo: bingoWinner,
        bango: bangoWinner,
        bongo: bongoWinner,
        scores: holeScores,
      });
    }

    // Calculate payouts
    const totalPoints = Object.values(playerPoints).reduce((sum, p) => sum + p.total, 0);
    const playerPayouts = {};

    if (totalPoints > 0) {
      const totalPot = betAmount * playerNames.length;
      const pointValue = totalPot / totalPoints;

      playerNames.forEach(player => {
        const points = playerPoints[player].total;
        const payout = points * pointValue - betAmount;
        playerPayouts[player] = Math.round(payout * 100) / 100;
      });
    } else {
      playerNames.forEach(player => {
        playerPayouts[player] = 0;
      });
    }

    // Find winner
    let winner = '';
    let maxPoints = -1;

    for (const [player, points] of Object.entries(playerPoints)) {
      if (points.total > maxPoints) {
        maxPoints = points.total;
        winner = player;
      } else if (points.total === maxPoints) {
        winner = 'tie';
      }
    }

    return {
      playerPoints,
      playerPayouts,
      holeResults,
      winner: winner !== 'tie' ? winner : 'Tie',
      totalPoints,
      completedHoles,
    };
  };

  const renderGameOptions = () => {
    if (!gameType) return null;

    switch (gameType) {
      case 'nassau':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Press Option</label>
              <select
                className="w-full px-3 py-2 border rounded-lg"
                value={gameOptions.pressOption}
                onChange={(e) => setGameOptions({ ...gameOptions, pressOption: e.target.value })}
              >
                <option value="automatic">Automatic Presses</option>
                <option value="manual">Manual Presses</option>
                <option value="none">No Presses</option>
              </select>
            </div>

            {gameOptions.pressOption === 'automatic' && (
              <div>
                <label className="block text-sm font-medium mb-1">Press After Down</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg"
                  value={gameOptions.pressAmount}
                  onChange={(e) => setGameOptions({ ...gameOptions, pressAmount: parseInt(e.target.value) })}
                >
                  <option value={2}>2 Holes</option>
                  <option value={3}>3 Holes</option>
                  <option value={4}>4 Holes</option>
                </select>
              </div>
            )}

            <div className="flex items-center">
              <input
                type="checkbox"
                id="useHandicaps"
                checked={gameOptions.useHandicaps}
                onChange={(e) => setGameOptions({ ...gameOptions, useHandicaps: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="useHandicaps" className="text-sm">Use Handicaps</label>
            </div>
          </div>
        );

      case 'skins':
        return (
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="carryovers"
                checked={gameOptions.carryovers}
                onChange={(e) => setGameOptions({ ...gameOptions, carryovers: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="carryovers" className="text-sm">Enable Carryovers</label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="useHandicapsSkins"
                checked={gameOptions.useHandicaps}
                onChange={(e) => setGameOptions({ ...gameOptions, useHandicaps: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="useHandicapsSkins" className="text-sm">Use Handicaps</label>
            </div>
          </div>
        );

      case 'stableford':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Scoring System</label>
              <select
                className="w-full px-3 py-2 border rounded-lg"
                value={gameOptions.scoring}
                onChange={(e) => setGameOptions({ ...gameOptions, scoring: e.target.value })}
              >
                <option value="standard">Standard Stableford</option>
                <option value="modified">Modified Stableford</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="useHandicapsStableford"
                checked={gameOptions.useHandicaps}
                onChange={(e) => setGameOptions({ ...gameOptions, useHandicaps: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="useHandicapsStableford" className="text-sm">Use Handicaps</label>
            </div>
          </div>
        );

      case 'bingo-bango-bongo':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Bingo Points (First on Green)</label>
              <input
                type="number"
                min={1}
                max={5}
                className="w-full px-3 py-2 border rounded-lg"
                value={gameOptions.bingoPoints}
                onChange={(e) => setGameOptions({ ...gameOptions, bingoPoints: parseInt(e.target.value) || 1 })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Bango Points (Closest to Pin)</label>
              <input
                type="number"
                min={1}
                max={5}
                className="w-full px-3 py-2 border rounded-lg"
                value={gameOptions.bangoPoints}
                onChange={(e) => setGameOptions({ ...gameOptions, bangoPoints: parseInt(e.target.value) || 1 })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Bongo Points (First in Hole)</label>
              <input
                type="number"
                min={1}
                max={5}
                className="w-full px-3 py-2 border rounded-lg"
                value={gameOptions.bongoPoints}
                onChange={(e) => setGameOptions({ ...gameOptions, bongoPoints: parseInt(e.target.value) || 1 })}
              />
            </div>

            <div className="text-xs text-gray-600 p-2 bg-blue-50 rounded">
              <strong>Note:</strong> This is a simplified implementation. Bingo (first on green) and Bongo (first in hole)
              are calculated based on scores. In real Bingo-Bango-Bongo, these would be tracked manually or with GPS.
            </div>
          </div>
        );

      case 'match':
        return (
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="useHandicapsMatch"
                checked={gameOptions.useHandicaps}
                onChange={(e) => setGameOptions({ ...gameOptions, useHandicaps: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="useHandicapsMatch" className="text-sm">Use Handicaps</label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderBettingResults = () => {
    if (!bettingResults) return null;

    if (bettingResults.message) {
      return (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p>{bettingResults.message}</p>
        </div>
      );
    }

    switch (gameType) {
      case 'nassau':
        return (
          <div className="mt-4 p-3 bg-gray-50 border rounded-lg">
            <h4 className="font-medium mb-2">Nassau Results</h4>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Front 9:</span>
                <span>
                  {bettingResults.front9.winner === 'tie' ? 'Tied' :
                    bettingResults.front9.winner === 'incomplete' ? 'Incomplete' :
                      `${bettingResults.front9.winner} wins $${bettingResults.front9.amount}`}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Back 9:</span>
                <span>
                  {bettingResults.back9.winner === 'tie' ? 'Tied' :
                    bettingResults.back9.winner === 'incomplete' ? 'Incomplete' :
                      `${bettingResults.back9.winner} wins $${bettingResults.back9.amount}`}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Overall:</span>
                <span>
                  {bettingResults.total.winner === 'tie' ? 'Tied' :
                    bettingResults.total.winner === 'incomplete' ? 'Incomplete' :
                      `${bettingResults.total.winner} wins $${bettingResults.total.amount}`}
                </span>
              </div>

              {bettingResults.presses.length > 0 && (
                <div>
                  <div className="font-medium mt-2">Presses:</div>
                  {bettingResults.presses.map((press, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>Press at hole {press.hole}:</span>
                      <span>{press.leader} wins ${press.amount}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="font-medium text-lg mt-2 pt-2 border-t">
                {bettingResults.netResult}
              </div>
            </div>
          </div>
        );

      case 'skins':
        return (
          <div className="mt-4 p-3 bg-gray-50 border rounded-lg">
            <h4 className="font-medium mb-2">Skins Results</h4>

            {bettingResults.skins.length > 0 ? (
              <div className="space-y-2">
                <div className="text-sm">
                  Total skins: {bettingResults.totalSkins},
                  Total value: ${bettingResults.totalValue}
                  {bettingResults.carryover > 0 && `, Carryover: $${bettingResults.carryover}`}
                </div>

                <div className="space-y-1">
                  {Object.entries(bettingResults.playerTotals)
                    .sort((a, b) => b[1] - a[1])
                    .map(([player, total]) => (
                      <div key={player} className="flex justify-between">
                        <span>{player}:</span>
                        <span>${total}</span>
                      </div>
                    ))
                  }
                </div>

                <div className="mt-3 pt-2 border-t">
                  <div className="font-medium mb-1">Skins won:</div>
                  {bettingResults.skins.map(skin => (
                    <div key={skin.hole} className="text-sm flex justify-between">
                      <span>
                        Hole {skin.hole} ({skin.score} on par {skin.par}):
                      </span>
                      <span>{skin.winner} (${skin.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p>No skins won yet{bettingResults.carryover > 0 ? `, $${bettingResults.carryover} carryover` : ''}</p>
            )}
          </div>
        );

      case 'match':
        return (
          <div className="mt-4 p-3 bg-gray-50 border rounded-lg">
            <h4 className="font-medium mb-2">Match Play Results</h4>

            <div className="font-medium mb-2">{bettingResults.matchStatus}</div>

            {bettingResults.holeResults.length > 0 && (
              <div className="mt-2 text-sm">
                <div className="grid grid-cols-6 gap-1 mb-1 font-medium">
                  <div>Hole</div>
                  <div className="col-span-3">Winner</div>
                  <div className="col-span-2">Status</div>
                </div>
                {bettingResults.holeResults.map((result, i) => (
                  <div key={i} className="grid grid-cols-6 gap-1">
                    <div>{result.hole}</div>
                    <div className="col-span-3">
                      {result.winner === 'halved' ? 'Halved' : result.winner}
                    </div>
                    <div className="col-span-2">{result.status}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'stableford':
        return (
          <div className="mt-4 p-3 bg-gray-50 border rounded-lg">
            <h4 className="font-medium mb-2">Stableford Results</h4>

            <div className="space-y-3">
              {Object.entries(bettingResults.playerResults)
                .sort((a, b) => b[1].total - a[1].total)
                .map(([player, result]) => (
                  <div key={player}>
                    <div className="flex justify-between font-medium">
                      <span>{player}</span>
                      <span>{result.total} points</span>
                    </div>

                    <div className="mt-1 grid grid-cols-9 gap-1 text-xs">
                      {result.holes.slice(0, 9).map(hole => (
                        <div key={hole.hole} className="text-center">
                          <div className="font-medium">{hole.hole}</div>
                          <div>{hole.points}</div>
                        </div>
                      ))}
                    </div>

                    {result.holes.length > 9 && (
                      <div className="mt-1 grid grid-cols-9 gap-1 text-xs">
                        {result.holes.slice(9, 18).map(hole => (
                          <div key={hole.hole} className="text-center">
                            <div className="font-medium">{hole.hole}</div>
                            <div>{hole.points}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              }

              <div className="pt-2 border-t font-medium">
                {bettingResults.winner === 'Tie' ?
                  'Tie - no money exchanged' :
                  `${bettingResults.winner} wins $${bettingResults.amount}`}
              </div>
            </div>
          </div>
        );

      case 'bingo-bango-bongo':
        return (
          <div className="mt-4 p-3 bg-gray-50 border rounded-lg">
            <h4 className="font-medium mb-2">Bingo-Bango-Bongo Results</h4>

            <div className="space-y-3">
              {Object.entries(bettingResults.playerPoints)
                .sort((a, b) => b[1].total - a[1].total)
                .map(([player, points]) => (
                  <div key={player}>
                    <div className="flex justify-between font-medium">
                      <span>{player}</span>
                      <span>{points.total} points (${bettingResults.playerPayouts[player]})</span>
                    </div>

                    <div className="flex justify-between text-sm text-gray-600 mt-1">
                      <span>Bingo: {points.bingo}</span>
                      <span>Bango: {points.bango}</span>
                      <span>Bongo: {points.bongo}</span>
                    </div>
                  </div>
                ))
              }

              <div className="pt-2 border-t">
                <div className="text-sm mb-2">
                  Total points awarded: {bettingResults.totalPoints}
                  across {bettingResults.completedHoles} holes
                </div>

                <div className="font-medium">
                  {bettingResults.winner === 'Tie' ?
                    'Tie - no money exchanged' :
                    `${bettingResults.winner} leads with ${bettingResults.playerPoints[bettingResults.winner]?.total || 0} points`}
                </div>
              </div>

              {bettingResults.holeResults.length > 0 && (
                <div className="mt-3 pt-2 border-t">
                  <div className="font-medium mb-2">Points by hole:</div>
                  <div className="grid grid-cols-1 gap-1 text-xs">
                    {bettingResults.holeResults.map(result => (
                      <div key={result.hole} className="flex justify-between items-center py-1">
                        <span className="font-medium">Hole {result.hole} (Par {result.par}):</span>
                        <div className="flex gap-2">
                          {result.bingo && <span className="text-blue-600">Bingo: {result.bingo}</span>}
                          {result.bango && <span className="text-green-600">Bango: {result.bango}</span>}
                          {result.bongo && result.bongo !== result.bango && <span className="text-red-600">Bongo: {result.bongo}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className="mt-4 p-3 bg-gray-50 border rounded-lg">
            <p>Betting results calculation not implemented for this game type</p>
          </div>
        );
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow" data-testid="betting-games-section">
      <h2 className="text-xl font-bold mb-4" data-testid="betting-games-title">Betting Games</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Game Type</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {gameTypes.map(game => (
            <button
              key={game.id}
              className={`p-2 border rounded-lg text-center hover:bg-gray-50 ${
                gameType === game.id ? 'bg-blue-50 border-blue-300' : ''
              }`}
              onClick={() => handleGameTypeChange(game.id)}
            >
              <div className="font-medium">{game.name}</div>
              <div className="text-xs text-gray-500">{game.description}</div>
            </button>
          ))}
        </div>
      </div>

      {gameType && (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Bet Amount ($)</label>
            <input
              type="number"
              min={1}
              className="w-full px-3 py-2 border rounded-lg"
              value={betAmount}
              onChange={(e) => setBetAmount(parseInt(e.target.value) || 1)}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Select Players</label>
            <div className="space-y-2">
              {round && Object.keys(round.scores || {}).map(playerName => (
                <div key={playerName} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`player-${playerName}`}
                    checked={selectedPlayers.includes(playerName)}
                    onChange={() => handlePlayerToggle(playerName)}
                    className="mr-2"
                  />
                  <label htmlFor={`player-${playerName}`}>{playerName}</label>
                </div>
              ))}
            </div>
          </div>

          {renderGameOptions()}

          <button
            data-testid="add-bet-btn"
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 w-full"
            onClick={handleAddBet}
            disabled={!gameType || selectedPlayers.length < 2}
          >
            Add Bet
          </button>

          {renderBettingResults()}
        </>
      )}
    </div>
  );
};

export default BettingGames;
