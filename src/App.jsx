import React, { useState, useEffect, useCallback } from 'react';

import AuthenticationWrapper from './components/common/AuthenticationWrapper';
import ErrorBoundary from './components/common/ErrorBoundary';
import InstallPrompt from './components/common/InstallPrompt';
import LoadingOverlay from './components/common/LoadingOverlay';
import NavigationMenu from './components/common/NavigationMenu';
import Dashboard from './components/Dashboard';
import PlayerManagement from './components/PlayerManagement';
import Scorecard from './components/Scorecard';
import { AuthProvider } from './contexts/AuthContext';
import { useAuthFlow } from './hooks/useAuthFlow';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { useRoundState } from './hooks/useRoundState';
import './index.css';

function MainApp() {
  // Use custom hooks for cleaner state management
  const {
    currentUser,
    userProfile,
    view,
    setView,
    authCheckFailed,
    handleAuthenticated,
    handleLogout,
    handleResetApp,
    forceRefreshApp,
  } = useAuthFlow();

  const {
    players,
    setPlayers,
    roundId,
    loading,
    selectedCourse,
    setSelectedCourse,
    startNewRound,
    clearRound,
  } = useRoundState(currentUser);

  const isConnected = useNetworkStatus();
  const [dashboardTab, setDashboardTab] = useState('profile');

  // Navigation handlers
  const handleStartRound = useCallback(async () => {
    const id = await startNewRound();
    if (id) {
      setView('round');
      window.history.pushState({}, '', `/round/${id}`);
    }
  }, [startNewRound, setView]);

  const returnToSetup = useCallback(() => {
    if (roundId && !window.confirm('Are you sure you want to leave this round? Your progress is saved.')) {
      return;
    }
    setView('setup');
    window.history.pushState({}, '', '/');
  }, [roundId, setView]);

  const navigateToDashboard = useCallback(() => {
    setView('dashboard');
    window.history.pushState({}, '', '/dashboard');
  }, [setView]);

  const handleNavigation = useCallback((newView) => {
    if (newView === 'setup') {
      returnToSetup();
    } else if (newView === 'dashboard') {
      navigateToDashboard();
    }
  }, [returnToSetup, navigateToDashboard]);


  // Check for roundId in URL and handle auth redirects
  useEffect(() => {
    if (!currentUser) {
      console.log('Not authenticated, ignoring URL navigation');
      return;
    }

    const url = new URL(window.location);
    const pathSegments = url.pathname.split('/');

    if (pathSegments.includes('dashboard')) {
      setView('dashboard');
    }
  }, [currentUser, setView]);


  // Initialize players from user profile if available
  useEffect(() => {
    if (view === 'setup' && currentUser && userProfile && players.length === 0) {
      setPlayers([
        {
          name: userProfile.displayName || currentUser.email,
          handicap: userProfile.handicap || 0,
        },
      ]);
    }
  }, [currentUser, userProfile, view, players.length, setPlayers]);

  // Render login view content
  if (view === 'login') {
    return (
      <AuthenticationWrapper
        authCheckFailed={authCheckFailed}
        onAuthenticated={handleAuthenticated}
        onResetApp={handleResetApp}
        onForceRefresh={forceRefreshApp}
      />
    );
  }

  return (
    <div className="app-container content-with-bottom-nav">
      <div className="navbar">
        <div className="navbar-brand">
          <img src="/icons/icon-192x192.png" alt="Sandbagger Logo" />
          Sandbagger
        </div>

        {currentUser && (
          <div className="navbar-buttons">
            <span className="user-welcome">
              Hello, {userProfile?.displayName || currentUser.email}
            </span>

            <NavigationMenu
              view={view}
              dashboardTab={dashboardTab}
              onNavigate={handleNavigation}
              onDashboardTabChange={setDashboardTab}
              onLogout={handleLogout}
            />
          </div>
        )}
      </div>

      <div className="container">
        <div className="header text-center">
          <p>Track golf bets, handicaps, and scorecards</p>

          <div className="tabs">
            <button
              data-testid="nav-tab-new-round"
              onClick={returnToSetup}
              className={`tab ${view === 'setup' ? 'active' : ''}`}
            >
              New Round
            </button>
            <button
              data-testid="nav-tab-dashboard"
              onClick={navigateToDashboard}
              className={`tab ${view === 'dashboard' ? 'active' : ''}`}
            >
              Dashboard
            </button>
          </div>
        </div>

        <LoadingOverlay show={loading} />

        {view === 'dashboard' ? (
          <Dashboard activeTab={dashboardTab} onTabChange={setDashboardTab} />
        ) : view === 'setup' ? (
          <div className="space-y-6">
            <PlayerManagement
              players={players}
              setPlayers={setPlayers}
              onCourseSelect={setSelectedCourse}
            />

            {players.length > 0 && (
              <div className="text-center mt-6">
                <button
                  data-testid="start-round-btn"
                  className="btn btn-primary"
                  onClick={handleStartRound}
                  disabled={loading}
                >
                  Start Round
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <Scorecard
              players={players}
              roundId={roundId}
              isConnected={isConnected}
              course={selectedCourse ? {
                name: selectedCourse.name,
                par: selectedCourse.pars || [4, 5, 3, 4, 4, 5, 3, 4, 4, 4, 5, 3, 4, 4, 5, 3, 4, 4],
                handicap: selectedCourse.handicaps || [7, 1, 15, 5, 11, 3, 17, 13, 9, 8, 2, 16, 6, 12, 4, 18, 14, 10],
              } : undefined}
            />

            <div className="text-center mt-6">
              <button
                data-testid="end-round-btn"
                className="btn btn-secondary"
                onClick={() => {
                  if (window.confirm('Do you want to end this round?')) {
                    clearRound();
                    returnToSetup();
                  }
                }}
              >
                End Round
              </button>
            </div>
          </div>
        )}
      </div>

      {/* iOS-style floating footer navigation */}
      <div className="bottom-nav">
        <a href="#" data-testid="bottom-nav-new-round" className={`bottom-nav-item ${view === 'setup' ? 'active' : ''}`} onClick={(e) => {e.preventDefault(); returnToSetup();}}>
          <span className="bottom-nav-icon">🏌️</span>
          <span>New Round</span>
        </a>
        <a
          href="#"
          data-testid="bottom-nav-scorecard"
          className={`bottom-nav-item ${view === 'round' ? 'active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            if (roundId) {
              setView('round');
            } else {
              alert('No active round. Please start a new round first.');
            }
          }}
        >
          <span className="bottom-nav-icon">📊</span>
          <span>Scorecard</span>
        </a>
        <a href="#" data-testid="bottom-nav-dashboard" className={`bottom-nav-item ${view === 'dashboard' ? 'active' : ''}`} onClick={(e) => {e.preventDefault(); navigateToDashboard();}}>
          <span className="bottom-nav-icon">📱</span>
          <span>Dashboard</span>
        </a>
        <a href="#" data-testid="bottom-nav-logout" className="bottom-nav-item" onClick={(e) => {e.preventDefault(); handleLogout();}}>
          <span className="bottom-nav-icon">👤</span>
          <span>Logout</span>
        </a>
      </div>

      <InstallPrompt />
    </div>
  );

}

function App() {
  // Wrap in a try/catch to better diagnose issues
  try {
    return (
      <ErrorBoundary>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('Error rendering App:', error);
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Something went wrong</h2>
        <p>Please try refreshing the page.</p>
        <button onClick={() => window.location.reload()}>Refresh</button>
      </div>
    );
  }
}

export default App;
