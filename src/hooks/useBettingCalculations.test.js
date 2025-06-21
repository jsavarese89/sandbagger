import { renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';

import { mockPlayers, mockCourse, mockScores } from '../tests/utils';

import { useBettingCalculations } from './useBettingCalculations';


describe('useBettingCalculations', () => {
  const testScores = {
    'John Doe': [4, 5, 3, 4, 4, 5, 3, 4, 4, 4, 5, 3, 4, 4, 5, 3, 4, 4],
    'Jane Smith': [5, 6, 4, 5, 5, 6, 4, 5, 5, 5, 6, 4, 5, 5, 6, 4, 5, 5],
    'Bob Wilson': [3, 4, 2, 3, 3, 4, 2, 3, 3, 3, 4, 2, 3, 3, 4, 2, 3, 3],
  };

  describe('Match Play Calculations', () => {
    it('should calculate match play winnings correctly', () => {
      const { result } = renderHook(() =>
        useBettingCalculations(testScores, mockPlayers, mockCourse),
      );

      const bet = {
        type: 'match',
        amount: 10,
        participants: ['John Doe', 'Jane Smith'],
      };

      const winnings = result.current.calculateBetWinningsTotal(bet);

      expect(winnings).toHaveProperty('John Doe');
      expect(winnings).toHaveProperty('Jane Smith');
      expect(typeof winnings['John Doe']).toBe('number');
      expect(typeof winnings['Jane Smith']).toBe('number');
    });

    it('should handle match play with equal scores (tie)', () => {
      const tieScores = {
        'John Doe': [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
        'Jane Smith': [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
      };

      const { result } = renderHook(() =>
        useBettingCalculations(tieScores, mockPlayers, mockCourse),
      );

      const bet = {
        type: 'match',
        amount: 10,
        participants: ['John Doe', 'Jane Smith'],
      };

      const winnings = result.current.calculateBetWinningsTotal(bet);

      expect(winnings['John Doe']).toBe(0);
      expect(winnings['Jane Smith']).toBe(0);
    });

    it('should handle insufficient players for match play', () => {
      const { result } = renderHook(() =>
        useBettingCalculations(testScores, mockPlayers, mockCourse),
      );

      const bet = {
        type: 'match',
        amount: 10,
        participants: ['John Doe'], // Only one player
      };

      const winnings = result.current.calculateBetWinningsTotal(bet);

      expect(winnings['John Doe']).toBe(0);
    });
  });

  describe('Nassau Calculations', () => {
    it('should calculate Nassau winnings correctly', () => {
      const { result } = renderHook(() =>
        useBettingCalculations(testScores, mockPlayers, mockCourse),
      );

      const bet = {
        type: 'nassau',
        amount: 5,
        participants: ['John Doe', 'Jane Smith'],
      };

      const winnings = result.current.calculateBetWinningsTotal(bet);

      expect(winnings).toHaveProperty('John Doe');
      expect(winnings).toHaveProperty('Jane Smith');

      // Nassau has 3 bets (front 9, back 9, total), so max winnings should be 3 * amount
      expect(Math.abs(winnings['John Doe'])).toBeLessThanOrEqual(15);
      expect(Math.abs(winnings['Jane Smith'])).toBeLessThanOrEqual(15);
    });

    it('should handle incomplete rounds in Nassau', () => {
      const incompleteScores = {
        'John Doe': [4, 5, 3, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        'Jane Smith': [5, 6, 4, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      };

      const { result } = renderHook(() =>
        useBettingCalculations(incompleteScores, mockPlayers, mockCourse),
      );

      const bet = {
        type: 'nassau',
        amount: 5,
        participants: ['John Doe', 'Jane Smith'],
      };

      const winnings = result.current.calculateBetWinningsTotal(bet);

      // Should only calculate for completed portions
      expect(winnings).toBeDefined();
    });
  });

  describe('Skins Calculations', () => {
    it('should calculate skins winnings correctly', () => {
      const { result } = renderHook(() =>
        useBettingCalculations(testScores, mockPlayers, mockCourse),
      );

      const bet = {
        type: 'skins',
        amount: 2,
        participants: ['John Doe', 'Jane Smith', 'Bob Wilson'],
      };

      const winnings = result.current.calculateBetWinningsTotal(bet);

      expect(winnings).toHaveProperty('John Doe');
      expect(winnings).toHaveProperty('Jane Smith');
      expect(winnings).toHaveProperty('Bob Wilson');

      // Total winnings should balance out (sum should be close to 0)
      const total = Object.values(winnings).reduce((sum, amount) => sum + amount, 0);
      expect(Math.abs(total)).toBeLessThan(0.01); // Account for rounding
    });

    it('should handle ties in skins (no winner)', () => {
      const tieScores = {
        'John Doe': [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
        'Jane Smith': [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
        'Bob Wilson': [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
      };

      const { result } = renderHook(() =>
        useBettingCalculations(tieScores, mockPlayers, mockCourse),
      );

      const bet = {
        type: 'skins',
        amount: 2,
        participants: ['John Doe', 'Jane Smith', 'Bob Wilson'],
      };

      const winnings = result.current.calculateBetWinningsTotal(bet);

      // No skins won, everyone loses their ante
      expect(winnings['John Doe']).toBe(-2);
      expect(winnings['Jane Smith']).toBe(-2);
      expect(winnings['Bob Wilson']).toBe(-2);
    });
  });

  describe('Bingo-Bango-Bongo Calculations', () => {
    it('should calculate Bingo-Bango-Bongo winnings', () => {
      const { result } = renderHook(() =>
        useBettingCalculations(testScores, mockPlayers, mockCourse),
      );

      const bet = {
        type: 'bingo-bango-bongo',
        amount: 3,
        participants: ['John Doe', 'Jane Smith', 'Bob Wilson'],
      };

      const winnings = result.current.calculateBetWinningsTotal(bet);

      expect(winnings).toHaveProperty('John Doe');
      expect(winnings).toHaveProperty('Jane Smith');
      expect(winnings).toHaveProperty('Bob Wilson');

      // Total should balance out
      const total = Object.values(winnings).reduce((sum, amount) => sum + amount, 0);
      expect(Math.abs(total)).toBeLessThan(0.01);
    });
  });

  describe('Invalid Bet Handling', () => {
    it('should handle undefined bet', () => {
      const { result } = renderHook(() =>
        useBettingCalculations(testScores, mockPlayers, mockCourse),
      );

      const winnings = result.current.calculateBetWinningsTotal(undefined);

      expect(winnings).toEqual({});
    });

    it('should handle bet with invalid participants', () => {
      const { result } = renderHook(() =>
        useBettingCalculations(testScores, mockPlayers, mockCourse),
      );

      const bet = {
        type: 'match',
        amount: 10,
        participants: null,
      };

      const winnings = result.current.calculateBetWinningsTotal(bet);

      expect(winnings).toEqual({});
    });

    it('should handle unknown bet type', () => {
      const { result } = renderHook(() =>
        useBettingCalculations(testScores, mockPlayers, mockCourse),
      );

      const bet = {
        type: 'unknown-bet-type',
        amount: 10,
        participants: ['John Doe', 'Jane Smith'],
      };

      const winnings = result.current.calculateBetWinningsTotal(bet);

      expect(winnings['John Doe']).toBe(0);
      expect(winnings['Jane Smith']).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty scores', () => {
      const emptyScores = {};

      const { result } = renderHook(() =>
        useBettingCalculations(emptyScores, mockPlayers, mockCourse),
      );

      const bet = {
        type: 'match',
        amount: 10,
        participants: ['John Doe', 'Jane Smith'],
      };

      const winnings = result.current.calculateBetWinningsTotal(bet);

      expect(winnings['John Doe']).toBe(0);
      expect(winnings['Jane Smith']).toBe(0);
    });

    it('should handle players with no scores entered', () => {
      const partialScores = {
        'John Doe': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        'Jane Smith': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      };

      const { result } = renderHook(() =>
        useBettingCalculations(partialScores, mockPlayers, mockCourse),
      );

      const bet = {
        type: 'match',
        amount: 10,
        participants: ['John Doe', 'Jane Smith'],
      };

      const winnings = result.current.calculateBetWinningsTotal(bet);

      expect(winnings['John Doe']).toBe(0);
      expect(winnings['Jane Smith']).toBe(0);
    });

    it('should handle very high scores', () => {
      const highScores = {
        'John Doe': [10, 12, 8, 9, 11, 13, 7, 10, 9, 8, 12, 6, 9, 10, 14, 8, 11, 9],
        'Jane Smith': [8, 9, 6, 7, 8, 10, 5, 8, 7, 6, 9, 4, 7, 8, 11, 6, 8, 7],
      };

      const { result } = renderHook(() =>
        useBettingCalculations(highScores, mockPlayers, mockCourse),
      );

      const bet = {
        type: 'match',
        amount: 10,
        participants: ['John Doe', 'Jane Smith'],
      };

      const winnings = result.current.calculateBetWinningsTotal(bet);

      expect(typeof winnings['John Doe']).toBe('number');
      expect(typeof winnings['Jane Smith']).toBe('number');
    });
  });

  describe('Performance and Memoization', () => {
    it('should memoize calculations with same inputs', () => {
      const { result, rerender } = renderHook(
        ({ scores, players, course }) => useBettingCalculations(scores, players, course),
        {
          initialProps: {
            scores: testScores,
            players: mockPlayers,
            course: mockCourse,
          },
        },
      );

      const firstCalculation = result.current.calculateBetWinningsTotal;

      // Rerender with same props
      rerender({
        scores: testScores,
        players: mockPlayers,
        course: mockCourse,
      });

      const secondCalculation = result.current.calculateBetWinningsTotal;

      // Should return the same memoized function
      expect(firstCalculation).toBe(secondCalculation);
    });
  });
});
