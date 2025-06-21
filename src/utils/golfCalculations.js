// Golf calculations utility module
// Implements USGA handicap system and golf statistics

/**
 * Calculate Course Handicap from Handicap Index
 * Formula: Course Handicap = Handicap Index x (Slope Rating / 113) + (Course Rating - Par)
 *
 * @param {number} handicapIndex - Player's handicap index
 * @param {number} slopeRating - Course slope rating (85-155, standard is 113)
 * @param {number} courseRating - Course rating from selected tees
 * @param {number} coursePar - Course par
 * @returns {number} Course handicap (rounded to nearest whole number)
 */
export const calculateCourseHandicap = (handicapIndex, slopeRating = 113, courseRating = 72, coursePar = 72) => {
  const courseHandicap = handicapIndex * (slopeRating / 113) + (courseRating - coursePar);
  return Math.round(courseHandicap);
};

/**
 * Calculate Playing Handicap from Course Handicap
 * Applies handicap allowance for different formats
 *
 * @param {number} courseHandicap - Course handicap
 * @param {string} format - Format: 'individual', 'fourball', 'foursomes', 'match'
 * @returns {number} Playing handicap
 */
export const calculatePlayingHandicap = (courseHandicap, format = 'individual') => {
  const allowances = {
    individual: 1.0,      // 100% allowance
    match: 1.0,           // 100% allowance for match play
    fourball: 0.9,        // 90% allowance
    foursomes: 0.5,       // 50% allowance
    scramble: 0.1,         // 10% allowance (varies by tournament)
  };

  const allowance = allowances[format] || 1.0;
  return Math.round(courseHandicap * allowance);
};

/**
 * Allocate handicap strokes to holes based on handicap index
 * Uses proper USGA stroke allocation
 *
 * @param {number} playingHandicap - Playing handicap
 * @param {Array<number>} holeHandicaps - Hole handicap ratings (1-18)
 * @returns {Array<number>} Number of strokes for each hole (0 or 1 typically)
 */
export const allocateHandicapStrokes = (playingHandicap, holeHandicaps) => {
  const strokeAllocation = Array(18).fill(0);

  if (playingHandicap <= 0) return strokeAllocation;

  // Create array of holes sorted by handicap rating
  const holes = holeHandicaps.map((handicap, index) => ({
    hole: index,
    handicap,
  })).sort((a, b) => a.handicap - b.handicap);

  // Allocate strokes starting with hardest holes
  let strokesRemaining = Math.abs(playingHandicap);

  // First round: one stroke per hole starting with hardest
  for (let i = 0; i < 18 && strokesRemaining > 0; i++) {
    strokeAllocation[holes[i].hole] = 1;
    strokesRemaining--;
  }

  // Second round: additional strokes if handicap > 18
  for (let i = 0; i < 18 && strokesRemaining > 0; i++) {
    strokeAllocation[holes[i].hole] = 2;
    strokesRemaining--;
  }

  // Third round: additional strokes if handicap > 36 (rare)
  for (let i = 0; i < 18 && strokesRemaining > 0; i++) {
    strokeAllocation[holes[i].hole] = 3;
    strokesRemaining--;
  }

  return strokeAllocation;
};

/**
 * Calculate net score for a hole
 *
 * @param {number} grossScore - Gross score
 * @param {number} strokesReceived - Strokes received on this hole
 * @returns {number} Net score
 */
export const calculateNetScore = (grossScore, strokesReceived) => {
  return Math.max(0, grossScore - strokesReceived);
};

/**
 * Calculate Stableford points
 *
 * @param {number} netScore - Net score for the hole
 * @param {number} par - Par for the hole
 * @param {string} system - 'standard' or 'modified'
 * @returns {number} Stableford points
 */
export const calculateStablefordPoints = (netScore, par, system = 'standard') => {
  const scoreToPar = netScore - par;

  if (system === 'modified') {
    // Modified Stableford (like PGA Tour events)
    if (scoreToPar <= -2) return 8;      // Eagle or better
    if (scoreToPar === -1) return 3;     // Birdie
    if (scoreToPar === 0) return 1;      // Par
    if (scoreToPar === 1) return 0;      // Bogey
    return -1;                           // Double bogey or worse
  } else {
    // Standard Stableford
    if (scoreToPar <= -2) return 4;      // Eagle or better
    if (scoreToPar === -1) return 3;     // Birdie
    if (scoreToPar === 0) return 2;      // Par
    if (scoreToPar === 1) return 1;      // Bogey
    return 0;                            // Double bogey or worse
  }
};

/**
 * Calculate golf statistics
 *
 * @param {Array<number>} scores - Array of 18 hole scores
 * @param {Array<number>} pars - Array of 18 hole pars
 * @param {Array<number>} strokesReceived - Array of strokes received per hole
 * @returns {Object} Golf statistics
 */
export const calculateGolfStats = (scores, pars, strokesReceived = Array(18).fill(0)) => {
  const stats = {
    totalHoles: 0,
    grossScore: 0,
    netScore: 0,
    parTotal: 0,
    birdiesOrBetter: 0,
    pars: 0,
    bogeys: 0,
    doubleBogeyOrWorse: 0,
    greensInRegulation: 0,     // Simplified - based on score relative to par
    fairwaysInRegulation: 0,   // Simplified - would need actual tracking
    putts: 0,                  // Would need putting data
    upAndDown: 0,              // Would need short game tracking
    sandSaves: 0,               // Would need bunker data
  };

  for (let i = 0; i < 18; i++) {
    const score = scores[i];
    const par = pars[i];
    const strokes = strokesReceived[i] || 0;

    if (score === 0 || !score) continue; // Skip unplayed holes

    stats.totalHoles++;
    stats.grossScore += score;
    stats.netScore += calculateNetScore(score, strokes);
    stats.parTotal += par;

    const scoreToPar = score - par;

    if (scoreToPar <= -1) stats.birdiesOrBetter++;
    else if (scoreToPar === 0) stats.pars++;
    else if (scoreToPar === 1) stats.bogeys++;
    else stats.doubleBogeyOrWorse++;

    // Simplified GIR calculation (would normally need separate tracking)
    // Assume GIR if score is par or better on par 4/5, or 1 under par or better on par 3
    if ((par >= 4 && scoreToPar <= 0) || (par === 3 && scoreToPar <= -1)) {
      stats.greensInRegulation++;
    }
  }

  // Calculate percentages
  if (stats.totalHoles > 0) {
    stats.girPercentage = Math.round((stats.greensInRegulation / stats.totalHoles) * 100);
    stats.firPercentage = 0; // Would need actual fairway tracking
    stats.averagePutts = 0;  // Would need putting data
  }

  return stats;
};

/**
 * Validate golf score
 *
 * @param {number} score - Score to validate
 * @param {number} par - Par for the hole
 * @param {number} maxScore - Maximum allowable score (default: par + 5)
 * @returns {Object} Validation result
 */
export const validateScore = (score, par, maxScore = null) => {
  const max = maxScore || par + 5; // ESC (Equitable Stroke Control) guideline

  if (!score || score <= 0) {
    return { isValid: false, error: 'Score must be greater than 0' };
  }

  if (score > max) {
    return {
      isValid: false,
      error: `Score too high (max ${max} for par ${par})`,
      suggestedScore: max,
    };
  }

  if (score > par + 8) {
    return {
      isValid: false,
      error: 'Unrealistic score',
      suggestedScore: par + 3,
    };
  }

  return { isValid: true };
};

/**
 * Calculate handicap differential for a round
 * Used for handicap index calculation
 *
 * @param {number} adjustedGrossScore - Adjusted gross score (after ESC)
 * @param {number} courseRating - Course rating
 * @param {number} slopeRating - Slope rating
 * @returns {number} Handicap differential
 */
export const calculateHandicapDifferential = (adjustedGrossScore, courseRating, slopeRating = 113) => {
  return (adjustedGrossScore - courseRating) * (113 / slopeRating);
};

/**
 * Apply Equitable Stroke Control (ESC)
 * Adjusts hole scores for handicap calculation
 *
 * @param {Array<number>} scores - Array of hole scores
 * @param {number} courseHandicap - Course handicap
 * @returns {Array<number>} Adjusted scores
 */
export const applyESC = (scores, courseHandicap) => {
  let maxScore;

  if (courseHandicap <= 9) maxScore = 6;
  else if (courseHandicap <= 19) maxScore = 7;
  else if (courseHandicap <= 29) maxScore = 8;
  else if (courseHandicap <= 39) maxScore = 9;
  else maxScore = 10;

  return scores.map(score => {
    if (score === 0 || !score) return score; // Don't adjust unplayed holes
    return Math.min(score, maxScore);
  });
};

export default {
  calculateCourseHandicap,
  calculatePlayingHandicap,
  allocateHandicapStrokes,
  calculateNetScore,
  calculateStablefordPoints,
  calculateGolfStats,
  validateScore,
  calculateHandicapDifferential,
  applyESC,
};
