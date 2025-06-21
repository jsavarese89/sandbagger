import { getFirestore, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import React, { useState, useEffect } from 'react';

import { useAuth } from '../contexts/AuthContext';

const RoundHistory = () => {
  const { currentUser } = useAuth();
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRound, setSelectedRound] = useState(null);
  const [chartData, setChartData] = useState({
    scores: [],
    dates: [],
    courses: [],
  });
  const [timeRange, setTimeRange] = useState('all');

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
          orderBy('date', 'desc'),
        );

        const querySnapshot = await getDocs(q);
        const roundsData = [];

        querySnapshot.forEach((doc) => {
          roundsData.push({ id: doc.id, ...doc.data() });
        });

        setRounds(roundsData);
        prepareChartData(roundsData);
      } catch (error) {
        console.error('Error fetching rounds:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRounds();
  }, [currentUser]);

  const prepareChartData = (roundsData) => {
    // Filter rounds based on time range
    const now = new Date();
    const filtered = roundsData.filter(round => {
      const roundDate = new Date(round.date);

      switch (timeRange) {
        case '30days':
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(now.getDate() - 30);
          return roundDate >= thirtyDaysAgo;
        case '90days':
          const ninetyDaysAgo = new Date();
          ninetyDaysAgo.setDate(now.getDate() - 90);
          return roundDate >= ninetyDaysAgo;
        case '1year':
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(now.getFullYear() - 1);
          return roundDate >= oneYearAgo;
        case 'all':
        default:
          return true;
      }
    });

    // Sort by date (ascending)
    const sorted = [...filtered].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Extract data for the chart
    const scores = [];
    const dates = [];
    const courses = [];

    sorted.forEach(round => {
      // Find the current user's scores
      const playerName = Object.keys(round.scores || {}).find(name =>
        round.playerIds && round.playerIds[name] === currentUser.uid,
      ) || currentUser.displayName;

      const playerScores = round.scores?.[playerName] || [];

      // Calculate total score if we have complete data
      if (playerScores.length > 0 && playerScores.filter(s => s > 0).length === playerScores.length) {
        const totalScore = playerScores.reduce((sum, score) => sum + score, 0);
        scores.push(totalScore);
        dates.push(new Date(round.date).toLocaleDateString());
        courses.push(round.courseName || 'Unknown Course');
      }
    });

    setChartData({ scores, dates, courses });
  };

  useEffect(() => {
    if (rounds.length > 0) {
      prepareChartData(rounds);
    }
  }, [timeRange, rounds]);

  const renderScoreChart = () => {
    if (chartData.scores.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No complete rounds found in the selected time period
        </div>
      );
    }

    const maxScore = Math.max(...chartData.scores) + 5;
    const minScore = Math.max(0, Math.min(...chartData.scores) - 5);
    const range = maxScore - minScore;

    // Calculate moving average
    const movingAverage = [];
    const windowSize = 3;

    for (let i = 0; i < chartData.scores.length; i++) {
      if (i < windowSize - 1) {
        movingAverage.push(null);
      } else {
        let sum = 0;
        for (let j = 0; j < windowSize; j++) {
          sum += chartData.scores[i - j];
        }
        movingAverage.push(Math.round(sum / windowSize * 10) / 10);
      }
    }

    return (
      <div className="mt-4">
        <h3 className="text-lg font-medium mb-2">Score Trend</h3>

        <div className="relative h-64 mt-4">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-0 w-10 flex flex-col justify-between text-xs text-gray-500">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i}>{Math.round(maxScore - (range * i / 5))}</div>
            ))}
          </div>

          {/* Chart area */}
          <div className="absolute left-10 right-0 top-0 bottom-0">
            {/* Horizontal grid lines */}
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="absolute left-0 right-0 border-t border-gray-200"
                style={{ top: `${(i * 100) / 5}%` }}
              />
            ))}

            {/* Data points and lines */}
            <svg className="absolute inset-0 w-full h-full">
              {/* Score line */}
              <polyline
                points={chartData.scores.map((score, i) => {
                  const x = (i / (chartData.scores.length - 1)) * 100;
                  const y = 100 - ((score - minScore) / range) * 100;
                  return `${x}%,${y}%`;
                }).join(' ')}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
              />

              {/* Moving average line */}
              <polyline
                points={movingAverage.map((avg, i) => {
                  if (avg === null) return '';
                  const x = (i / (chartData.scores.length - 1)) * 100;
                  const y = 100 - ((avg - minScore) / range) * 100;
                  return `${x}%,${y}%`;
                }).filter(p => p).join(' ')}
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeDasharray="4"
              />

              {/* Data points */}
              {chartData.scores.map((score, i) => {
                const x = (i / (chartData.scores.length - 1)) * 100;
                const y = 100 - ((score - minScore) / range) * 100;

                return (
                  <circle
                    key={i}
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r="4"
                    fill="#3b82f6"
                    stroke="white"
                    strokeWidth="2"
                    className="cursor-pointer hover:r-5"
                    onClick={() => setSelectedRound(i)}
                  />
                );
              })}
            </svg>
          </div>
        </div>

        {/* X-axis labels */}
        <div className="relative h-20 ml-10">
          <div className="absolute inset-0 flex justify-between text-xs text-gray-500">
            {chartData.dates.map((date, i) => (
              <div
                key={i}
                className="text-center transform -rotate-45 origin-top-left"
                style={{
                  position: 'absolute',
                  left: `${(i / (chartData.dates.length - 1)) * 100}%`,
                  top: 0,
                }}
              >
                {date}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center space-x-6 mt-8">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 mr-2" />
            <span className="text-sm">Score</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-1 bg-red-500 mr-2" />
            <span className="text-sm">3-Round Average</span>
          </div>
        </div>

        {/* Selected round details */}
        {selectedRound !== null && (
          <div className="mt-4 p-3 bg-gray-50 border rounded-lg">
            <h4 className="font-medium">{chartData.courses[selectedRound]}</h4>
            <div className="flex justify-between">
              <div className="text-sm">{chartData.dates[selectedRound]}</div>
              <div className="font-medium">{chartData.scores[selectedRound]}</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderScoreDistribution = () => {
    if (chartData.scores.length === 0) return null;

    // Calculate score distribution
    const distribution = {};
    let minScore = Infinity;
    let maxScore = -Infinity;

    chartData.scores.forEach(score => {
      distribution[score] = (distribution[score] || 0) + 1;
      minScore = Math.min(minScore, score);
      maxScore = Math.max(maxScore, score);
    });

    // Create array of all scores in range
    const scoreRange = [];
    for (let i = minScore; i <= maxScore; i++) {
      scoreRange.push(i);
    }

    // Find max count for scaling
    const maxCount = Math.max(...Object.values(distribution));

    return (
      <div className="mt-8">
        <h3 className="text-lg font-medium mb-2">Score Distribution</h3>

        <div className="relative h-40 mt-4">
          {/* Bars */}
          <div className="absolute inset-0 flex items-end">
            {scoreRange.map(score => {
              const count = distribution[score] || 0;
              const height = count > 0 ? (count / maxCount) * 100 : 0;

              return (
                <div
                  key={score}
                  className="relative flex-1 mx-1"
                >
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-blue-500 hover:bg-blue-600 transition-all cursor-pointer"
                    style={{ height: `${height}%` }}
                    title={`${score}: ${count} round${count !== 1 ? 's' : ''}`}
                  />
                  <div className="absolute -bottom-6 left-0 right-0 text-center text-xs">
                    {score}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="h-6" /> {/* Spacer for labels */}

        <div className="text-center text-sm mt-4">
          Average: {
            Math.round(
              (chartData.scores.reduce((sum, score) => sum + score, 0) / chartData.scores.length) * 10,
            ) / 10
          }
        </div>
      </div>
    );
  };

  const renderParPerformance = () => {
    if (rounds.length === 0) return null;

    // Collect all par performances
    const parPerformances = [];

    rounds.forEach(round => {
      const pars = round.pars || Array(18).fill(4);

      // Find the current user's scores
      const playerName = Object.keys(round.scores || {}).find(name =>
        round.playerIds && round.playerIds[name] === currentUser.uid,
      ) || currentUser.displayName;

      const playerScores = round.scores?.[playerName] || [];

      // Count performance on each hole
      playerScores.forEach((score, index) => {
        if (score > 0 && index < pars.length) {
          const par = pars[index];
          const performance = score - par;

          parPerformances.push(performance);
        }
      });
    });

    if (parPerformances.length === 0) return null;

    // Count occurrences
    const counts = {
      eagle: parPerformances.filter(p => p <= -2).length,
      birdie: parPerformances.filter(p => p === -1).length,
      par: parPerformances.filter(p => p === 0).length,
      bogey: parPerformances.filter(p => p === 1).length,
      doubleBogey: parPerformances.filter(p => p === 2).length,
      worse: parPerformances.filter(p => p > 2).length,
    };

    const total = parPerformances.length;

    return (
      <div className="mt-8">
        <h3 className="text-lg font-medium mb-2">Par Performance</h3>

        <div className="flex h-8 rounded-lg overflow-hidden">
          <div
            className="bg-indigo-500"
            style={{ width: `${(counts.eagle / total) * 100}%` }}
            title={`Eagle or Better: ${counts.eagle} (${Math.round((counts.eagle / total) * 100)}%)`}
          />
          <div
            className="bg-green-500"
            style={{ width: `${(counts.birdie / total) * 100}%` }}
            title={`Birdie: ${counts.birdie} (${Math.round((counts.birdie / total) * 100)}%)`}
          />
          <div
            className="bg-blue-500"
            style={{ width: `${(counts.par / total) * 100}%` }}
            title={`Par: ${counts.par} (${Math.round((counts.par / total) * 100)}%)`}
          />
          <div
            className="bg-yellow-500"
            style={{ width: `${(counts.bogey / total) * 100}%` }}
            title={`Bogey: ${counts.bogey} (${Math.round((counts.bogey / total) * 100)}%)`}
          />
          <div
            className="bg-orange-500"
            style={{ width: `${(counts.doubleBogey / total) * 100}%` }}
            title={`Double Bogey: ${counts.doubleBogey} (${Math.round((counts.doubleBogey / total) * 100)}%)`}
          />
          <div
            className="bg-red-500"
            style={{ width: `${(counts.worse / total) * 100}%` }}
            title={`Triple Bogey or Worse: ${counts.worse} (${Math.round((counts.worse / total) * 100)}%)`}
          />
        </div>

        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <div>{Math.round((counts.eagle / total) * 100)}% Eagle+</div>
          <div>{Math.round((counts.birdie / total) * 100)}% Birdie</div>
          <div>{Math.round((counts.par / total) * 100)}% Par</div>
          <div>{Math.round((counts.bogey / total) * 100)}% Bogey</div>
          <div>{Math.round((counts.doubleBogey / total) * 100)}% Double</div>
          <div>{Math.round((counts.worse / total) * 100)}% Triple+</div>
        </div>
      </div>
    );
  };

  if (!currentUser) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <p className="text-center py-4">Please sign in to view your round history</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Round History</h2>
        <p className="text-center py-4">Loading your rounds...</p>
      </div>
    );
  }

  if (rounds.length === 0) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Round History</h2>
        <p className="text-center py-4">No rounds found. Start playing to see your history!</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Round History</h2>

      <div className="flex space-x-2 mb-4">
        <button
          className={`px-3 py-1 rounded-lg text-sm ${timeRange === 'all' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}
          onClick={() => setTimeRange('all')}
        >
          All Time
        </button>
        <button
          className={`px-3 py-1 rounded-lg text-sm ${timeRange === '1year' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}
          onClick={() => setTimeRange('1year')}
        >
          Past Year
        </button>
        <button
          className={`px-3 py-1 rounded-lg text-sm ${timeRange === '90days' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}
          onClick={() => setTimeRange('90days')}
        >
          90 Days
        </button>
        <button
          className={`px-3 py-1 rounded-lg text-sm ${timeRange === '30days' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}
          onClick={() => setTimeRange('30days')}
        >
          30 Days
        </button>
      </div>

      {renderScoreChart()}
      {renderScoreDistribution()}
      {renderParPerformance()}

      <div className="mt-8">
        <h3 className="text-lg font-medium mb-2">Recent Rounds</h3>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-3 text-left">Date</th>
                <th className="py-2 px-3 text-left">Course</th>
                <th className="py-2 px-3 text-right">Score</th>
                <th className="py-2 px-3 text-right">Handicap</th>
              </tr>
            </thead>
            <tbody>
              {rounds.slice(0, 5).map((round) => {
                // Find the current user's scores
                const playerName = Object.keys(round.scores || {}).find(name =>
                  round.playerIds && round.playerIds[name] === currentUser.uid,
                ) || currentUser.displayName;

                const playerScores = round.scores?.[playerName] || [];
                const totalScore = playerScores.reduce((sum, score) => sum + score, 0);
                const handicap = round.playerHandicaps?.[playerName] || 'N/A';

                return (
                  <tr key={round.id} className="border-t hover:bg-gray-50">
                    <td className="py-2 px-3">
                      {new Date(round.date).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-3">{round.courseName || 'Unknown Course'}</td>
                    <td className="py-2 px-3 text-right">{totalScore || 'In Progress'}</td>
                    <td className="py-2 px-3 text-right">{handicap}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RoundHistory;
