import React, { createContext, useContext, useState, useEffect } from 'react';

import {
  onAuthChange,
  signInWithEmail,
  signInWithGoogle,
  signInWithApple,
  signUpWithEmail,
  signOut,
  resetPassword,
  getUserById,
} from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Initial setup phase to prevent flash of content
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      console.log('Auth state changed:', user ? `User ${user.displayName || user.email}` : 'No user');

      // For debugging - log auth state to see if Firebase auth is working
      console.log('Auth state in context:', user ? 'User is authenticated' : 'No authenticated user');

      // Set current user state
      setCurrentUser(user);
      setLoading(true);

      if (user) {
        try {
          // Get additional user data from Firestore
          console.log('Fetching user data for:', user.uid);
          const userData = await getUserById(user.uid);
          console.log('User data fetched:', userData ? 'success' : 'not found');

          if (userData) {
            setUserProfile(userData);
            // User successfully authenticated and data loaded
            console.log('Authentication successful - user data loaded');
          } else {
            console.warn('User authenticated but no profile data found');
            // Handle case where auth succeeds but no user document exists
            setUserProfile({
              displayName: user.displayName || user.email,
              email: user.email,
              handicap: 0,
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Fallback to basic profile
          setUserProfile({
            displayName: user.displayName || user.email,
            email: user.email,
            handicap: 0,
          });
        }
      } else {
        setUserProfile(null);
      }

      setLoading(false);
      setInitializing(false);
    });

    // Set a timeout to ensure we don't get stuck in initializing state
    const timeout = setTimeout(() => {
      setInitializing(false);
    }, 5000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  // Login with email and password
  const login = async (email, password) => {
    setError('');
    try {
      const user = await signInWithEmail(email, password);
      // Immediately set the current user to prevent lag in state update
      setCurrentUser(user);

      // Trigger an immediate view change to setup instead of waiting for the auth listener
      console.log('Manual auth state update after email login');

      // Also try to get user data immediately
      try {
        const userData = await getUserById(user.uid);
        if (userData) {
          setUserProfile(userData);
        } else {
          // Fallback profile if no user document exists
          setUserProfile({
            displayName: user.displayName || user.email,
            email: user.email,
            handicap: 0,
          });
        }
      } catch (userDataError) {
        console.error('Error fetching user data after login:', userDataError);
        // Use fallback profile
        setUserProfile({
          displayName: user.displayName || user.email,
          email: user.email,
          handicap: 0,
        });
      }

      return user;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Sign up with email and password
  const signup = async (email, password, displayName) => {
    setError('');
    try {
      await signUpWithEmail(email, password, displayName);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Login with Google
  const loginWithGoogle = async () => {
    setError('');
    try {
      const user = await signInWithGoogle();
      // Immediately set the current user to prevent lag in state update
      setCurrentUser(user);

      // Also try to get user data immediately
      try {
        const userData = await getUserById(user.uid);
        if (userData) {
          setUserProfile(userData);
        } else {
          // Fallback profile if no user document exists
          setUserProfile({
            displayName: user.displayName || user.email,
            email: user.email,
            handicap: 0,
          });
        }
        setLoading(false); // Ensure loading is set to false
      } catch (userDataError) {
        console.error('Error fetching user data after Google login:', userDataError);
        // Use fallback profile
        setUserProfile({
          displayName: user.displayName || user.email,
          email: user.email,
          handicap: 0,
        });
        setLoading(false);
      }

      return user;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Login with Apple
  const loginWithApple = async () => {
    setError('');
    try {
      const user = await signInWithApple();
      // Immediately set the current user to prevent lag in state update
      setCurrentUser(user);

      // Also try to get user data immediately
      try {
        const userData = await getUserById(user.uid);
        if (userData) {
          setUserProfile(userData);
        } else {
          // Fallback profile if no user document exists
          setUserProfile({
            displayName: user.displayName || 'Apple User',
            email: user.email,
            handicap: 0,
          });
        }
        setLoading(false); // Ensure loading is set to false
      } catch (userDataError) {
        console.error('Error fetching user data after Apple login:', userDataError);
        // Use fallback profile
        setUserProfile({
          displayName: user.displayName || 'Apple User',
          email: user.email,
          handicap: 0,
        });
        setLoading(false);
      }

      return user;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    setError('');
    try {
      await signOut();
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Reset password
  const forgotPassword = async (email) => {
    setError('');
    try {
      await resetPassword(email);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    error,
    login,
    signup,
    loginWithGoogle,
    loginWithApple,
    logout,
    forgotPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {!initializing && children}
    </AuthContext.Provider>
  );
}
