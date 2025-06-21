import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';


import { setupDefaultMocks, resetAllMocks, setupFailedFirestoreMocks } from '../tests/mocks/firebase';
import { mockUser, mockRound, mockPlayers } from '../tests/utils';

import { useRoundState } from './useRoundState';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
vi.stubGlobal('localStorage', mockLocalStorage);

describe('useRoundState', () => {
  beforeEach(() => {
    resetAllMocks();
    setupDefaultMocks();
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
  });

  describe('Initial State', () => {
    it('should initialize with empty state when no user', () => {
      const { result } = renderHook(() => useRoundState(null));

      expect(result.current.players).toEqual([]);
      expect(result.current.roundId).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.selectedCourse).toBeNull();
    });

    it('should initialize with empty state when user provided', () => {
      const { result } = renderHook(() => useRoundState(mockUser));

      expect(result.current.players).toEqual([]);
      expect(result.current.roundId).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.selectedCourse).toBeNull();
    });
  });

  describe('Players Management', () => {
    it('should allow setting players', () => {
      const { result } = renderHook(() => useRoundState(mockUser));

      act(() => {
        result.current.setPlayers(mockPlayers);
      });

      expect(result.current.players).toEqual(mockPlayers);
    });

    it('should handle empty players array', () => {
      const { result } = renderHook(() => useRoundState(mockUser));

      act(() => {
        result.current.setPlayers([]);
      });

      expect(result.current.players).toEqual([]);
    });
  });

  describe('Course Management', () => {
    it('should allow setting selected course', () => {
      const { result } = renderHook(() => useRoundState(mockUser));
      const mockCourse = {
        name: 'Test Course',
        pars: [4, 5, 3, 4, 4, 5, 3, 4, 4, 4, 5, 3, 4, 4, 5, 3, 4, 4],
        handicaps: [7, 1, 15, 5, 11, 3, 17, 13, 9, 8, 2, 16, 6, 12, 4, 18, 14, 10],
      };

      act(() => {
        result.current.setSelectedCourse(mockCourse);
      });

      expect(result.current.selectedCourse).toEqual(mockCourse);
    });
  });

  describe('Round Creation', () => {
    it('should create a new round successfully', async () => {
      const { result } = renderHook(() => useRoundState(mockUser));

      // Set up players first
      act(() => {
        result.current.setPlayers(mockPlayers);
      });

      let roundId;
      await act(async () => {
        roundId = await result.current.startNewRound();
      });

      expect(roundId).toBe('test-round-123');
      expect(result.current.roundId).toBe('test-round-123');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('currentRoundId', 'test-round-123');
    });

    it('should not create round without players', async () => {
      const { result } = renderHook(() => useRoundState(mockUser));

      // Mock alert to prevent actual alert during test
      vi.stubGlobal('alert', vi.fn());

      let roundId;
      await act(async () => {
        roundId = await result.current.startNewRound();
      });

      expect(roundId).toBeNull();
      expect(global.alert).toHaveBeenCalledWith('Please add at least one player');
    });

    it('should handle round creation errors', async () => {
      setupFailedFirestoreMocks();
      const { result } = renderHook(() => useRoundState(mockUser));

      act(() => {
        result.current.setPlayers(mockPlayers);
      });

      let roundId;
      await act(async () => {
        roundId = await result.current.startNewRound();
      });

      expect(roundId).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('should create round with course data', async () => {
      const { result } = renderHook(() => useRoundState(mockUser));
      const mockCourse = {
        name: 'Test Course',
        pars: [4, 5, 3, 4, 4, 5, 3, 4, 4, 4, 5, 3, 4, 4, 5, 3, 4, 4],
        handicaps: [7, 1, 15, 5, 11, 3, 17, 13, 9, 8, 2, 16, 6, 12, 4, 18, 14, 10],
        city: 'Test City',
        state: 'Test State',
      };

      act(() => {
        result.current.setPlayers(mockPlayers);
        result.current.setSelectedCourse(mockCourse);
      });

      await act(async () => {
        await result.current.startNewRound();
      });

      expect(result.current.roundId).toBe('test-round-123');
    });
  });

  describe('Round Loading', () => {
    it('should load existing round successfully', async () => {
      const { result } = renderHook(() => useRoundState(mockUser));

      await act(async () => {
        await result.current.loadExistingRound('test-round-123');
      });

      expect(result.current.roundId).toBe('test-round-123');
      expect(result.current.players).toEqual(mockRound.players);
      expect(result.current.loading).toBe(false);
    });

    it('should handle round loading errors', async () => {
      setupFailedFirestoreMocks();
      const { result } = renderHook(() => useRoundState(mockUser));

      await act(async () => {
        await result.current.loadExistingRound('invalid-round-id');
      });

      expect(result.current.roundId).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('should show loading state during round loading', async () => {
      const { result } = renderHook(() => useRoundState(mockUser));

      // Create a promise we can control
      let resolveLoad;
      const loadPromise = new Promise(resolve => {
        resolveLoad = resolve;
      });

      // Mock getRound to return our controlled promise
      vi.doMock('../firebase.js', () => ({
        getRound: vi.fn().mockReturnValue(loadPromise),
      }));

      act(() => {
        result.current.loadExistingRound('test-round-123');
      });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolveLoad(mockRound);
        await loadPromise;
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('Local Storage Integration', () => {
    it('should save roundId to localStorage when roundId changes', () => {
      const { result } = renderHook(() => useRoundState(mockUser));

      act(() => {
        result.current.setRoundId('test-round-456');
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('currentRoundId', 'test-round-456');
    });

    it('should load roundId from localStorage on mount', async () => {
      mockLocalStorage.getItem.mockReturnValue('saved-round-123');

      const { result } = renderHook(() => useRoundState(mockUser));

      await waitFor(() => {
        expect(result.current.roundId).toBe('test-round-123'); // From mock data
      });
    });

    it('should not load from localStorage if no user', () => {
      mockLocalStorage.getItem.mockReturnValue('saved-round-123');

      const { result } = renderHook(() => useRoundState(null));

      expect(result.current.roundId).toBeNull();
    });

    it('should clear round data', () => {
      const { result } = renderHook(() => useRoundState(mockUser));

      act(() => {
        result.current.setRoundId('test-round-123');
      });

      act(() => {
        result.current.clearRound();
      });

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('currentRoundId');
      expect(result.current.roundId).toBeNull();
    });
  });

  describe('Loading States', () => {
    it('should handle loading state during round creation', async () => {
      const { result } = renderHook(() => useRoundState(mockUser));

      act(() => {
        result.current.setPlayers(mockPlayers);
      });

      expect(result.current.loading).toBe(false);

      await act(async () => {
        await result.current.startNewRound();
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      setupFailedFirestoreMocks();
      const { result } = renderHook(() => useRoundState(mockUser));

      act(() => {
        result.current.setPlayers(mockPlayers);
      });

      await act(async () => {
        const roundId = await result.current.startNewRound();
        expect(roundId).toBeNull();
      });

      expect(result.current.loading).toBe(false);
    });
  });
});
