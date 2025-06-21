import React, { useState } from 'react';

import Login from './Login';
import Signup from './Signup';

function AuthModal({ isOpen, onClose }) {
  const [isLogin, setIsLogin] = useState(true);

  const toggleForm = () => {
    setIsLogin(!isLogin);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">{isLogin ? 'Log In' : 'Sign Up'}</h3>
          <button onClick={onClose} className="modal-close" aria-label="Close">
            &times;
          </button>
        </div>

        <div className="modal-body">
          {isLogin ? (
            <Login onToggleForm={toggleForm} />
          ) : (
            <Signup onToggleForm={toggleForm} />
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthModal;
