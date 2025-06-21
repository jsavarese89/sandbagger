import { render } from '@testing-library/react';

import { AuthProvider } from '../contexts/AuthContext';

// Custom render function that includes providers
export function renderWithProviders(ui, {
  providerProps = {},
  ...renderOptions
} = {}) {
  function Wrapper({ children }) {
    return (
      <AuthProvider {...providerProps}>
        {children}
      </AuthProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

// Mock user data for testing
export const mockUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  emailVerified: true,
};

export const mockUserProfile = {
  displayName: 'Test User',
  email: 'test@example.com',
  handicap: 15,
  friends: [],
  pendingFriendRequests: [],
  createdAt: new Date().toISOString(),
};

// Mock players for testing
export const mockPlayers = [
  { name: 'John Doe', handicap: 10 },
  { name: 'Jane Smith', handicap: 15 },
  { name: 'Bob Wilson', handicap: 8 },
];

// Mock course data
export const mockCourse = {
  name: 'Test Golf Course',
  par: [4, 5, 3, 4, 4, 5, 3, 4, 4, 4, 5, 3, 4, 4, 5, 3, 4, 4],
  handicap: [7, 1, 15, 5, 11, 3, 17, 13, 9, 8, 2, 16, 6, 12, 4, 18, 14, 10],
  city: 'Test City',
  state: 'Test State',
};

// Mock scores data
export const mockScores = {
  'John Doe': [4, 5, 3, 4, 4, 5, 3, 4, 4, 4, 5, 3, 4, 4, 5, 3, 4, 4],
  'Jane Smith': [5, 6, 4, 5, 5, 6, 4, 5, 5, 5, 6, 4, 5, 5, 6, 4, 5, 5],
  'Bob Wilson': [3, 4, 2, 3, 3, 4, 2, 3, 3, 3, 4, 2, 3, 3, 4, 2, 3, 3],
};

// Mock round data
export const mockRound = {
  id: 'test-round-123',
  players: mockPlayers,
  scores: mockScores,
  course: mockCourse,
  bets: [],
  createdBy: 'test-user-123',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Mock betting data
export const mockBets = [
  {
    id: 'bet_123',
    type: 'match',
    amount: 10,
    participants: ['John Doe', 'Jane Smith'],
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'bet_456',
    type: 'skins',
    amount: 5,
    participants: ['John Doe', 'Jane Smith', 'Bob Wilson'],
    status: 'active',
    createdAt: new Date().toISOString(),
  },
];

// Helper to wait for async operations
export const waitFor = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to create mock Firebase functions
export const createMockFirebaseFn = (returnValue, shouldReject = false) => {
  return vi.fn().mockImplementation(() => {
    if (shouldReject) {
      return Promise.reject(new Error('Firebase operation failed'));
    }
    return Promise.resolve(returnValue);
  });
};

// Helper to simulate user events
export const simulateUserEvent = async (user, element, action = 'click') => {
  if (action === 'click') {
    await user.click(element);
  } else if (action === 'type') {
    await user.type(element, 'test input');
  }
  // Add more actions as needed
};

// Test helpers for mocking specific scenarios
export const mockAuthContextValue = {
  currentUser: mockUser,
  userProfile: mockUserProfile,
  loading: false,
  error: '',
  login: vi.fn(),
  signup: vi.fn(),
  loginWithGoogle: vi.fn(),
  loginWithApple: vi.fn(),
  logout: vi.fn(),
  forgotPassword: vi.fn(),
};

export const mockAuthContextLoading = {
  ...mockAuthContextValue,
  loading: true,
  currentUser: null,
  userProfile: null,
};

export const mockAuthContextError = {
  ...mockAuthContextValue,
  error: 'Authentication failed',
  currentUser: null,
  userProfile: null,
};
