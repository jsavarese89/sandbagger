import React, { useState } from 'react';

import { useAuth } from '../../contexts/AuthContext';

function Signup({ onToggleForm }) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { signup, loginWithGoogle, loginWithApple } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!displayName || !email || !password || !confirmPassword) {
      setErrorMessage('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      await signup(email, password, displayName);
    } catch (error) {
      console.error('Signup error:', error);
      setErrorMessage(error.message || 'Failed to create an account');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      await loginWithGoogle();
      // If successful, the AuthContext will update and the modal will close
    } catch (error) {
      console.error('Google login error:', error);
      // Display a more user-friendly error message
      if (error.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Sign-in was cancelled. Please try again.');
      } else if (error.code === 'auth/popup-blocked') {
        setErrorMessage('Pop-up was blocked by your browser. Please allow pop-ups for this site.');
      } else {
        setErrorMessage(error.message || 'Failed to sign up with Google');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      await loginWithApple();
      // If successful, the AuthContext will update and the modal will close
    } catch (error) {
      console.error('Apple login error:', error);
      // Display a more user-friendly error message
      if (error.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Sign-in was cancelled. Please try again.');
      } else if (error.code === 'auth/popup-blocked') {
        setErrorMessage('Pop-up was blocked by your browser. Please allow pop-ups for this site.');
      } else {
        setErrorMessage(error.message || 'Failed to sign up with Apple');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="card-title text-center mb-6">Sign Up</h2>

      {errorMessage && (
        <div 
          className="alert alert-danger" 
          role="alert" 
          aria-live="polite"
          id="signup-error-message"
        >
          <span className="sr-only">Error: </span>
          {errorMessage}
        </div>
      )}

      <form data-testid="signup-form" onSubmit={handleSubmit} className="mb-4">
        <div className="form-group">
          <label className="form-label">Name</label>
          <input
            data-testid="displayname-input"
            type="text"
            placeholder="Display Name"
            aria-label="Display Name"
            aria-describedby={errorMessage ? "signup-error-message" : undefined}
            aria-invalid={!!errorMessage}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="form-control"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            data-testid="signup-email-input"
            type="email"
            placeholder="Email"
            aria-label="Email"
            aria-describedby={errorMessage ? "signup-error-message" : undefined}
            aria-invalid={!!errorMessage}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-control"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            data-testid="signup-password-input"
            type="password"
            placeholder="Password"
            aria-label="Password"
            aria-describedby={errorMessage ? "signup-error-message" : undefined}
            aria-invalid={!!errorMessage}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-control"
            required
            minLength={6}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Confirm Password</label>
          <input
            data-testid="confirm-password-input"
            type="password"
            placeholder="Confirm Password"
            aria-label="Confirm Password"
            aria-describedby={errorMessage ? "signup-error-message" : undefined}
            aria-invalid={!!errorMessage}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="form-control"
            required
          />
        </div>

        <button
          data-testid="signup-submit"
          type="submit"
          className="btn btn-primary btn-block mb-4"
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>

      <div className="auth-divider">
        <span className="auth-divider-text">or continue with</span>
      </div>

      <button
        data-testid="signup-google-btn"
        onClick={handleGoogleLogin}
        className="google-btn btn-block mb-3"
        disabled={loading}
      >
        <span style={{ marginRight: '0.75rem' }}>G</span>
        Continue with Google
      </button>

      <button
        data-testid="signup-apple-btn"
        onClick={handleAppleLogin}
        className="apple-btn btn-block mb-4"
        disabled={loading}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.05,11.97 C17.0236008,10.2053251 18.2895457,9.01221685 20.0530638,8.94953492 C18.9552901,7.4409584 17.1495135,6.65432173 15.28,6.8 C13.3363813,6.99340664 11.6676009,8.35899455 11.0790649,8.34972505 C10.4905288,8.34045556 8.78447136,6.92126726 7.27591341,6.92126726 C4.3564221,6.95284666 1,9.37618024 1,14.3116467 C1,16.3878856 1.60392874,18.5371901 2.5970311,20.0060639 C3.48711475,21.3241248 4.99949204,22.997423 6.75,23 C8.00625281,22.9938139 8.82421908,22.094105 10.4289062,22.094105 C11.9970703,22.094105 12.7636719,22.9938139 14.177334,22.9938139 C15.9237847,22.9876279 17.3351284,21.1673339 18.2545824,19.8545653 C19.4086202,18.1180267 19.8800794,16.4192041 19.9,16.3116467 C19.8568842,16.298762 16.9,15.1232933 16.9,11.97 L17.05,11.97 Z M13.7942627,4.97602723 C14.5357818,4.09069636 14.9852119,2.9577099 15,1.8 C13.8348616,1.85349601 12.7499305,2.37149699 11.9646879,3.23501247 C11.1794453,4.09852795 10.7282986,5.2452351 10.7,6.4 C11.8559521,6.41729682 12.9914478,5.91474243 13.7942627,4.97602723 Z" />
        </svg>
        Continue with Apple
      </button>

      <div className="text-center mt-4">
        <button
          data-testid="toggle-login-btn"
          onClick={onToggleForm}
          className="btn btn-secondary"
        >
          Already have an account? Log In
        </button>
      </div>
    </div>
  );
}

export default Signup;
