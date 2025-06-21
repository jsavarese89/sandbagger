import React, { useState, useEffect } from 'react';

import { useAuth } from '../contexts/AuthContext';

import Login from './auth/Login';
import Signup from './auth/Signup';

const DebugButtons = () => {
  // Force refresh function
  const forceRefreshApp = () => {
    // Clear service worker caches
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          console.log('Deleting cache:', cacheName);
          caches.delete(cacheName);
        });
      });
    }

    // Force reload the page without cache
    window.location.reload(true);
  };

  // Reset app function
  const resetApp = () => {
    window.location.href = '/reset.html';
  };

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      zIndex: 9999,
      display: 'flex',
      gap: '10px',
    }}
    >
      <button
        onClick={forceRefreshApp}
        style={{
          padding: '8px 16px',
          backgroundColor: '#15803d',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '14px',
        }}
      >
        Force Refresh
      </button>
      <button
        onClick={resetApp}
        style={{
          padding: '8px 16px',
          backgroundColor: '#6366f1',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '14px',
        }}
      >
        Reset App
      </button>
    </div>
  );
};

const LandingPage = ({ onAuthenticated }) => {
  const [isLogin, setIsLogin] = useState(true);
  const { currentUser } = useAuth();

  const toggleForm = () => {
    setIsLogin(!isLogin);
  };

  // If user is already authenticated, redirect to main app
  useEffect(() => {
    if (currentUser) {
      console.log('LandingPage detected authentication, redirecting');
      // Use a small timeout to ensure browser compatibility
      setTimeout(() => {
        onAuthenticated();
      }, 50);
    }
  }, [currentUser, onAuthenticated]);

  // Don't return null immediately, let the parent component handle the view change
  // This prevents "flash of no content" on some browsers
  if (currentUser) {
    return (
      <div
        className="loading-overlay"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '3px solid rgba(21, 128, 61, 0.2)',
            borderRadius: '50%',
            borderTopColor: '#15803d',
            animation: 'spin 1s ease-in-out infinite',
            margin: '0 auto 20px',
          }}
          />
          <p style={{ color: '#15803d', fontWeight: 'bold' }}>Loading...</p>
        </div>

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
        </style>
      </div>
    );
  }

  return (
    <div className="landing-page">
      {/* Always show debug buttons */}
      <DebugButtons />

      <div className="header text-center">
        <div className="app-logo">
          <img src="/icons/icon-192x192.png" alt="Sandbagger Logo" className="logo-image" />
        </div>
        <h1>Sandbagger</h1>
        <p>Track golf bets, handicaps, and scorecards</p>
      </div>

      <div className="auth-container">
        {isLogin ? (
          <Login onToggleForm={toggleForm} />
        ) : (
          <Signup onToggleForm={toggleForm} />
        )}
      </div>

      <div className="features-section">
        <h2>Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Scorecard Tracking</h3>
            <p>Track scores for up to 4 players with handicap calculations</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💰</div>
            <h3>Bet Management</h3>
            <p>Track various golf bets: Nassau, Skins, Match Play and more</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🏌️</div>
            <h3>Stat Tracking</h3>
            <p>Monitor your performance with detailed statistics</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3>Social Features</h3>
            <p>Connect with friends and share your rounds</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
