// Data validation utilities for Sandbagger Golf App

export const ValidationError = class extends Error {
  constructor(message, field, code) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.code = code;
  }
};

// Player validation
export const validatePlayer = (player) => {
  const errors = [];

  if (!player || typeof player !== 'object') {
    throw new ValidationError('Player must be an object', 'player', 'INVALID_TYPE');
  }

  if (!player.name || typeof player.name !== 'string' || player.name.trim().length === 0) {
    errors.push(new ValidationError('Player name is required and must be a non-empty string', 'name', 'REQUIRED'));
  } else if (player.name.trim().length > 50) {
    errors.push(new ValidationError('Player name must be 50 characters or less', 'name', 'TOO_LONG'));
  }

  if (player.handicap !== undefined) {
    const handicap = parseFloat(player.handicap);
    if (isNaN(handicap) || handicap < -10 || handicap > 54) {
      errors.push(new ValidationError('Handicap must be a number between -10 and 54', 'handicap', 'INVALID_RANGE'));
    }
  }

  if (errors.length > 0) {
    throw errors[0]; // Throw first error
  }

  return {
    name: player.name.trim(),
    handicap: player.handicap !== undefined ? parseFloat(player.handicap) : 0,
  };
};

// Score validation
export const validateScore = (score, holeIndex) => {
  if (holeIndex !== undefined) {
    if (typeof holeIndex !== 'number' || holeIndex < 0 || holeIndex > 17) {
      throw new ValidationError('Hole index must be a number between 0 and 17', 'holeIndex', 'INVALID_RANGE');
    }
  }

  if (score === null || score === undefined || score === '') {
    return 0; // Allow empty scores
  }

  const numericScore = parseInt(score);
  if (isNaN(numericScore)) {
    throw new ValidationError('Score must be a valid number', 'score', 'INVALID_TYPE');
  }

  if (numericScore < 0) {
    throw new ValidationError('Score cannot be negative', 'score', 'INVALID_RANGE');
  }

  if (numericScore > 20) {
    throw new ValidationError('Score cannot exceed 20 strokes', 'score', 'INVALID_RANGE');
  }

  return numericScore;
};

// Course validation
export const validateCourse = (course) => {
  if (!course || typeof course !== 'object') {
    throw new ValidationError('Course must be an object', 'course', 'INVALID_TYPE');
  }

  if (!course.name || typeof course.name !== 'string' || course.name.trim().length === 0) {
    throw new ValidationError('Course name is required', 'name', 'REQUIRED');
  }

  if (course.par && Array.isArray(course.par)) {
    if (course.par.length !== 18) {
      throw new ValidationError('Course par array must have exactly 18 holes', 'par', 'INVALID_LENGTH');
    }

    course.par.forEach((par, index) => {
      const numericPar = parseInt(par);
      if (isNaN(numericPar) || numericPar < 3 || numericPar > 6) {
        throw new ValidationError(`Par for hole ${index + 1} must be between 3 and 6`, 'par', 'INVALID_RANGE');
      }
    });
  }

  if (course.handicap && Array.isArray(course.handicap)) {
    if (course.handicap.length !== 18) {
      throw new ValidationError('Course handicap array must have exactly 18 holes', 'handicap', 'INVALID_LENGTH');
    }

    course.handicap.forEach((handicap, index) => {
      const numericHandicap = parseInt(handicap);
      if (isNaN(numericHandicap) || numericHandicap < 1 || numericHandicap > 18) {
        throw new ValidationError(`Handicap for hole ${index + 1} must be between 1 and 18`, 'handicap', 'INVALID_RANGE');
      }
    });

    // Check for duplicate handicaps
    const handicapValues = course.handicap.map(h => parseInt(h));
    const uniqueHandicaps = new Set(handicapValues);
    if (uniqueHandicaps.size !== 18) {
      throw new ValidationError('Course handicaps must be unique numbers from 1 to 18', 'handicap', 'DUPLICATE_VALUES');
    }
  }

  return {
    name: course.name.trim(),
    par: course.par || Array(18).fill(4),
    handicap: course.handicap || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
    rating: course.rating || 72.0,
    slope: course.slope || 113,
  };
};

// Bet validation
export const validateBet = (bet) => {
  if (!bet || typeof bet !== 'object') {
    throw new ValidationError('Bet must be an object', 'bet', 'INVALID_TYPE');
  }

  if (!bet.type || typeof bet.type !== 'string') {
    throw new ValidationError('Bet type is required', 'type', 'REQUIRED');
  }

  const validBetTypes = ['match', 'nassau', 'skins', 'bingo-bango-bongo', 'stableford'];
  if (!validBetTypes.includes(bet.type)) {
    throw new ValidationError(`Bet type must be one of: ${validBetTypes.join(', ')}`, 'type', 'INVALID_VALUE');
  }

  if (!bet.amount || isNaN(parseFloat(bet.amount))) {
    throw new ValidationError('Bet amount is required and must be a valid number', 'amount', 'INVALID_TYPE');
  }

  const amount = parseFloat(bet.amount);
  if (amount <= 0) {
    throw new ValidationError('Bet amount must be greater than 0', 'amount', 'INVALID_RANGE');
  }

  if (amount > 10000) {
    throw new ValidationError('Bet amount cannot exceed $10,000', 'amount', 'INVALID_RANGE');
  }

  if (!bet.participants || !Array.isArray(bet.participants)) {
    throw new ValidationError('Bet participants must be an array', 'participants', 'INVALID_TYPE');
  }

  if (bet.participants.length < 2) {
    throw new ValidationError('Bet must have at least 2 participants', 'participants', 'INSUFFICIENT_PLAYERS');
  }

  if (bet.participants.length > 6) {
    throw new ValidationError('Bet cannot have more than 6 participants', 'participants', 'TOO_MANY_PLAYERS');
  }

  // Check for duplicate participants
  const uniqueParticipants = new Set(bet.participants);
  if (uniqueParticipants.size !== bet.participants.length) {
    throw new ValidationError('Bet participants must be unique', 'participants', 'DUPLICATE_PLAYERS');
  }

  return {
    type: bet.type,
    amount,
    participants: bet.participants,
    settings: bet.settings || {},
  };
};

// Round validation
export const validateRound = (round) => {
  if (!round || typeof round !== 'object') {
    throw new ValidationError('Round must be an object', 'round', 'INVALID_TYPE');
  }

  if (!round.players || !Array.isArray(round.players)) {
    throw new ValidationError('Round must have a players array', 'players', 'REQUIRED');
  }

  if (round.players.length === 0) {
    throw new ValidationError('Round must have at least one player', 'players', 'INSUFFICIENT_PLAYERS');
  }

  if (round.players.length > 6) {
    throw new ValidationError('Round cannot have more than 6 players', 'players', 'TOO_MANY_PLAYERS');
  }

  // Validate each player
  round.players.forEach((player, index) => {
    try {
      validatePlayer(player);
    } catch (error) {
      throw new ValidationError(`Player ${index + 1}: ${error.message}`, 'players', error.code);
    }
  });

  if (round.course) {
    try {
      validateCourse(round.course);
    } catch (error) {
      throw new ValidationError(`Course: ${error.message}`, 'course', error.code);
    }
  }

  if (round.bets && Array.isArray(round.bets)) {
    round.bets.forEach((bet, index) => {
      try {
        validateBet(bet);
      } catch (error) {
        throw new ValidationError(`Bet ${index + 1}: ${error.message}`, 'bets', error.code);
      }
    });
  }

  return true;
};

// Email validation
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    throw new ValidationError('Email is required', 'email', 'REQUIRED');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Please enter a valid email address', 'email', 'INVALID_FORMAT');
  }

  return email.toLowerCase().trim();
};

// Password validation
export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    throw new ValidationError('Password is required', 'password', 'REQUIRED');
  }

  if (password.length < 6) {
    throw new ValidationError('Password must be at least 6 characters long', 'password', 'TOO_SHORT');
  }

  if (password.length > 128) {
    throw new ValidationError('Password cannot exceed 128 characters', 'password', 'TOO_LONG');
  }

  return password;
};

// Display name validation
export const validateDisplayName = (displayName) => {
  if (!displayName || typeof displayName !== 'string') {
    throw new ValidationError('Display name is required', 'displayName', 'REQUIRED');
  }

  const trimmed = displayName.trim();
  if (trimmed.length === 0) {
    throw new ValidationError('Display name cannot be empty', 'displayName', 'REQUIRED');
  }

  if (trimmed.length > 50) {
    throw new ValidationError('Display name must be 50 characters or less', 'displayName', 'TOO_LONG');
  }

  return trimmed;
};

// Utility function to validate and sanitize input data
export const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return input.trim();
  }
  return input;
};

// Validation helper for forms
export const validateForm = (data, validationRules) => {
  const errors = {};

  Object.entries(validationRules).forEach(([field, validator]) => {
    try {
      if (typeof validator === 'function') {
        validator(data[field]);
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        errors[field] = error.message;
      } else {
        errors[field] = 'Validation error occurred';
      }
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
