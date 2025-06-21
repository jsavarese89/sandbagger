import { vi } from 'vitest';

import { mockUser, mockUserProfile, mockRound, mockBets } from '../utils';

// Mock Firebase Auth functions
export const mockAuth = {
  signInWithEmail: vi.fn(),
  signInWithGoogle: vi.fn(),
  signInWithApple: vi.fn(),
  signUpWithEmail: vi.fn(),
  signOut: vi.fn(),
  resetPassword: vi.fn(),
  getCurrentUser: vi.fn(),
  onAuthChange: vi.fn(),
};

// Mock Firestore functions
export const mockFirestore = {
  createRound: vi.fn(),
  getRound: vi.fn(),
  updateRound: vi.fn(),
  updateScore: vi.fn(),
  addBet: vi.fn(),
  subscribeToRound: vi.fn(),
  getUserRounds: vi.fn(),
  getUserById: vi.fn(),
  updateBetResults: vi.fn(),
  batchUpdateScores: vi.fn(),
};

// Mock User Management functions
export const mockUserManagement = {
  findUserByEmail: vi.fn(),
  sendFriendRequest: vi.fn(),
  acceptFriendRequest: vi.fn(),
  declineFriendRequest: vi.fn(),
  getUserFriends: vi.fn(),
  getPendingFriendRequests: vi.fn(),
  updateUserProfile: vi.fn(),
};

// Default mock implementations
export const setupSuccessfulAuthMocks = () => {
  mockAuth.signInWithEmail.mockResolvedValue(mockUser);
  mockAuth.signInWithGoogle.mockResolvedValue(mockUser);
  mockAuth.signInWithApple.mockResolvedValue(mockUser);
  mockAuth.signUpWithEmail.mockResolvedValue(mockUser);
  mockAuth.signOut.mockResolvedValue();
  mockAuth.resetPassword.mockResolvedValue();
  mockAuth.getCurrentUser.mockReturnValue(mockUser);
  mockAuth.onAuthChange.mockImplementation((callback) => {
    callback(mockUser);
    return vi.fn(); // unsubscribe function
  });
};

export const setupFailedAuthMocks = () => {
  const authError = new Error('Authentication failed');
  mockAuth.signInWithEmail.mockRejectedValue(authError);
  mockAuth.signInWithGoogle.mockRejectedValue(authError);
  mockAuth.signUpWithEmail.mockRejectedValue(authError);
  mockAuth.getCurrentUser.mockReturnValue(null);
  mockAuth.onAuthChange.mockImplementation((callback) => {
    callback(null);
    return vi.fn();
  });
};

export const setupSuccessfulFirestoreMocks = () => {
  mockFirestore.createRound.mockResolvedValue('test-round-123');
  mockFirestore.getRound.mockResolvedValue(mockRound);
  mockFirestore.updateRound.mockResolvedValue();
  mockFirestore.updateScore.mockResolvedValue(5);
  mockFirestore.addBet.mockResolvedValue('bet_123');
  mockFirestore.subscribeToRound.mockImplementation((roundId, callback) => {
    callback(mockRound);
    return vi.fn(); // unsubscribe function
  });
  mockFirestore.getUserRounds.mockImplementation((userId, callback) => {
    callback([mockRound]);
    return vi.fn();
  });
  mockFirestore.getUserById.mockResolvedValue(mockUserProfile);
};

export const setupFailedFirestoreMocks = () => {
  const firestoreError = new Error('Firestore operation failed');
  mockFirestore.createRound.mockRejectedValue(firestoreError);
  mockFirestore.getRound.mockRejectedValue(firestoreError);
  mockFirestore.updateRound.mockRejectedValue(firestoreError);
  mockFirestore.updateScore.mockRejectedValue(firestoreError);
  mockFirestore.addBet.mockRejectedValue(firestoreError);
  mockFirestore.getUserById.mockRejectedValue(firestoreError);
};

export const setupSuccessfulUserManagementMocks = () => {
  mockUserManagement.findUserByEmail.mockResolvedValue({
    ...mockUserProfile,
    uid: 'found-user-123',
  });
  mockUserManagement.sendFriendRequest.mockResolvedValue(true);
  mockUserManagement.acceptFriendRequest.mockResolvedValue(true);
  mockUserManagement.declineFriendRequest.mockResolvedValue(true);
  mockUserManagement.getUserFriends.mockResolvedValue([]);
  mockUserManagement.getPendingFriendRequests.mockResolvedValue([]);
  mockUserManagement.updateUserProfile.mockResolvedValue(true);
};

// Helper to reset all mocks
export const resetAllMocks = () => {
  Object.values(mockAuth).forEach(mock => mock.mockReset());
  Object.values(mockFirestore).forEach(mock => mock.mockReset());
  Object.values(mockUserManagement).forEach(mock => mock.mockReset());
};

// Helper to setup default successful mocks
export const setupDefaultMocks = () => {
  setupSuccessfulAuthMocks();
  setupSuccessfulFirestoreMocks();
  setupSuccessfulUserManagementMocks();
};

// Helper to simulate network issues
export const setupNetworkErrorMocks = () => {
  const networkError = new Error('Network request failed');
  Object.values(mockAuth).forEach(mock => {
    if (typeof mock.mockRejectedValue === 'function') {
      mock.mockRejectedValue(networkError);
    }
  });
  Object.values(mockFirestore).forEach(mock => {
    if (typeof mock.mockRejectedValue === 'function') {
      mock.mockRejectedValue(networkError);
    }
  });
};

// Export all mocks as default
export default {
  ...mockAuth,
  ...mockFirestore,
  ...mockUserManagement,
  setupSuccessfulAuthMocks,
  setupFailedAuthMocks,
  setupSuccessfulFirestoreMocks,
  setupFailedFirestoreMocks,
  setupSuccessfulUserManagementMocks,
  setupDefaultMocks,
  setupNetworkErrorMocks,
  resetAllMocks,
};
