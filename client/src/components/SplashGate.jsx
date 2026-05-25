import React, { useState } from 'react';
import SplashScreen from './SplashScreen';

/**
 * Shows splash once per browser session on first app load.
 */
const SplashGate = ({ children }) => {
  const [showSplash, setShowSplash] = useState(
    () => !sessionStorage.getItem('donow_splash_seen')
  );

  if (showSplash) {
    return (
      <SplashScreen onComplete={() => setShowSplash(false)} />
    );
  }

  return children;
};

export default SplashGate;
