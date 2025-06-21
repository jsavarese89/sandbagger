import React, { useState, useEffect } from 'react';

import { calculateGolfStats, calculateCourseHandicap, allocateHandicapStrokes } from '../utils/golfCalculations';

const GolfStatsTracker = ({ scores, players, course, onStatsUpdate }) => {
  const [detailedStats, setDetailedStats] = useState({});
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  useEffect(() => {
    if (scores && players.length > 0) {
      calculateAllStats();
    }
  }, [scores, players, course]);

  const calculateAllStats = () => {
    const newStats = {};

    players.forEach(player => {
      const playerScores = scores[player.name] || Array(18).fill(0);
      const handicapIndex = player.handicap || 0;

      // Calculate course handicap and stroke allocation
      const courseHandicap = calculateCourseHandicap(
        handicapIndex,
        course.slope || 113,
        course.rating || 72,
        course.par.reduce((sum, par) => sum + par, 0),
      );

      const strokesReceived = allocateHandicapStrokes(courseHandicap, course.handicap);

      // Calculate basic golf statistics
      const basicStats = calculateGolfStats(playerScores, course.par, strokesReceived);

      // Calculate advanced statistics
      const advancedStats = calculateAdvancedStats(playerScores, course.par, strokesReceived);

      newStats[player.name] = {
        ...basicStats,
        ...advancedStats,
        courseHandicap,
        strokesReceived,
      };
    });

    setDetailedStats(newStats);

    // Notify parent component of stats update
    if (onStatsUpdate) {
      onStatsUpdate(newStats);
    }
  };

  const calculateAdvancedStats = (scores, pars, strokesReceived) => {
    const stats = {
      frontNine: { score: 0, net: 0, par: 0 },
      backNine: { score: 0, net: 0, par: 0 },
      parBreakdown: { par3: { attempts: 0, pars: 0, birdies: 0 },
        par4: { attempts: 0, pars: 0, birdies: 0 },
        par5: { attempts: 0, pars: 0, birdies: 0 } },
      scoringAverage: 0,
      netScoringAverage: 0,
      bestHole: null,
      worstHole: null,
      consistency: 0,
      momentum: [],
    };

    let completedHoles = 0;
    let totalScore = 0;
    let totalNet = 0;
    const holeResults = [];

    for (let i = 0; i < 18; i++) {
      const score = scores[i];
      const par = pars[i];
      const strokes = strokesReceived[i] || 0;

      if (score === 0 || !score) continue;

      completedHoles++;
      totalScore += score;
      const netScore = Math.max(0, score - strokes);
      totalNet += netScore;

      // Front/Back nine breakdown
      if (i < 9) {
        stats.frontNine.score += score;
        stats.frontNine.net += netScore;
        stats.frontNine.par += par;
      } else {
        stats.backNine.score += score;
        stats.backNine.net += netScore;
        stats.backNine.par += par;
      }

      // Par breakdown
      const parKey = `par${par}`;
      if (stats.parBreakdown[parKey]) {
        stats.parBreakdown[parKey].attempts++;
        if (score === par) stats.parBreakdown[parKey].pars++;
        if (score < par) stats.parBreakdown[parKey].birdies++;
      }

      // Track hole performance for best/worst
      const scoreToPar = score - par;
      holeResults.push({ hole: i + 1, score, par, scoreToPar, net: netScore });
    }

    if (completedHoles > 0) {
      stats.scoringAverage = totalScore / completedHoles;
      stats.netScoringAverage = totalNet / completedHoles;

      // Find best and worst holes
      const sortedHoles = [...holeResults].sort((a, b) => a.scoreToPar - b.scoreToPar);
      stats.bestHole = sortedHoles[0];
      stats.worstHole = sortedHoles[sortedHoles.length - 1];

      // Calculate consistency (standard deviation of scores relative to par)
      const scoresToPar = holeResults.map(h => h.scoreToPar);
      const avgScoreToPar = scoresToPar.reduce((sum, s) => sum + s, 0) / scoresToPar.length;
      const variance = scoresToPar.reduce((sum, s) => sum + Math.pow(s - avgScoreToPar, 2), 0) / scoresToPar.length;
      stats.consistency = Math.sqrt(variance);

      // Calculate momentum (3-hole rolling average vs par)
      for (let i = 2; i < holeResults.length; i++) {
        const threeHoleAvg = (holeResults[i - 2].scoreToPar + holeResults[i - 1].scoreToPar + holeResults[i].scoreToPar) / 3;
        stats.momentum.push({ endingHole: holeResults[i].hole, average: threeHoleAvg });
      }
    }

    return stats;
  };

  const formatStat = (value, type = 'number', decimals = 1) => {
    if (value === null || value === undefined) return '-';

    switch (type) {
      case 'percentage':
        return `${Math.round(value)}%`;
      case 'decimal':
        return value.toFixed(decimals);
      case 'scoreToPar':
        if (value === 0) return 'E';
        return value > 0 ? `+${value}` : `${value}`;
      default:
        return typeof value === 'number' ? Math.round(value) : value;
    }
  };

  if (!detailedStats || Object.keys(detailedStats).length === 0) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="text-lg font-bold mb-4">Golf Statistics</h3>
        <p className="text-gray-500">Enter scores to see detailed statistics</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-bold mb-4">Golf Statistics</h3>

      {/* Player Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Select Player</label>
        <div className="flex flex-wrap gap-2">
          {players.map(player => (
            <button
              key={player.name}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPlayer === player.name
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setSelectedPlayer(selectedPlayer === player.name ? null : player.name)}
            >
              {player.name}
            </button>
          ))}
        </div>
      </div>

      {/* Statistics Display */}
      {selectedPlayer && detailedStats[selectedPlayer] ? (
        <div className="space-y-6">
          {(() => {
            const stats = detailedStats[selectedPlayer];

            return (
              <>
                {/* Basic Scoring */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Scoring Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Total Score</div>
                      <div className="text-xl font-bold">{stats.grossScore}</div>
                      <div className="text-sm text-gray-500">
                        {formatStat(stats.grossScore - stats.parTotal, 'scoreToPar')}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Net Score</div>
                      <div className="text-xl font-bold">{stats.netScore}</div>
                      <div className="text-sm text-gray-500">
                        {formatStat(stats.netScore - stats.parTotal, 'scoreToPar')}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Holes Played</div>
                      <div className="text-xl font-bold">{stats.totalHoles}</div>
                      <div className="text-sm text-gray-500">of 18</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Course Handicap</div>
                      <div className="text-xl font-bold">{stats.courseHandicap}</div>
                      <div className="text-sm text-gray-500">strokes</div>
                    </div>
                  </div>
                </div>

                {/* Scoring Breakdown */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Scoring Breakdown</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-sm text-green-700">Birdies+</div>
                      <div className="text-xl font-bold text-green-800">{stats.birdiesOrBetter}</div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-sm text-blue-700">Pars</div>
                      <div className="text-xl font-bold text-blue-800">{stats.pars}</div>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <div className="text-sm text-yellow-700">Bogeys</div>
                      <div className="text-xl font-bold text-yellow-800">{stats.bogeys}</div>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg">
                      <div className="text-sm text-red-700">Double+</div>
                      <div className="text-xl font-bold text-red-800">{stats.doubleBogeyOrWorse}</div>
                    </div>
                  </div>
                </div>

                {/* Front/Back Nine Comparison */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Nine Comparison</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Front 9</div>
                      <div className="text-lg font-bold">{stats.frontNine.score}</div>
                      <div className="text-sm text-gray-500">
                        Par {stats.frontNine.par} ({formatStat(stats.frontNine.score - stats.frontNine.par, 'scoreToPar')})
                      </div>
                      <div className="text-sm text-gray-500">
                        Net: {stats.frontNine.net}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Back 9</div>
                      <div className="text-lg font-bold">{stats.backNine.score}</div>
                      <div className="text-sm text-gray-500">
                        Par {stats.backNine.par} ({formatStat(stats.backNine.score - stats.backNine.par, 'scoreToPar')})
                      </div>
                      <div className="text-sm text-gray-500">
                        Net: {stats.backNine.net}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Par Performance */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Performance by Par</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {Object.entries(stats.parBreakdown).map(([parType, data]) => (
                      <div key={parType} className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-600 capitalize">{parType}</div>
                        <div className="text-lg font-bold">{data.attempts}</div>
                        <div className="text-xs text-gray-500">
                          {data.attempts > 0 && (
                            <>
                              {formatStat((data.pars / data.attempts) * 100, 'percentage')} pars
                              <br />
                              {formatStat((data.birdies / data.attempts) * 100, 'percentage')} birdies+
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Advanced Metrics */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Advanced Metrics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Scoring Average</div>
                      <div className="text-lg font-bold">{formatStat(stats.scoringAverage, 'decimal')}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Net Average</div>
                      <div className="text-lg font-bold">{formatStat(stats.netScoringAverage, 'decimal')}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Consistency</div>
                      <div className="text-lg font-bold">{formatStat(stats.consistency, 'decimal')}</div>
                      <div className="text-xs text-gray-500">Lower is better</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">GIR %</div>
                      <div className="text-lg font-bold">{formatStat(stats.girPercentage, 'percentage')}</div>
                    </div>
                    {stats.bestHole && (
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="text-sm text-green-700">Best Hole</div>
                        <div className="text-lg font-bold text-green-800">#{stats.bestHole.hole}</div>
                        <div className="text-xs text-gray-500">
                          {stats.bestHole.score} on par {stats.bestHole.par}
                        </div>
                      </div>
                    )}
                    {stats.worstHole && (
                      <div className="bg-red-50 p-3 rounded-lg">
                        <div className="text-sm text-red-700">Worst Hole</div>
                        <div className="text-lg font-bold text-red-800">#{stats.worstHole.hole}</div>
                        <div className="text-xs text-gray-500">
                          {stats.worstHole.score} on par {stats.worstHole.par}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Momentum Chart */}
                {stats.momentum.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Momentum (3-hole rolling average)</h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                        <span>Better</span>
                        <span>Worse</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {stats.momentum.map((point, index) => {
                          const color = point.average < -0.5 ? 'bg-green-500' :
                            point.average > 0.5 ? 'bg-red-500' : 'bg-yellow-500';
                          return (
                            <div
                              key={index}
                              className={`h-4 flex-1 ${color} rounded-sm`}
                              title={`Holes ${point.endingHole - 2}-${point.endingHole}: ${formatStat(point.average, 'decimal')} avg`}
                            />
                          );
                        })}
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Hole {stats.momentum[0]?.endingHole - 2}</span>
                        <span>Hole {stats.momentum[stats.momentum.length - 1]?.endingHole}</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">Select a player to view detailed statistics</p>
        </div>
      )}
    </div>
  );
};

export default GolfStatsTracker;
