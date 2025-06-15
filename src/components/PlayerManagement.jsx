import React, { useState } from 'react';

function PlayerManagement({ players, setPlayers }) {
  const [name, setName] = useState('');
  const [handicap, setHandicap] = useState(0);
  const [editIndex, setEditIndex] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!name.trim()) return;
    
    if (editIndex !== null) {
      // Update existing player
      const updatedPlayers = [...players];
      updatedPlayers[editIndex] = { name, handicap: Number(handicap) };
      setPlayers(updatedPlayers);
      setEditIndex(null);
    } else {
      // Add new player
      setPlayers([...players, { name, handicap: Number(handicap) }]);
    }
    
    // Reset form
    setName('');
    setHandicap(0);
  };

  const handleEdit = (index) => {
    setName(players[index].name);
    setHandicap(players[index].handicap);
    setEditIndex(index);
  };

  const handleDelete = (index) => {
    setPlayers(players.filter((_, i) => i !== index));
    if (editIndex === index) {
      setEditIndex(null);
      setName('');
      setHandicap(0);
    }
  };

  return (
    <div className="player-management">
      <h3 className="info-card-header">Player Management</h3>
      
      <form onSubmit={handleSubmit} className="player-form">
        <div className="form-group">
          <label>Name</label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="Enter player name"
            required
          />
        </div>
        
        <div className="form-group">
          <label>Handicap</label>
          <input 
            type="number" 
            value={handicap} 
            onChange={(e) => setHandicap(Number(e.target.value))} 
            min="0"
            max="36"
            required
            pattern="[0-9]*"
            inputMode="numeric"
          />
        </div>
        
        <button 
          type="submit" 
          className="btn"
        >
          {editIndex !== null ? 'Update Player' : 'Add Player'}
        </button>
        
        {editIndex !== null && (
          <button 
            type="button" 
            onClick={() => {
              setEditIndex(null);
              setName('');
              setHandicap(0);
            }}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        )}
      </form>
      
      {players.length > 0 && (
        <div>
          <h4 className="active-bets-header">Players</h4>
          <div className="player-list">
            {players.map((player, index) => (
              <div key={index} className="player-item">
                <div>
                  <span className="player-name">{player.name}</span>
                  <span className="player-handicap">HCP: {player.handicap}</span>
                </div>
                <div className="player-actions">
                  <button 
                    onClick={() => handleEdit(index)}
                    className="btn-sm btn-edit"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(index)}
                    className="btn-sm btn-delete"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default PlayerManagement;