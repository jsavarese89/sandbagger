import React, { memo } from 'react';

import LandingPage from '../LandingPage';

const AuthenticationWrapper = memo(({
  authCheckFailed,
  onAuthenticated,
  onResetApp,
  onForceRefresh,
}) => {
  return (
    <>
      {authCheckFailed && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1001,
          maxWidth: '80%',
          textAlign: 'center',
        }}
        >
          <h3 style={{ color: '#ef4444', marginTop: 0 }}>Authentication Issue Detected</h3>
          <p>We've detected that you're logged in but the app isn't loading correctly.</p>
          <p>This might be due to a cached or corrupted session.</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '15px' }}>
            <button
              onClick={onForceRefresh}
              style={{
                padding: '10px 20px',
                backgroundColor: '#15803d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Refresh App
            </button>
            <button
              onClick={onResetApp}
              style={{
                padding: '10px 20px',
                backgroundColor: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Reset App & Start Fresh
            </button>
          </div>
        </div>
      )}

      <LandingPage onAuthenticated={onAuthenticated} />
    </>
  );
});

AuthenticationWrapper.displayName = 'AuthenticationWrapper';

export default AuthenticationWrapper;
