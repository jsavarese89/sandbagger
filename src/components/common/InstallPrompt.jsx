import React, { useState, useEffect, memo, useCallback } from 'react';

const InstallPrompt = memo(() => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  const handleInstall = useCallback(async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  }, [deferredPrompt]);

  const closeInstallPrompt = useCallback(() => {
    setShowInstallPrompt(false);
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => {
        setShowInstallPrompt(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!showInstallPrompt) return null;

  return (
    <div className="install-prompt">
      <div className="install-prompt-header">
        <span className="install-prompt-title">Add to Home Screen</span>
        <button className="install-close" onClick={closeInstallPrompt}>×</button>
      </div>
      <p>Install Sandbagger as an app on your device for easy access while golfing.</p>
      <div className="install-buttons">
        <button className="install-btn install-yes" onClick={handleInstall}>Install</button>
        <button className="install-btn install-no" onClick={closeInstallPrompt}>Not Now</button>
      </div>
    </div>
  );
});

InstallPrompt.displayName = 'InstallPrompt';

export default InstallPrompt;
