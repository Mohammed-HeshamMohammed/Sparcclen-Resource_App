import React, { useState, useEffect } from 'react';
import { SplashScreen } from './components/Layout/SplashScreen';
import { Shell } from './components/Layout/Shell';
import { AuthProvider, useAuth } from './lib/auth';
import Login from './components/Auth/Login';
import SignUp from './components/Auth/SignUp';
import ForgotPassword from './components/Auth/ForgotPassword';
import UpdatePassword from './components/Auth/UpdatePassword';
import AuthConfirm from './components/Auth/AuthConfirm';
import AuthError from './components/Auth/AuthError';
import { WindowControls } from './components/Layout/WindowControls';
import './lib/database/databaseInit'; // Initialize encrypted database

type AuthState = 'login' | 'signup' | 'forgot-password' | 'update-password' | 'auth-confirm' | 'auth-error';

function AuthFlow() {
  const { user, loading } = useAuth();
  const [authState, setAuthState] = useState<AuthState>(() => {
    // Check URL parameters to determine initial state
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('token_hash') && urlParams.get('type')) {
      return 'auth-confirm';
    }
    if (urlParams.get('error')) {
      return 'auth-error';
    }
    return 'login';
  });

  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // Listen for window resize events from main process
    const handleWindowResize = (size: { width: number; height: number }) => {
      // Consider window maximized if it's close to screen size
      const screenWidth = window.screen.width;
      const screenHeight = window.screen.height;
      setIsMaximized(size.width >= screenWidth - 50 && size.height >= screenHeight - 50);
    };

    if (window.api?.onWindowResize) {
      const removeListener = window.api.onWindowResize(handleWindowResize);

      // Initial check
      window.api?.getWindowSize().then((size: { width: number; height: number }) => {
        handleWindowResize(size);
      });

      return () => {
        removeListener();
      };
    }
  }, []);

  if (loading) {
    return (
      <div className={`h-screen w-screen bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl`}>
        <div className="h-full flex flex-col relative">
          <div
            className="h-10 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl flex items-center justify-between px-4 select-none flex-shrink-0"
            style={{
              WebkitAppRegion: 'drag',
              borderTop: '1px solid transparent',
              borderLeft: '1px solid transparent',
              borderRight: '1px solid transparent'
            } as React.CSSProperties}
          >
            <div className="flex items-center space-x-4">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                Resource Hub
              </h1>
            </div>
            <WindowControls
              className="flex-shrink-0"
              isMaximized={isMaximized}
              onMaximizeToggle={() => setIsMaximized(!isMaximized)}
            />
          </div>
          <div className="flex-1 flex items-center justify-center">
            <SplashScreen onLoaded={() => {}} brandName="Resource Hub" />
          </div>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className={`h-screen w-screen bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl`}>
        <div className="h-full flex flex-col relative">
          {/* Custom Title Bar - Always Visible */}
          <div
            className="h-10 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl flex items-center justify-between px-4 select-none flex-shrink-0"
            style={{
              WebkitAppRegion: 'drag',
              borderTop: '1px solid transparent',
              borderLeft: '1px solid transparent',
              borderRight: '1px solid transparent'
            } as React.CSSProperties}
          >
            <div className="flex items-center space-x-4">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                Resource Hub
              </h1>
            </div>
            <WindowControls
              className="flex-shrink-0"
              isMaximized={isMaximized}
              onMaximizeToggle={() => setIsMaximized(!isMaximized)}
            />
          </div>
          <div className="flex-1">
            <Shell />
          </div>
        </div>
      </div>
    );
  }

  const handleAuthSuccess = () => {
    // Auth state will be handled by the auth context
  };

  const handleBackToLogin = () => {
    setAuthState('login');
  };

  const renderAuthScreen = () => {
    switch (authState) {
      case 'login':
        return (
          <div className="transition-all duration-500 ease-in-out transform">
            <Login
              onSuccess={handleAuthSuccess}
              onSignUp={() => setAuthState('signup')}
              onForgotPassword={() => setAuthState('forgot-password')}
            />
          </div>
        );
      case 'signup':
        return (
          <div className="transition-all duration-500 ease-in-out transform">
            <SignUp
              onSuccess={handleBackToLogin}
              onBackToLogin={handleBackToLogin}
            />
          </div>
        );
      case 'forgot-password':
        return (
          <div className="transition-all duration-500 ease-in-out transform">
            <ForgotPassword onBack={handleBackToLogin} />
          </div>
        );
      case 'update-password':
        return (
          <div className="transition-all duration-500 ease-in-out transform">
            <UpdatePassword onSuccess={handleAuthSuccess} />
          </div>
        );
      case 'auth-confirm':
        return (
          <div className="transition-all duration-500 ease-in-out transform">
            <AuthConfirm />
          </div>
        );
      case 'auth-error':
        return (
          <div className="transition-all duration-500 ease-in-out transform">
            <AuthError error={new URLSearchParams(window.location.search).get('error') || undefined} />
          </div>
        );
        return null;
    }
  };

  return (
    <div className={`h-screen w-screen bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl`}>
      <div className="h-full flex flex-col relative">
        {/* Custom Title Bar - Always Visible */}
        <div
          className="h-10 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl flex items-center justify-between px-4 select-none flex-shrink-0"
          style={{
            WebkitAppRegion: 'drag',
            borderTop: '1px solid transparent',
            borderLeft: '1px solid transparent',
            borderRight: '1px solid transparent'
          } as React.CSSProperties}
        >
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Resource Hub
            </h1>
          </div>
          <WindowControls
            className="flex-shrink-0"
            isMaximized={isMaximized}
            onMaximizeToggle={() => setIsMaximized(!isMaximized)}
          />
        </div>

        {/* Auth Content */}
        <div className="flex-1 flex items-center justify-center overflow-auto">
          {renderAuthScreen()}
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AuthFlow />
    </AuthProvider>
  );
}

export default App;