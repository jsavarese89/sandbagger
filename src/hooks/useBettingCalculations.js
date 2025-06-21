import { useMemo, useCallback } from 'react';

export const useBettingCalculations = (scores, players, course) => {
  // Memoize frequently accessed data
  const playerMap = useMemo(() => {
    const map = new Map();
    players.forEach(player => {
      map.set(player.name, player);
    });
    return map;
  }, [players]);

  const courseData = useMemo(() => ({
    par: course?.par || Array(18).fill(4),
    handicaps: course?.handicap || Array(18).fill(10),
  }), [course]);

  // Helper function to get player handicap with caching
  const getPlayerHandicap = useCallback((playerName) => {
    return playerMap.get(playerName)?.handicap || 0;
  }, [playerMap]);

  // Helper function to calculate adjusted score
  const getAdjustedScore = useCallback((playerName, hole, score) => {
    const handicap = getPlayerHandicap(playerName);
    const holeHandicap = courseData.handicaps[hole] || (hole + 1);
    return score - (handicap >= holeHandicap ? 1 : 0);
  }, [getPlayerHandicap, courseData]);

  const calculateMatchPlayWinnings = useMemo(() => (bet) => {
    const results = {};
    const playerList = bet.participants || bet.players || [];

    if (playerList.length < 2) {
      playerList.forEach(player => { results[player] = 0; });
      return results;
    }

    const player1 = playerList[0];
    const player2 = playerList[1];

    results[player1] = 0;
    results[player2] = 0;

    let player1Wins = 0;
    let player2Wins = 0;
    let holesPlayed = 0;

    for (let hole = 0; hole < 18; hole++) {
      const score1 = scores[player1]?.[hole] || 0;
      const score2 = scores[player2]?.[hole] || 0;

      if (score1 === 0 || score2 === 0) continue;

      holesPlayed++;

      const adjustedScore1 = getAdjustedScore(player1, hole, score1);
      const adjustedScore2 = getAdjustedScore(player2, hole, score2);

      if (adjustedScore1 < adjustedScore2) {
        player1Wins++;
      } else if (adjustedScore2 < adjustedScore1) {
        player2Wins++;
      }
    }

    if (holesPlayed > 0) {
      const difference = player1Wins - player2Wins;
      const holesRemaining = 18 - holesPlayed;

      if (Math.abs(difference) > holesRemaining) {
        if (difference > 0) {
          results[player1] = bet.amount;
          results[player2] = -bet.amount;
        } else {
          results[player1] = -bet.amount;
          results[player2] = bet.amount;
        }
      } else if (holesPlayed === 18) {
        if (difference > 0) {
          results[player1] = bet.amount;
          results[player2] = -bet.amount;
        } else if (difference < 0) {
          results[player1] = -bet.amount;
          results[player2] = bet.amount;
        } else {
          results[player1] = 0;
          results[player2] = 0;
        }
      }
    }

    return results;
  }, [scores, getAdjustedScore]);

  const calculateNassauWinnings = useMemo(() => (bet) => {
    const results = {};
    const playerList = bet.participants || bet.players || [];

    playerList.forEach(player => { results[player] = 0; });

    if (playerList.length < 2) return results;

    const player1 = playerList[0];
    const player2 = playerList[1];

    const player1Front9 = scores[player1]?.slice(0, 9).reduce((sum, s) => sum + (s || 0), 0) || 0;
    const player2Front9 = scores[player2]?.slice(0, 9).reduce((sum, s) => sum + (s || 0), 0) || 0;

    const player1Back9 = scores[player1]?.slice(9, 18).reduce((sum, s) => sum + (s || 0), 0) || 0;
    const player2Back9 = scores[player2]?.slice(9, 18).reduce((sum, s) => sum + (s || 0), 0) || 0;

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
  }, [scores]);

  const calculateSkinsWinnings = useMemo(() => (bet) => {
    const results = {};
    const playerList = bet.participants || bet.players || [];

    playerList.forEach(player => { results[player] = 0; });

    if (playerList.length < 2) return results;

    const skinCount = {};
    playerList.forEach(player => { skinCount[player] = 0; });

    for (let hole = 0; hole < 18; hole++) {
      const allPlayed = playerList.every(player =>
        (scores[player]?.[hole] || 0) > 0,
      );
      if (!allPlayed) continue;

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

      if (bestPlayers.length === 1) {
        skinCount[bestPlayers[0]]++;
      }
    }

    const totalSkins = Object.values(skinCount).reduce((sum, count) => sum + count, 0);

    if (totalSkins > 0) {
      const potSize = bet.amount * playerList.length;
      const skinValue = potSize / totalSkins;

      playerList.forEach(player => {
        if (skinCount[player] > 0) {
          results[player] = Math.round(skinCount[player] * skinValue * 100) / 100;
        } else {
          results[player] = -bet.amount;
        }
      });
    }

    return results;
  }, [scores]);

  const calculateBingoBangoBongoWinnings = useMemo(() => (bet) => {
    const results = {};
    const playerList = bet.participants || bet.players || [];

    playerList.forEach(player => { results[player] = 0; });

    const points = {};
    playerList.forEach(player => { points[player] = 0; });

    playerList.forEach(player => {
      for (let hole = 0; hole < 18; hole++) {
        const score = scores[player]?.[hole] || 0;
        if (score === 0) continue;

        const par = courseData.par[hole];

        if (score < par) {
          points[player] += (par - score + 1);
        } else if (score === par) {
          points[player] += 0.5;
        }
      }
    });

    const totalPoints = Object.values(points).reduce((sum, p) => sum + p, 0);

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
  }, [scores, courseData.par]);

  // Memoize the calculation function map for performance
  const calculationMap = useMemo(() => ({
    'match': calculateMatchPlayWinnings,
    'nassau': calculateNassauWinnings,
    'skins': calculateSkinsWinnings,
    'bingo-bango-bongo': calculateBingoBangoBongoWinnings,
  }), [calculateMatchPlayWinnings, calculateNassauWinnings, calculateSkinsWinnings, calculateBingoBangoBongoWinnings]);

  const calculateBetWinningsTotal = useCallback((bet) => {
    if (!bet) {
      console.warn('Invalid bet data in calculateBetWinningsTotal: undefined bet');
      return {};
    }

    const playerList = bet.participants || bet.players;

    if (!playerList || !Array.isArray(playerList)) {
      console.warn('Invalid bet data in calculateBetWinningsTotal:', bet);
      return {};
    }

    // Early return if no scores
    const hasScores = playerList.some(player =>
      scores[player] && scores[player].some(score => score > 0),
    );

    if (!hasScores) {
      const playerResults = {};
      playerList.forEach(player => {
        playerResults[player] = 0;
      });
      return playerResults;
    }

    // Use calculation map for better performance
    const calculator = calculationMap[bet.type];
    if (calculator) {
      return calculator(bet);
    }

    // Default case
    const playerResults = {};
    playerList.forEach(player => {
      playerResults[player] = 0;
    });
    return playerResults;
  }, [scores, calculationMap]);

  return {
    calculateBetWinningsTotal,
    calculateMatchPlayWinnings,
    calculateNassauWinnings,
    calculateSkinsWinnings,
    calculateBingoBangoBongoWinnings,
  };
};
