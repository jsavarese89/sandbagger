import { getFirestore, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import React, { useState, useEffect } from 'react';

import { useAuth } from '../contexts/AuthContext';

const StatsTracker = () => {
  const { currentUser } = useAuth();
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRounds: 0,
    averageScore: 0,
    bestScore: 0,
    worstScore: 0,
    parThrees: { total: 0, birdieOrBetter: 0, par: 0, bogey: 0, doublePlus: 0 },
    parFours: { total: 0, birdieOrBetter: 0, par: 0, bogey: 0, doublePlus: 0 },
    parFives: { total: 0, birdieOrBetter: 0, par: 0, bogey: 0, doublePlus: 0 },
    fairwaysHit: { hit: 0, total: 0, percentage: 0 },
    greensInRegulation: { hit: 0, total: 0, percentage: 0 },
    puttsPerRound: 0,
    scoreByHole: Array(18).fill(0),
    recentScores: [],
  });

  useEffect(() => {
    const fetchRounds = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        const db = getFirestore();
        const roundsRef = collection(db, 'rounds');
        const q = query(
          roundsRef,
          where('players', 'array-contains', currentUser.uid),
          orderBy('createdAt', 'desc'),
        );

        const querySnapshot = await getDocs(q);
        const roundsData = [];

        querySnapshot.forEach((doc) => {
          roundsData.push({ id: doc.id, ...doc.data() });
        });

        setRounds(roundsData);
        calculateStats(roundsData);
      } catch (error) {
        console.error('Error fetching rounds:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRounds();
  }, [currentUser]);

  const calculateStats = (roundsData) => {
    if (roundsData.length === 0) return;

    const playerScores = roundsData.map(round => {
      const playerName = Object.keys(round.scores).find(name =>
        round.playerIds && round.playerIds[name] === currentUser.uid,
      ) || currentUser.displayName;

      return {
        date: round.createdAt?.toDate() || new Date(),
        courseName: round.courseName,
        scores: round.scores[playerName] || [],
        pars: round.pars || [],
        fairwaysHit: round.fairwaysHit?.[playerName] || [],
        greensInRegulation: round.greensInRegulation?.[playerName] || [],
        putts: round.putts?.[playerName] || [],
      };
    });

    // Calculate total and average scores
    const completedRounds = playerScores.filter(round =>
      round.scores.filter(s => s > 0).length === round.pars.length,
    );

    const totalRounds = completedRounds.length;

    if (totalRounds === 0) {
      setStats({
        ...stats,
        totalRounds: 0,
        recentScores: [],
      });
      return;
    }

    const totalScores = completedRounds.map(round =>
      round.scores.reduce((sum, score) => sum + score, 0),
    );

    const averageScore = Math.round(totalScores.reduce((sum, score) => sum + score, 0) / totalRounds);
    const bestScore = Math.min(...totalScores);
    const worstScore = Math.max(...totalScores);

    // Calculate par performance
    const parThrees = { total: 0, birdieOrBetter: 0, par: 0, bogey: 0, doublePlus: 0 };
    const parFours = { total: 0, birdieOrBetter: 0, par: 0, bogey: 0, doublePlus: 0 };
    const parFives = { total: 0, birdieOrBetter: 0, par: 0, bogey: 0, doublePlus: 0 };

    completedRounds.forEach(round => {
      round.scores.forEach((score, index) => {
        if (score === 0) return;

        const par = round.pars[index] || 4;
        const scoreToPar = score - par;

        if (par === 3) {
          parThrees.total++;
          if (scoreToPar <= -1) parThrees.birdieOrBetter++;
          else if (scoreToPar === 0) parThrees.par++;
          else if (scoreToPar === 1) parThrees.bogey++;
          else parThrees.doublePlus++;
        } else if (par === 4) {
          parFours.total++;
          if (scoreToPar <= -1) parFours.birdieOrBetter++;
          else if (scoreToPar === 0) parFours.par++;
          else if (scoreToPar === 1) parFours.bogey++;
          else parFours.doublePlus++;
        } else if (par === 5) {
          parFives.total++;
          if (scoreToPar <= -1) parFives.birdieOrBetter++;
          else if (scoreToPar === 0) parFives.par++;
          else if (scoreToPar === 1) parFives.bogey++;
          else parFives.doublePlus++;
        }
      });
    });

    // Calculate fairways and greens
    const fairwaysHit = { hit: 0, total: 0, percentage: 0 };
    const greensInRegulation = { hit: 0, total: 0, percentage: 0 };
    let totalPutts = 0;
    let puttRounds = 0;

    completedRounds.forEach(round => {
      if (round.fairwaysHit && round.fairwaysHit.length > 0) {
        const validFairways = round.fairwaysHit.filter(f => f !== null && f !== undefined);
        fairwaysHit.hit += validFairways.filter(f => f === true).length;
        fairwaysHit.total += validFairways.length;
      }

      if (round.greensInRegulation && round.greensInRegulation.length > 0) {
        const validGreens = round.greensInRegulation.filter(g => g !== null && g !== undefined);
        greensInRegulation.hit += validGreens.filter(g => g === true).length;
        greensInRegulation.total += validGreens.length;
      }

      if (round.putts && round.putts.length > 0) {
        const validPutts = round.putts.filter(p => p > 0);
        if (validPutts.length > 0) {
          totalPutts += validPutts.reduce((sum, putts) => sum + putts, 0);
          puttRounds++;
        }
      }
    });

    fairwaysHit.percentage = fairwaysHit.total > 0
      ? Math.round((fairwaysHit.hit / fairwaysHit.total) * 100)
      : 0;

    greensInRegulation.percentage = greensInRegulation.total > 0
      ? Math.round((greensInRegulation.hit / greensInRegulation.total) * 100)
      : 0;

    const puttsPerRound = puttRounds > 0
      ? Math.round((totalPutts / puttRounds) * 10) / 10
      : 0;

    // Calculate score by hole (1-18)
    const scoreByHole = Array(18).fill(0);
    const holeCount = Array(18).fill(0);

    completedRounds.forEach(round => {
      round.scores.forEach((score, index) => {
        if (score > 0 && index < 18) {
          scoreByHole[index] += score;
          holeCount[index]++;
        }
      });
    });

    for (let i = 0; i < 18; i++) {
      if (holeCount[i] > 0) {
        scoreByHole[i] = Math.round((scoreByHole[i] / holeCount[i]) * 10) / 10;
      }
    }

    // Get recent scores (last 10)
    const recentScores = completedRounds
      .slice(0, 10)
      .map(round => ({
        date: round.date,
        courseName: round.courseName,
        totalScore: round.scores.reduce((sum, score) => sum + score, 0),
        totalPar: round.pars.reduce((sum, par) => sum + par, 0),
      }));

    setStats({
      totalRounds,
      averageScore,
      bestScore,
      worstScore,
      parThrees,
      parFours,
      parFives,
      fairwaysHit,
      greensInRegulation,
      puttsPerRound,
      scoreByHole,
      recentScores,
    });
  };

  const renderPerformanceChart = (data) => {
    const { total } = data;
    if (total === 0) return null;

    return (
      <div className="flex h-8 rounded-lg overflow-hidden">
        <div
          className="bg-green-500"
          style={{ width: `${(data.birdieOrBetter / total) * 100}%` }}
          title={`Birdie or Better: ${data.birdieOrBetter} (${Math.round((data.birdieOrBetter / total) * 100)}%)`}
        />
        <div
          className="bg-blue-500"
          style={{ width: `${(data.par / total) * 100}%` }}
          title={`Par: ${data.par} (${Math.round((data.par / total) * 100)}%)`}
        />
        <div
          className="bg-yellow-500"
          style={{ width: `${(data.bogey / total) * 100}%` }}
          title={`Bogey: ${data.bogey} (${Math.round((data.bogey / total) * 100)}%)`}
        />
        <div
          className="bg-red-500"
          style={{ width: `${(data.doublePlus / total) * 100}%` }}
          title={`Double Bogey or Worse: ${data.doublePlus} (${Math.round((data.doublePlus / total) * 100)}%)`}
        />
      </div>
    );
  };

  if (loading) {
    return <div className="p-4 text-center">Loading your stats...</div>;
  }

  if (stats.totalRounds === 0) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Golf Statistics</h2>
        <p className="text-center py-6">No completed rounds found. Play some golf to see your stats!</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Golf Statistics</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 p-3 rounded-lg">
          <h3 className="font-medium text-gray-700">Rounds Played</h3>
          <p className="text-2xl font-bold">{stats.totalRounds}</p>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg">
          <h3 className="font-medium text-gray-700">Average Score</h3>
          <p className="text-2xl font-bold">{stats.averageScore}</p>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg">
          <h3 className="font-medium text-gray-700">Best Round</h3>
          <p className="text-2xl font-bold">{stats.bestScore}</p>
        </div>
      </div>

      <h3 className="font-semibold text-lg mb-2">Scoring by Par</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <div className="flex justify-between mb-1">
            <span>Par 3s ({stats.parThrees.total} holes)</span>
            <span className="font-medium">
              {stats.parThrees.total > 0 ?
                (stats.parThrees.birdieOrBetter + stats.parThrees.par + stats.parThrees.bogey + stats.parThrees.doublePlus) / stats.parThrees.total : 0}
            </span>
          </div>
          {renderPerformanceChart(stats.parThrees)}
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <span>Par 4s ({stats.parFours.total} holes)</span>
            <span className="font-medium">
              {stats.parFours.total > 0 ?
                (stats.parFours.birdieOrBetter + stats.parFours.par + stats.parFours.bogey + stats.parFours.doublePlus) / stats.parFours.total : 0}
            </span>
          </div>
          {renderPerformanceChart(stats.parFours)}
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <span>Par 5s ({stats.parFives.total} holes)</span>
            <span className="font-medium">
              {stats.parFives.total > 0 ?
                (stats.parFives.birdieOrBetter + stats.parFives.par + stats.parFives.bogey + stats.parFives.doublePlus) / stats.parFives.total : 0}
            </span>
          </div>
          {renderPerformanceChart(stats.parFives)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 p-3 rounded-lg">
          <h3 className="font-medium text-gray-700">Fairways Hit</h3>
          <p className="text-2xl font-bold">{stats.fairwaysHit.percentage}%</p>
          <p className="text-sm text-gray-500">{stats.fairwaysHit.hit} of {stats.fairwaysHit.total}</p>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg">
          <h3 className="font-medium text-gray-700">Greens in Regulation</h3>
          <p className="text-2xl font-bold">{stats.greensInRegulation.percentage}%</p>
          <p className="text-sm text-gray-500">{stats.greensInRegulation.hit} of {stats.greensInRegulation.total}</p>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg">
          <h3 className="font-medium text-gray-700">Putts per Round</h3>
          <p className="text-2xl font-bold">{stats.puttsPerRound}</p>
        </div>
      </div>

      <h3 className="font-semibold text-lg mb-2">Recent Rounds</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-3 text-left">Date</th>
              <th className="py-2 px-3 text-left">Course</th>
              <th className="py-2 px-3 text-right">Score</th>
              <th className="py-2 px-3 text-right">+/-</th>
            </tr>
          </thead>
          <tbody>
            {stats.recentScores.map((round, index) => (
              <tr key={index} className="border-t hover:bg-gray-50">
                <td className="py-2 px-3">
                  {round.date.toLocaleDateString()}
                </td>
                <td className="py-2 px-3">{round.courseName}</td>
                <td className="py-2 px-3 text-right">{round.totalScore}</td>
                <td className="py-2 px-3 text-right">
                  {round.totalScore - round.totalPar > 0 ?
                    `+${round.totalScore - round.totalPar}` :
                    round.totalScore - round.totalPar}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StatsTracker;
