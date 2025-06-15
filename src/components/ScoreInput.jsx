import React from 'react';

function ScoreInput({ value, onChange }) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="score-input"
      min="0"
      max="20"
      pattern="[0-9]*"
      inputMode="numeric"
    />
  );
}

export default ScoreInput;