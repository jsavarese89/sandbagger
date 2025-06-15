import React, { useState, useEffect } from 'react';
import ScoreInput from './ScoreInput';
import HoleInfo from './HoleInfo';
import BetTracker from './BetTracker';
import ShareRound from './ShareRound';
import { subscribeToRound, updateScore } from '../firebase';

const defaultCourse = {
  name: 'Sample Golf Course',
  par: [4, 5, 3, 4, 4, 5, 3, 4, 4, 4, 5, 3, 4, 4, 5, 3, 4, 4],
  handicap: [7, 1, 15, 5, 11, 3, 17, 13, 9, 8, 2, 16, 6, 12, 4, 18, 14, 10]
};

function Scorecard({ players, roundId, course = defaultCourse, isConnected }) {
  const [scores, setScores] = useState({});
  const [bets, setBets] = useState([]);
  const [currentView, setCurrentView] = useState('front-9');
  const [viewIndex, setViewIndex] = useState(0);
  const viewSequence = ['front-9', 'back-9', 'total-view'];
  const [loading, setLoading] = useState(false);

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
      const newScores = {...prev};
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
    setBets(prev => [...prev, bet]);
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">{course.name} Scorecard</h2>
        
        {isConnected !== undefined && (
          <div className={`sync-indicator ${isConnected ? 'online' : 'offline'}`}>
            <span className={`sync-dot ${isConnected ? 'online' : 'offline'}`}></span>
            <span>{isConnected ? 'Online' : 'Offline'}</span>
          </div>
        )}
      </div>
      
      <div className="scorecard-nav">
        <button className="scorecard-nav-btn" onClick={showPrevView}>← {viewIndex === 0 ? 'Summary' : 'Front 9'}</button>
        <span className="scorecard-view-label">
          {currentView === 'front-9' ? 'Front 9' : 
           currentView === 'back-9' ? 'Back 9' : 'Summary'}
        </span>
        <button className="scorecard-nav-btn" onClick={showNextView}>{viewIndex === 2 ? 'Front 9' : 'Back 9'} →</button>
      </div>
      
      {/* Mobile compact view - Front 9 */}
      <div className="scorecard scorecard-compact" style={{ display: currentView === 'front-9' ? 'block' : 'none' }}>
        <table>
          <thead>
            <tr>
              <th>Hole</th>
              {Array.from({length: 9}, (_, i) => (
                <th key={i} className="hole-number">{i + 1}</th>
              ))}
              <th>F9</th>
            </tr>
            <tr>
              <th>Par</th>
              {course.par.slice(0, 9).map((par, i) => (
                <td key={i}>{par}</td>
              ))}
              <td className="total-score">
                {course.par.slice(0, 9).reduce((sum, par) => sum + par, 0)}
              </td>
            </tr>
            <tr>
              <th>HCP</th>
              {course.handicap.slice(0, 9).map((hcp, i) => (
                <td key={i}>{hcp}</td>
              ))}
              <td></td>
            </tr>
          </thead>
          <tbody>
            {players.map((player) => (
              <tr key={player.name}>
                <th>{player.name.length > 8 ? player.name.slice(0, 6) + '...' : player.name} ({player.handicap})</th>
                {Array.from({length: 9}, (_, i) => (
                  <td key={i} style={{ position: 'relative' }}>
                    <ScoreInput 
                      value={scores[player.name]?.[i] || ''}
                      onChange={(value) => updateScoreWithSync(player.name, i, value)}
                    />
                    {getStrokesGiven(player.name, i) > 0 && (
                      <span className="strokes-dot">•</span>
                    )}
                  </td>
                ))}
                <td className="total-score">{calculateGrossScore(player.name, 0, 9)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Mobile compact view - Back 9 */}
      <div className="scorecard scorecard-compact" style={{ display: currentView === 'back-9' ? 'block' : 'none' }}>
        <table>
          <thead>
            <tr>
              <th>Hole</th>
              {Array.from({length: 9}, (_, i) => (
                <th key={i} className="hole-number">{i + 10}</th>
              ))}
              <th>B9</th>
            </tr>
            <tr>
              <th>Par</th>
              {course.par.slice(9, 18).map((par, i) => (
                <td key={i}>{par}</td>
              ))}
              <td className="total-score">
                {course.par.slice(9, 18).reduce((sum, par) => sum + par, 0)}
              </td>
            </tr>
            <tr>
              <th>HCP</th>
              {course.handicap.slice(9, 18).map((hcp, i) => (
                <td key={i}>{hcp}</td>
              ))}
              <td></td>
            </tr>
          </thead>
          <tbody>
            {players.map((player) => (
              <tr key={player.name}>
                <th>{player.name.length > 8 ? player.name.slice(0, 6) + '...' : player.name} ({player.handicap})</th>
                {Array.from({length: 9}, (_, i) => (
                  <td key={i} style={{ position: 'relative' }}>
                    <ScoreInput 
                      value={scores[player.name]?.[i + 9] || ''}
                      onChange={(value) => updateScoreWithSync(player.name, i + 9, value)}
                    />
                    {getStrokesGiven(player.name, i + 9) > 0 && (
                      <span className="strokes-dot">•</span>
                    )}
                  </td>
                ))}
                <td className="total-score">{calculateGrossScore(player.name, 9, 18)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Mobile view - Summary */}
      <div className="scorecard scorecard-compact" style={{ display: currentView === 'total-view' ? 'block' : 'none' }}>
        <table>
          <thead>
            <tr>
              <th>Player</th>
              <th>F9</th>
              <th>B9</th>
              <th>Total</th>
              <th>Net</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player) => (
              <tr key={player.name}>
                <th>{player.name}</th>
                <td>{calculateGrossScore(player.name, 0, 9)}</td>
                <td>{calculateGrossScore(player.name, 9, 18)}</td>
                <td className="total-score">{calculateGrossScore(player.name)}</td>
                <td className="total-score">{calculateNetScore(player.name)}</td>
              </tr>
            ))}
            <tr>
              <th>Par</th>
              <td>{course.par.slice(0, 9).reduce((sum, par) => sum + par, 0)}</td>
              <td>{course.par.slice(9, 18).reduce((sum, par) => sum + par, 0)}</td>
              <td className="total-score">{course.par.reduce((sum, par) => sum + par, 0)}</td>
              <td>-</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      {/* Full desktop view */}
      <div className="scorecard scorecard-full">
        <table>
          <thead>
            <tr>
              <th>Hole</th>
              {Array.from({length: 18}, (_, i) => (
                <th key={i} className="hole-number">{i + 1}</th>
              ))}
              <th>Total</th>
            </tr>
            <tr>
              <th>Par</th>
              {course.par.map((par, i) => (
                <td key={i}>{par}</td>
              ))}
              <td className="total-score">
                {course.par.reduce((sum, par) => sum + par, 0)}
              </td>
            </tr>
            <tr>
              <th>Handicap</th>
              {course.handicap.map((hcp, i) => (
                <td key={i}>{hcp}</td>
              ))}
              <td></td>
            </tr>
          </thead>
          <tbody>
            {players.map((player) => (
              <tr key={player.name}>
                <th>
                  {player.name} (HCP: {player.handicap})
                </th>
                {Array.from({length: 18}, (_, i) => (
                  <td key={i} style={{ position: 'relative' }}>
                    <ScoreInput 
                      value={scores[player.name]?.[i] || ''}
                      onChange={(value) => updateScoreWithSync(player.name, i, value)}
                    />
                    {getStrokesGiven(player.name, i) > 0 && (
                      <span className="strokes-dot">•</span>
                    )}
                  </td>
                ))}
                <td className="total-score">
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
        <HoleInfo course={course} />
        <BetTracker 
          players={players} 
          bets={bets} 
          addBet={addBet} 
          scores={scores} 
          roundId={roundId}
        />
      </div>
      
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
        </div>
      )}
    </div>
  );
}

export default Scorecard;