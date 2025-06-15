import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthChange, 
  signInWithEmail, 
  signInWithGoogle,
  signInWithApple, 
  signUpWithEmail, 
  signOut, 
  resetPassword,
  getUserById
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

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setCurrentUser(user);
      setLoading(true);
      
      if (user) {
        try {
          // Get additional user data from Firestore
          const userData = await getUserById(user.uid);
          setUserProfile(userData);
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Login with email and password
  const login = async (email, password) => {
    setError('');
    try {
      await signInWithEmail(email, password);
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
      await signInWithGoogle();
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };
  
  // Login with Apple
  const loginWithApple = async () => {
    setError('');
    try {
      await signInWithApple();
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
    forgotPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}