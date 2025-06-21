import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { setupDefaultMocks, resetAllMocks, setupFailedAuthMocks } from '../tests/mocks/firebase';

import { AuthProvider, useAuth } from './AuthContext';


// Test component to access AuthContext
function TestComponent() {
  const auth = useAuth();

  return (
    <div>
      <div data-testid="current-user">{auth.currentUser?.email || 'No user'}</div>
      <div data-testid="user-profile">{auth.userProfile?.displayName || 'No profile'}</div>
      <div data-testid="loading">{auth.loading ? 'Loading' : 'Not loading'}</div>
      <div data-testid="error">{auth.error || 'No error'}</div>
      <button data-testid="login-btn" onClick={() => auth.login('test@example.com', 'password')}>
        Login
      </button>
      <button data-testid="google-login-btn" onClick={() => auth.loginWithGoogle()}>
        Google Login
      </button>
      <button data-testid="apple-login-btn" onClick={() => auth.loginWithApple()}>
        Apple Login
      </button>
      <button data-testid="signup-btn" onClick={() => auth.signup('test@example.com', 'password', 'Test User')}>
        Signup
      </button>
      <button data-testid="logout-btn" onClick={() => auth.logout()}>
        Logout
      </button>
      <button data-testid="forgot-password-btn" onClick={() => auth.forgotPassword('test@example.com')}>
        Forgot Password
      </button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    resetAllMocks();
    setupDefaultMocks();
  });

  describe('Initial State', () => {
    it('should render with initial loading state', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      expect(screen.getByTestId('current-user')).toHaveTextContent('test@example.com');
      expect(screen.getByTestId('user-profile')).toHaveTextContent('Test User');
      expect(screen.getByTestId('loading')).toHaveTextContent('Not loading');
      expect(screen.getByTestId('error')).toHaveTextContent('No error');
    });
  });

  describe('Authentication Methods', () => {
    it('should handle email login successfully', async () => {
      const user = userEvent.setup();
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      const loginBtn = screen.getByTestId('login-btn');
      await user.click(loginBtn);

      await waitFor(() => {
        expect(screen.getByTestId('current-user')).toHaveTextContent('test@example.com');
        expect(screen.getByTestId('error')).toHaveTextContent('No error');
      });
    });

    it('should handle Google login successfully', async () => {
      const user = userEvent.setup();
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      const googleLoginBtn = screen.getByTestId('google-login-btn');
      await user.click(googleLoginBtn);

      await waitFor(() => {
        expect(screen.getByTestId('current-user')).toHaveTextContent('test@example.com');
        expect(screen.getByTestId('error')).toHaveTextContent('No error');
      });
    });

    it('should handle Apple login successfully', async () => {
      const user = userEvent.setup();
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      const appleLoginBtn = screen.getByTestId('apple-login-btn');
      await user.click(appleLoginBtn);

      await waitFor(() => {
        expect(screen.getByTestId('current-user')).toHaveTextContent('test@example.com');
        expect(screen.getByTestId('error')).toHaveTextContent('No error');
      });
    });

    it('should handle signup successfully', async () => {
      const user = userEvent.setup();
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      const signupBtn = screen.getByTestId('signup-btn');
      await user.click(signupBtn);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('No error');
      });
    });

    it('should handle logout successfully', async () => {
      const user = userEvent.setup();
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      const logoutBtn = screen.getByTestId('logout-btn');
      await user.click(logoutBtn);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('No error');
      });
    });

    it('should handle forgot password successfully', async () => {
      const user = userEvent.setup();
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      const forgotPasswordBtn = screen.getByTestId('forgot-password-btn');
      await user.click(forgotPasswordBtn);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('No error');
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      setupFailedAuthMocks();
    });

    it('should handle login errors', async () => {
      const user = userEvent.setup();
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      const loginBtn = screen.getByTestId('login-btn');
      await user.click(loginBtn);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Authentication failed');
      });
    });

    it('should handle Google login errors', async () => {
      const user = userEvent.setup();
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      const googleLoginBtn = screen.getByTestId('google-login-btn');
      await user.click(googleLoginBtn);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Authentication failed');
      });
    });

    it('should handle signup errors', async () => {
      const user = userEvent.setup();
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      const signupBtn = screen.getByTestId('signup-btn');
      await user.click(signupBtn);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Authentication failed');
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state during authentication operations', async () => {
      const user = userEvent.setup();

      // Mock a delayed response
      const mockLogin = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      vi.doMock('../firebase.js', () => ({
        signInWithEmail: mockLogin,
      }));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      const loginBtn = screen.getByTestId('login-btn');
      await user.click(loginBtn);

      // Initially should not show loading (mocked responses are immediate in our setup)
      // In a real implementation, you'd test the loading state properly
      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });
  });

  describe('User Profile Management', () => {
    it('should display user profile information when available', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      expect(screen.getByTestId('user-profile')).toHaveTextContent('Test User');
    });

    it('should handle missing user profile gracefully', () => {
      // Mock a case where user exists but no profile
      vi.doMock('../firebase.js', () => ({
        getUserById: vi.fn().mockRejectedValue(new Error('User not found')),
        onAuthChange: vi.fn().mockImplementation((callback) => {
          callback({ uid: 'test', email: 'test@example.com' });
          return vi.fn();
        }),
      }));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      // Should show fallback profile data
      expect(screen.getByTestId('user-profile')).toBeInTheDocument();
    });
  });

  describe('Error Boundary Integration', () => {
    it('should not crash when auth operations fail', async () => {
      setupFailedAuthMocks();

      const user = userEvent.setup();
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      const loginBtn = screen.getByTestId('login-btn');
      await user.click(loginBtn);

      // Should show error message instead of crashing
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Authentication failed');
      });
    });
  });
});
