import { useState, useEffect, useCallback } from 'react';

import { useAuth } from '../contexts/AuthContext';

export const useAuthFlow = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const [view, setView] = useState('login');
  const [authCheckFailed, setAuthCheckFailed] = useState(false);

  const handleAuthenticated = useCallback(() => {
    setView('setup');
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      setView('login');
      window.history.pushState({}, '', '/');
      localStorage.removeItem('currentRoundId');

      await logout();

      setTimeout(() => {
        setView('login');
        console.log('Forced redirect to login after logout');
      }, 100);
    } catch (error) {
      console.error('Error logging out:', error);
      setView('login');
    }
  }, [logout]);

  const handleResetApp = useCallback(() => {
    window.location.href = '/reset.html';
  }, []);

  const forceRefreshApp = useCallback(() => {
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          console.log('Deleting cache:', cacheName);
          caches.delete(cacheName);
        });
      });
    }
    window.location.reload(true);
  }, []);

  // Check for auth state changes and set up view
  useEffect(() => {
    if (currentUser && view === 'login') {
      console.log('User authenticated, redirecting to setup view');
      setTimeout(() => {
        setView('setup');
        console.log('View changed to setup');
      }, 50);
    }

    if (currentUser && !['setup', 'round', 'dashboard'].includes(view)) {
      console.log('User has invalid view state, resetting to setup');
      setView('setup');
    }

    if (!currentUser && view !== 'login') {
      console.log('User not authenticated, redirecting to login view');
      setView('login');
    }
  }, [currentUser, view]);

  // Additional safety check - if we detect authentication but UI hasn't updated
  useEffect(() => {
    let viewCheckTimeout;

    if (currentUser && view === 'login') {
      viewCheckTimeout = setTimeout(() => {
        console.log('Safety check: still on login view despite auth, forcing update');
        setView('setup');
      }, 300);
    }

    return () => clearTimeout(viewCheckTimeout);
  }, [currentUser, view]);

  // Authentication check timeout effect
  useEffect(() => {
    let authCheckTimeout;

    if (currentUser && view === 'login') {
      authCheckTimeout = setTimeout(() => {
        console.log('Authentication check failed - user logged in but stuck at login screen');
        setAuthCheckFailed(true);
      }, 5000);
    }

    return () => clearTimeout(authCheckTimeout);
  }, [currentUser, view]);

  return {
    currentUser,
    userProfile,
    view,
    setView,
    authCheckFailed,
    handleAuthenticated,
    handleLogout,
    handleResetApp,
    forceRefreshApp,
  };
};
