import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';

// Create a safer rendering approach
const rootElement = document.getElementById('root');

// Fallback error handler
window.addEventListener('error', (event) => {
  console.error('Caught in global error handler:', event.error);

  // Only show fallback if root is empty (app didn't render at all)
  if (rootElement && rootElement.childNodes.length === 0) {
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center; font-family: system-ui, sans-serif;">
        <h2 style="color: #d00;">Application Error</h2>
        <p>There was a problem loading the application.</p>
        <button onclick="window.location.href='/reset.html'" style="padding: 8px 16px; background: #15803d; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 10px;">
          Reset Application
        </button>
      </div>
    `;
  }
});

try {
  // Normal rendering path
  ReactDOM.createRoot(rootElement).render(<App />);
} catch (error) {
  console.error('Critical rendering error:', error);

  // Provide fallback UI
  rootElement.innerHTML = `
    <div style="padding: 20px; text-align: center; font-family: system-ui, sans-serif;">
      <h2 style="color: #d00;">Application Failed to Start</h2>
      <p>Please try resetting the application.</p>
      <button onclick="window.location.href='/reset.html'" style="padding: 8px 16px; background: #15803d; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 10px;">
        Reset Application
      </button>
    </div>
  `;
}
