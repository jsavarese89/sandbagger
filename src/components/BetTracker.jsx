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
    { id: 'bingo-bango-bongo', name: 'Bingo-Bango-Bongo' }
  ];
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (participants.length < 2) return;
    
    const newBet = {
      type: betType,
      amount,
      participants,
      timestamp: new Date().toISOString()
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
  
  const calculateBetResults = (bet) => {
    // This is a simplified calculation - real logic would be more complex
    // and specific to each bet type
    const results = {};
    
    bet.participants.forEach(playerName => {
      const netScore = scores[playerName] ? 
        scores[playerName].reduce((sum, score) => sum + score, 0) - 
        (players.find(p => p.name === playerName)?.handicap || 0) : 0;
      
      results[playerName] = netScore;
    });
    
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
                      {Object.entries(betResults).map(([playerName, score]) => (
                        <div key={playerName} className="player-result">
                          <span>{playerName}</span>
                          <span>Net: {score}</span>
                        </div>
                      ))}
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