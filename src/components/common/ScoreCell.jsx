import React, { memo } from 'react';

import ScoreInput from '../ScoreInput';

const ScoreCell = memo(({
  value,
  onChange,
  showStrokeDot = false,
  className = 'border px-2 py-2 text-center',
}) => {
  return (
    <td className={className} style={{ position: 'relative' }}>
      <ScoreInput
        value={value || ''}
        onChange={onChange}
      />
      {showStrokeDot && (
        <span className="strokes-dot">•</span>
      )}
    </td>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for optimal re-rendering
  return (
    prevProps.value === nextProps.value &&
    prevProps.showStrokeDot === nextProps.showStrokeDot &&
    prevProps.className === nextProps.className
  );
});

ScoreCell.displayName = 'ScoreCell';

export default ScoreCell;
