import React, { useState } from 'react';

function HoleInfo({ course }) {
  const [selectedHole, setSelectedHole] = useState(0);
  
  return (
    <div className="info-card">
      <h3 className="info-card-header">Hole Information</h3>
      
      <div className="hole-selector">
        {Array.from({length: 18}, (_, i) => (
          <button
            key={i}
            className={`hole-button ${selectedHole === i ? 'active' : ''}`}
            onClick={() => setSelectedHole(i)}
          >
            {i + 1}
          </button>
        ))}
      </div>
      
      <div className="space-y-2">
        <div className="hole-detail">
          <span className="detail-label">Hole:</span>
          <span>{selectedHole + 1}</span>
        </div>
        <div className="hole-detail">
          <span className="detail-label">Par:</span>
          <span>{course.par[selectedHole]}</span>
        </div>
        <div className="hole-detail">
          <span className="detail-label">Handicap:</span>
          <span>{course.handicap[selectedHole]}</span>
        </div>
      </div>
    </div>
  );
}

export default HoleInfo;