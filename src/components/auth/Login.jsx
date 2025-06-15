import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

function Login({ onToggleForm }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const { login, loginWithGoogle, loginWithApple } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setErrorMessage('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    setErrorMessage('');
    
    try {
      await login(email, password);
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage(error.message || 'Failed to log in');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMessage('');
    
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error('Google login error:', error);
      setErrorMessage(error.message || 'Failed to log in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setLoading(true);
    setErrorMessage('');
    
    try {
      await loginWithApple();
    } catch (error) {
      console.error('Apple login error:', error);
      setErrorMessage(error.message || 'Failed to log in with Apple');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6 text-green-700">Log In</h2>
      
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errorMessage}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 mb-1">Email</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        <div>
          <label className="block text-gray-700 mb-1">Password</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        <button 
          type="submit" 
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </form>
      
      <div className="mt-4">
        <div className="relative flex items-center justify-center">
          <div className="border-t border-gray-300 flex-grow"></div>
          <span className="mx-2 text-gray-500 text-sm">or</span>
          <div className="border-t border-gray-300 flex-grow"></div>
        </div>
        
        <button 
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center bg-white border border-gray-300 rounded-lg shadow-md px-6 py-2 mt-4 text-sm font-medium text-gray-800 hover:bg-gray-200 transition"
          disabled={loading}
        >
          <svg className="h-6 w-6 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" fill="#FFC107"/>
            <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" fill="#FF3D00"/>
            <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" fill="#4CAF50"/>
            <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" fill="#1976D2"/>
          </svg>
          Continue with Google
        </button>
        
        <button 
          onClick={handleAppleLogin}
          className="w-full flex items-center justify-center bg-black text-white border border-gray-300 rounded-lg shadow-md px-6 py-2 mt-3 text-sm font-medium hover:bg-gray-900 transition"
          disabled={loading}
        >
          <svg className="h-6 w-6 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white">
            <path d="M17.05,11.97 C17.0236008,10.2053251 18.2895457,9.01221685 20.0530638,8.94953492 C18.9552901,7.4409584 17.1495135,6.65432173 15.28,6.8 C13.3363813,6.99340664 11.6676009,8.35899455 11.0790649,8.34972505 C10.4905288,8.34045556 8.78447136,6.92126726 7.27591341,6.92126726 C4.3564221,6.95284666 1,9.37618024 1,14.3116467 C1,16.3878856 1.60392874,18.5371901 2.5970311,20.0060639 C3.48711475,21.3241248 4.99949204,22.997423 6.75,23 C8.00625281,22.9938139 8.82421908,22.094105 10.4289062,22.094105 C11.9970703,22.094105 12.7636719,22.9938139 14.177334,22.9938139 C15.9237847,22.9876279 17.3351284,21.1673339 18.2545824,19.8545653 C19.4086202,18.1180267 19.8800794,16.4192041 19.9,16.3116467 C19.8568842,16.298762 16.9,15.1232933 16.9,11.97 L17.05,11.97 Z M13.7942627,4.97602723 C14.5357818,4.09069636 14.9852119,2.9577099 15,1.8 C13.8348616,1.85349601 12.7499305,2.37149699 11.9646879,3.23501247 C11.1794453,4.09852795 10.7282986,5.2452351 10.7,6.4 C11.8559521,6.41729682 12.9914478,5.91474243 13.7942627,4.97602723 Z" />
          </svg>
          Continue with Apple
        </button>
      </div>
      
      <div className="text-center mt-6">
        <button 
          onClick={onToggleForm}
          className="text-green-600 hover:underline"
        >
          Don't have an account? Sign Up
        </button>
      </div>
    </div>
  );
}

export default Login;