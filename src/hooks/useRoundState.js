import { useState, useEffect, useCallback } from 'react';

import { createRound, getRound } from '../firebase';

export const useRoundState = (currentUser) => {
  const [players, setPlayers] = useState([]);
  const [roundId, setRoundId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const loadExistingRound = useCallback(async (id) => {
    try {
      setLoading(true);
      const roundData = await getRound(id);
      setPlayers(roundData.players || []);
      setRoundId(id);
    } catch (error) {
      console.error('Error loading round:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const startNewRound = useCallback(async () => {
    if (players.length === 0) {
      alert('Please add at least one player');
      return null;
    }

    try {
      setLoading(true);

      const scores = {};
      players.forEach(player => {
        scores[player.name] = Array(18).fill(0);
      });

      const courseData = selectedCourse ? {
        name: selectedCourse.name,
        par: selectedCourse.pars || [4, 5, 3, 4, 4, 5, 3, 4, 4, 4, 5, 3, 4, 4, 5, 3, 4, 4],
        handicap: selectedCourse.handicaps || [7, 1, 15, 5, 11, 3, 17, 13, 9, 8, 2, 16, 6, 12, 4, 18, 14, 10],
        city: selectedCourse.city,
        state: selectedCourse.state,
      } : {
        name: 'Sample Golf Course',
        par: [4, 5, 3, 4, 4, 5, 3, 4, 4, 4, 5, 3, 4, 4, 5, 3, 4, 4],
        handicap: [7, 1, 15, 5, 11, 3, 17, 13, 9, 8, 2, 16, 6, 12, 4, 18, 14, 10],
      };

      const id = await createRound({
        players,
        scores,
        bets: [],
        createdBy: currentUser ? currentUser.uid : null,
        playerIds: currentUser ? players.reduce((acc, player) => {
          acc[player.name] = currentUser.uid;
          return acc;
        }, {}) : {},
        course: courseData,
        courseName: courseData.name,
        date: new Date().toISOString(),
        playerUids: currentUser ? [currentUser.uid] : [],
      });

      setRoundId(id);
      return id;
    } catch (error) {
      console.error('Error starting new round:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [players, selectedCourse, currentUser]);

  // Save roundId to localStorage when it changes
  useEffect(() => {
    if (roundId) {
      localStorage.setItem('currentRoundId', roundId);
    }
  }, [roundId]);

  // Load roundId from localStorage on startup
  useEffect(() => {
    const savedRoundId = localStorage.getItem('currentRoundId');
    if (savedRoundId && !roundId && currentUser) {
      loadExistingRound(savedRoundId);
    }
  }, [loadExistingRound, roundId, currentUser]);

  const clearRound = useCallback(() => {
    localStorage.removeItem('currentRoundId');
    setRoundId(null);
  }, []);

  return {
    players,
    setPlayers,
    roundId,
    setRoundId,
    loading,
    selectedCourse,
    setSelectedCourse,
    loadExistingRound,
    startNewRound,
    clearRound,
  };
};
