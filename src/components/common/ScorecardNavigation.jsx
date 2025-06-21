import React, { memo, useCallback } from 'react';

const ScorecardNavigation = memo(({
  currentView,
  viewIndex,
  onPrevView,
  onNextView,
  onViewChange,
}) => {
  const viewSequence = ['front-9', 'back-9', 'total-view'];

  const handleDotClick = useCallback((index) => {
    onViewChange(index, viewSequence[index]);
  }, [onViewChange, viewSequence]);

  const getViewLabel = useCallback((view) => {
    switch (view) {
      case 'front-9': return 'Front 9';
      case 'back-9': return 'Back 9';
      case 'total-view': return 'Summary';
      default: return 'Unknown';
    }
  }, []);

  const getPrevButtonLabel = useCallback(() => {
    return viewIndex === 0 ? 'Summary' : 'Front 9';
  }, [viewIndex]);

  const getNextButtonLabel = useCallback(() => {
    return viewIndex === 2 ? 'Front 9' : 'Back 9';
  }, [viewIndex]);

  return (
    <div className="scorecard-nav">
      <button className="scorecard-nav-btn" onClick={onPrevView}>
        ← {getPrevButtonLabel()}
      </button>
      <div className="scorecard-view-label">
        <span className="view-title">
          {getViewLabel(currentView)}
        </span>
        <div className="view-indicators">
          {viewSequence.map((_, index) => (
            <div
              key={index}
              className={`view-dot ${index === viewIndex ? 'active' : ''}`}
              onClick={() => handleDotClick(index)}
            />
          ))}
        </div>
      </div>
      <button className="scorecard-nav-btn" onClick={onNextView}>
        {getNextButtonLabel()} →
      </button>
    </div>
  );
});

ScorecardNavigation.displayName = 'ScorecardNavigation';

export default ScorecardNavigation;
