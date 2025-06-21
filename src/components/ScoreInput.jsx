import React, { useState, useCallback, useMemo } from 'react';

const ScoreInput = React.memo(({ value, onChange }) => {
  const [showButtons, setShowButtons] = useState(false);

  const numericValue = useMemo(() => parseInt(value) || 0, [value]);

  const handleIncrement = useCallback(() => {
    const newValue = Math.min(numericValue + 1, 20);
    onChange(newValue.toString());
  }, [numericValue, onChange]);

  const handleDecrement = useCallback(() => {
    const newValue = Math.max(numericValue - 1, 0);
    onChange(newValue.toString());
  }, [numericValue, onChange]);

  const handleInputChange = useCallback((e) => {
    const inputValue = e.target.value;
    if (inputValue === '' || (parseInt(inputValue) >= 0 && parseInt(inputValue) <= 20)) {
      onChange(inputValue);
    }
  }, [onChange]);

  const handleFocus = useCallback(() => setShowButtons(true), []);
  const handleBlur = useCallback(() => {
    setTimeout(() => setShowButtons(false), 150);
  }, []);

  const handleQuickScore = useCallback((score) => {
    onChange(score.toString());
  }, [onChange]);

  return (
    <div className="score-input-container">
      {/* +/- buttons for mobile - show on focus/touch */}
      <div className="score-input-wrapper">
        <button
          type="button"
          className="score-btn score-btn-minus"
          onClick={handleDecrement}
          disabled={numericValue <= 0}
          aria-label="Decrease score"
        >
          −
        </button>

        <input
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="score-input"
          style={{
            width: '100%',
            minWidth: '48px',
            textAlign: 'center',
            fontSize: '16px', // Prevent zoom on iOS
            borderRadius: '8px',
          }}
          min="0"
          max="20"
          placeholder="-"
        />

        <button
          type="button"
          className="score-btn score-btn-plus"
          onClick={handleIncrement}
          disabled={numericValue >= 20}
          aria-label="Increase score"
        >
          +
        </button>
      </div>

      {/* Quick score selector for common scores */}
      {showButtons && (
        <div className="quick-scores">
          {[3, 4, 5, 6, 7].map(score => (
            <button
              key={score}
              type="button"
              className={`quick-score-btn ${numericValue === score ? 'active' : ''}`}
              onClick={() => handleQuickScore(score)}
            >
              {score}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

ScoreInput.displayName = 'ScoreInput';

export default ScoreInput;
