import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

// Global test cleanup
afterEach(() => {
  cleanup();
});

// Mock environment variables for testing
beforeEach(() => {
  // Set default environment variables for tests
  vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-api-key');
  vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', 'test-project.firebaseapp.com');
  vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project');
  vi.stubEnv('VITE_FIREBASE_STORAGE_BUCKET', 'test-project.appspot.com');
  vi.stubEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '123456789');
  vi.stubEnv('VITE_FIREBASE_APP_ID', '1:123456789:web:test');
  vi.stubEnv('VITE_FIREBASE_MEASUREMENT_ID', 'G-TEST');
});

// Mock Firebase modules
vi.mock('../firebase.js', () => ({
  // Auth functions
  signInWithEmail: vi.fn(),
  signInWithGoogle: vi.fn(),
  signInWithApple: vi.fn(),
  signUpWithEmail: vi.fn(),
  signOut: vi.fn(),
  resetPassword: vi.fn(),
  getCurrentUser: vi.fn(),
  onAuthChange: vi.fn(),

  // Firestore functions
  createRound: vi.fn(),
  getRound: vi.fn(),
  updateRound: vi.fn(),
  updateScore: vi.fn(),
  addBet: vi.fn(),
  subscribeToRound: vi.fn(),
  getUserRounds: vi.fn(),
  getUserById: vi.fn(),

  // User management
  findUserByEmail: vi.fn(),
  sendFriendRequest: vi.fn(),
  acceptFriendRequest: vi.fn(),
  declineFriendRequest: vi.fn(),
  getUserFriends: vi.fn(),
  getPendingFriendRequests: vi.fn(),
  updateUserProfile: vi.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
vi.stubGlobal('localStorage', localStorageMock);

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};
