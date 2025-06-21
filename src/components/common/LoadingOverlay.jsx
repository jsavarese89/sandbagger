import React, { memo } from 'react';

const LoadingOverlay = memo(({ show }) => {
  if (!show) return null;

  return (
    <div className="loading-overlay">
      <div className="spinner" />
    </div>
  );
});

LoadingOverlay.displayName = 'LoadingOverlay';

export default LoadingOverlay;
