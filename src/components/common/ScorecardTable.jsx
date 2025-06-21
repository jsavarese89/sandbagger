import React, { memo, useMemo } from 'react';

import ScoreCell from './ScoreCell';

const ScorecardTable = memo(({
  players,
  scores,
  course,
  updateScoreWithSync,
  view = 'full', // 'front-9', 'back-9', 'summary', 'full'
  calculateGrossScore,
  calculateNetScore,
  getStrokesGiven,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
}) => {

  const { holes, startHole, endHole, showNet } = useMemo(() => {
    switch (view) {
      case 'front-9':
        return { holes: 9, startHole: 0, endHole: 9, showNet: false };
      case 'back-9':
        return { holes: 9, startHole: 9, endHole: 18, showNet: false };
      case 'summary':
        return { holes: 0, startHole: 0, endHole: 0, showNet: true };
      default:
        return { holes: 18, startHole: 0, endHole: 18, showNet: true };
    }
  }, [view]);

  const tableEvents = useMemo(() => {
    if (view !== 'full') {
      return {
        onTouchStart,
        onTouchMove,
        onTouchEnd,
      };
    }
    return {};
  }, [view, onTouchStart, onTouchMove, onTouchEnd]);

  const renderSummaryTable = () => (
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
  );

  const renderHoleTable = () => (
    <table className="w-full border-collapse">
      <thead>
        <tr className="bg-gray-50">
          <th className="border px-2 py-2 text-left" style={{ minWidth: view === 'full' ? '120px' : 'auto' }}>
            Hole
          </th>
          {Array.from({ length: holes }, (_, i) => (
            <th key={i} className="border px-2 py-2 text-center hole-number" style={{ minWidth: '36px' }}>
              {startHole + i + 1}
            </th>
          ))}
          <th className="border px-2 py-2 text-center" style={{ minWidth: view === 'full' ? '80px' : '45px' }}>
            {view === 'front-9' ? 'F9' : view === 'back-9' ? 'B9' : 'Total'}
          </th>
        </tr>
        <tr className="bg-gray-100">
          <th className="border px-2 py-2 text-left">Par</th>
          {course.par.slice(startHole, endHole).map((par, i) => (
            <td key={i} className="border px-2 py-2 text-center">{par}</td>
          ))}
          <td className="border px-2 py-2 text-center font-bold total-score">
            {course.par.slice(startHole, endHole).reduce((sum, par) => sum + par, 0)}
          </td>
        </tr>
        <tr className="bg-gray-50">
          <th className="border px-2 py-2 text-left">{view === 'full' ? 'Handicap' : 'HCP'}</th>
          {course.handicap.slice(startHole, endHole).map((hcp, i) => (
            <td key={i} className="border px-2 py-2 text-center">{hcp}</td>
          ))}
          <td className="border px-2 py-2 text-center" />
        </tr>
      </thead>
      <tbody>
        {players.map((player, playerIndex) => (
          <tr key={player.name} className={playerIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
            <th className="border px-2 py-2 text-left">
              {view === 'full'
                ? `${player.name} (HCP: ${player.handicap})`
                : `${player.name.length > 8 ? `${player.name.slice(0, 6)}...` : player.name} (${player.handicap})`
              }
            </th>
            {Array.from({ length: holes }, (_, i) => (
              <ScoreCell
                key={i}
                value={scores[player.name]?.[startHole + i] || ''}
                onChange={(value) => updateScoreWithSync(player.name, startHole + i, value)}
                showStrokeDot={getStrokesGiven(player.name, startHole + i) > 0}
              />
            ))}
            <td className="border px-2 py-2 text-center font-bold total-score">
              {view === 'full'
                ? `${calculateGrossScore(player.name)} (${calculateNetScore(player.name)})`
                : calculateGrossScore(player.name, startHole, endHole)
              }
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const className = `scorecard ${view === 'full' ? 'scorecard-full' : 'scorecard-compact'} overflow-x-auto`;
  const style = view !== 'full' ? { display: 'block' } : {};

  return (
    <div className={className} style={style} {...tableEvents}>
      {view === 'summary' ? renderSummaryTable() : renderHoleTable()}
    </div>
  );
});

ScorecardTable.displayName = 'ScorecardTable';

export default ScorecardTable;
