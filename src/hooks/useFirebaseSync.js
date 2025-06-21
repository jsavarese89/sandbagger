import { useCallback, useRef, useEffect } from 'react';

import { updateScore, updateRound, batchUpdateScores } from '../firebase';

const DEBOUNCE_DELAY = 1000; // 1 second
const BATCH_SIZE = 10;

export const useFirebaseSync = (roundId) => {
  const pendingOperations = useRef(new Map());
  const debounceTimers = useRef(new Map());
  const batchQueue = useRef([]);
  const batchTimer = useRef(null);

  // Clear all timers on unmount
  useEffect(() => {
    return () => {
      debounceTimers.current.forEach(timer => clearTimeout(timer));
      if (batchTimer.current) {
        clearTimeout(batchTimer.current);
      }
    };
  }, []);

  // Debounced score update
  const debouncedScoreUpdate = useCallback(async (playerName, holeIndex, score) => {
    if (!roundId) {
      console.warn('No roundId provided for score update');
      return;
    }

    const operationKey = `score_${playerName}_${holeIndex}`;

    // Store the pending operation
    pendingOperations.current.set(operationKey, {
      playerName,
      holeIndex,
      score,
      timestamp: Date.now(),
    });

    // Clear existing timer for this operation
    if (debounceTimers.current.has(operationKey)) {
      clearTimeout(debounceTimers.current.get(operationKey));
    }

    // Set new debounce timer
    const timer = setTimeout(async () => {
      const operation = pendingOperations.current.get(operationKey);
      if (operation) {
        try {
          await updateScore(roundId, operation.playerName, operation.holeIndex, operation.score);
          pendingOperations.current.delete(operationKey);
          debounceTimers.current.delete(operationKey);
        } catch (error) {
          console.error('Failed to update score:', error);
          // Retry logic could be added here
        }
      }
    }, DEBOUNCE_DELAY);

    debounceTimers.current.set(operationKey, timer);
  }, [roundId]);

  // Batch score updates for performance
  const batchScoreUpdate = useCallback((scoreUpdates) => {
    if (!roundId) {
      console.warn('No roundId provided for batch score update');
      return;
    }

    // Add to batch queue
    batchQueue.current.push(...scoreUpdates);

    // Clear existing batch timer
    if (batchTimer.current) {
      clearTimeout(batchTimer.current);
    }

    // Process batch after delay or when reaching batch size
    const processBatch = async () => {
      if (batchQueue.current.length === 0) return;

      const batch = batchQueue.current.splice(0, BATCH_SIZE);

      try {
        await batchUpdateScores(roundId, batch);
      } catch (error) {
        console.error('Failed to batch update scores:', error);
        // Re-add failed operations to queue for retry
        batchQueue.current.unshift(...batch);
      }

      // Process remaining items if any
      if (batchQueue.current.length > 0) {
        setTimeout(processBatch, 100);
      }
    };

    // Process immediately if batch is full, otherwise wait
    if (batchQueue.current.length >= BATCH_SIZE) {
      processBatch();
    } else {
      batchTimer.current = setTimeout(processBatch, DEBOUNCE_DELAY);
    }
  }, [roundId]);

  // Debounced round data update
  const debouncedRoundUpdate = useCallback((updateData) => {
    if (!roundId) {
      console.warn('No roundId provided for round update');
      return;
    }

    const operationKey = 'round_update';

    // Store the pending operation (merge with existing)
    const existing = pendingOperations.current.get(operationKey) || {};
    pendingOperations.current.set(operationKey, {
      ...existing,
      ...updateData,
      timestamp: Date.now(),
    });

    // Clear existing timer
    if (debounceTimers.current.has(operationKey)) {
      clearTimeout(debounceTimers.current.get(operationKey));
    }

    // Set new debounce timer
    const timer = setTimeout(async () => {
      const operation = pendingOperations.current.get(operationKey);
      if (operation) {
        try {
          // Remove timestamp before sending to Firebase
          const { timestamp, ...dataToUpdate } = operation;
          await updateRound(roundId, dataToUpdate);
          pendingOperations.current.delete(operationKey);
          debounceTimers.current.delete(operationKey);
        } catch (error) {
          console.error('Failed to update round:', error);
        }
      }
    }, DEBOUNCE_DELAY);

    debounceTimers.current.set(operationKey, timer);
  }, [roundId]);

  // Force flush all pending operations
  const flushPendingOperations = useCallback(async () => {
    const promises = [];

    // Clear all timers and execute operations immediately
    debounceTimers.current.forEach((timer, key) => {
      clearTimeout(timer);

      const operation = pendingOperations.current.get(key);
      if (operation) {
        if (key.startsWith('score_')) {
          promises.push(
            updateScore(roundId, operation.playerName, operation.holeIndex, operation.score)
              .catch(error => console.error('Failed to flush score update:', error)),
          );
        } else if (key === 'round_update') {
          const { timestamp, ...dataToUpdate } = operation;
          promises.push(
            updateRound(roundId, dataToUpdate)
              .catch(error => console.error('Failed to flush round update:', error)),
          );
        }
      }
    });

    // Process any remaining batch operations
    if (batchQueue.current.length > 0) {
      promises.push(
        batchUpdateScores(roundId, batchQueue.current)
          .catch(error => console.error('Failed to flush batch updates:', error)),
      );
      batchQueue.current = [];
    }

    // Wait for all operations to complete
    await Promise.allSettled(promises);

    // Clear all pending operations
    pendingOperations.current.clear();
    debounceTimers.current.clear();

    if (batchTimer.current) {
      clearTimeout(batchTimer.current);
      batchTimer.current = null;
    }
  }, [roundId]);

  // Get count of pending operations (useful for UI indicators)
  const getPendingCount = useCallback(() => {
    return pendingOperations.current.size + batchQueue.current.length;
  }, []);

  // Check if there are pending operations for a specific player/hole
  const hasPendingScoreUpdate = useCallback((playerName, holeIndex) => {
    const operationKey = `score_${playerName}_${holeIndex}`;
    return pendingOperations.current.has(operationKey);
  }, []);

  return {
    debouncedScoreUpdate,
    batchScoreUpdate,
    debouncedRoundUpdate,
    flushPendingOperations,
    getPendingCount,
    hasPendingScoreUpdate,
  };
};
