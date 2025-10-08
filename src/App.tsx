import React, { useState, useEffect } from 'react';
import { SplashScreen } from './components/Layout/SplashScreen';
import { Shell } from './components/Layout/Shell';
import { ThemeSelection } from './components/Layout/ThemeSelection';
import { ThemeProvider } from './components/Layout/ThemeProvider';
import { AuthProvider, useAuth } from './lib/auth';
import { useTheme } from './components/Layout/ThemeProvider';
import Login from './components/Auth/Login';
import SignUp from './components/Auth/SignUp';
import ForgotPassword from './components/Auth/ForgotPassword';
import UpdatePassword from './components/Auth/UpdatePassword';
import AuthConfirm from './components/Auth/AuthConfirm';
import AuthError from './components/Auth/AuthError';
import { WindowControls } from './components/Layout/WindowControls';

type AuthState = 'login' | 'signup' | 'forgot-password' | 'update-password' | 'auth-confirm' | 'auth-error';

function AuthFlow() {
  const { user, loading } = useAuth();
  const { isFirstTime, markFirstTimeComplete, setTheme } = useTheme();
  const [showStartupSplash, setShowStartupSplash] = useState(true);
  const [showThemeSelection, setShowThemeSelection] = useState(false);
  const [authState, setAuthState] = useState<AuthState>(() => {
    // Check URL parameters to determine initial state
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    
    // Check both query params and hash fragment for Supabase tokens
    if ((urlParams.get('token_hash') || hashParams.get('token_hash')) && 
        (urlParams.get('type') || hashParams.get('type'))) {
      return 'auth-confirm';
    }
    if (urlParams.get('error') || hashParams.get('error')) {
      return 'auth-error';
    }
    return 'login';
  });

  const [isMaximized, setIsMaximized] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isAuthSuccess, setIsAuthSuccess] = useState(false);
  const [showMainApp, setShowMainApp] = useState(false);

  const handleThemeSelect = (theme: 'system' | 'light' | 'dark') => {
    // Theme is applied immediately for preview
    setTheme(theme);
  };

  const handleThemeConfirm = () => {
    // Confirm button was clicked, close the selection screen
    markFirstTimeComplete();
    setShowThemeSelection(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowStartupSplash(false);
      // Show theme selection for first-time users
      if (isFirstTime) {
        setShowThemeSelection(true);
      }
    }, 2000); // Reduced splash time for better UX
    return () => clearTimeout(timer);
  }, [isFirstTime]);

  // Handle transition from auth success to main app
  useEffect(() => {
    if (user && !showStartupSplash) {
      if (isAuthSuccess) {
        // Wait for card slide down animation to complete, then show main app
        const timer = setTimeout(() => {
          setShowMainApp(true);
        }, 600); // Match the slide-down animation duration
        return () => clearTimeout(timer);
      } else {
        // User is already authenticated (e.g., page refresh), show app immediately
        setShowMainApp(true);
      }
    } else if (!user) {
      // User logged out, reset animation states
      setIsAuthSuccess(false);
      setShowMainApp(false);
    }
  }, [isAuthSuccess, user, showStartupSplash]);

  useEffect(() => {
    // Listen for window resize events from main process
    const handleWindowResize = (size: { width: number; height: number }) => {
      // Consider window maximized if it's close to screen size
      const screenWidth = window.screen.width;
      const screenHeight = window.screen.height;
      setIsMaximized(size.width >= screenWidth - 50 && size.height >= screenHeight - 50);
    };

    if (window.api?.onWindowResize && window.api?.getWindowSize) {
      const removeListener = window.api.onWindowResize(handleWindowResize);

      // Initial check with error handling
      window.api.getWindowSize()
        .then((size: { width: number; height: number }) => {
          handleWindowResize(size);
        })
        .catch((error) => {
          console.warn('Failed to get window size:', error);
          // Fallback: assume not maximized
          setIsMaximized(false);
        });

      return () => {
        removeListener();
      };
    } else {
      // Fallback: assume not maximized if API is not available
      setIsMaximized(false);
    }
  }, []);

  if (showStartupSplash) {
    return (
      <div className={`h-screen w-screen overflow-hidden`}>
        <div className="h-full flex flex-col relative">
          <div
            className="h-10 bg-gray-50 dark:bg-gray-950 flex items-center justify-between px-4 select-none flex-shrink-0 transition-colors duration-300"
            style={{
              WebkitAppRegion: 'drag'
            } as React.CSSProperties}
          >
            <div className="flex items-center space-x-4">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300">
                Sparcclen
              </h1>
            </div>
            <WindowControls
              className="flex-shrink-0"
              isMaximized={isMaximized}
              onMaximizeToggle={() => setIsMaximized(!isMaximized)}
            />
          </div>
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-950">
            <SplashScreen onLoaded={() => {}} brandName="Sparcclen" tagline="Initiate the impossible" />
          </div>
        </div>
      </div>
    );
  }

  // Show theme selection for first-time users
  if (showThemeSelection) {
    return (
      <div className={`h-screen w-screen overflow-hidden`}>
        <div className="h-full flex flex-col relative">
          <div
            className="h-10 bg-white dark:bg-gray-950 flex items-center justify-between px-4 select-none flex-shrink-0 relative z-[60] transition-colors duration-300"
            style={{
              WebkitAppRegion: 'drag'
            } as React.CSSProperties}
          >
            <div className="flex items-center space-x-4">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300">
                Sparcclen
              </h1>
            </div>
            <WindowControls
              className="flex-shrink-0"
              isMaximized={isMaximized}
              onMaximizeToggle={() => setIsMaximized(!isMaximized)}
            />
          </div>
          <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-950">
            <ThemeSelection onThemeSelect={handleThemeSelect} onConfirm={handleThemeConfirm} isVisible={true} />
          </div>
        </div>
      </div>
    );
  }

  if (loading && !showStartupSplash) {
    return (
      <div className={`h-screen w-screen overflow-hidden`}>
        <div className="h-full flex flex-col relative">
          <div
            className="h-10 bg-gray-50 dark:bg-gray-950 flex items-center justify-between px-4 select-none flex-shrink-0 transition-colors duration-300"
            style={{
              WebkitAppRegion: 'drag'
            } as React.CSSProperties}
          >
            <div className="flex items-center space-x-4">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300">
                Sparcclen
              </h1>
            </div>
            <WindowControls
              className="flex-shrink-0"
              isMaximized={isMaximized}
              onMaximizeToggle={() => setIsMaximized(!isMaximized)}
            />
          </div>
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-950">
            <SplashScreen onLoaded={() => {}} brandName="Sparcclen" tagline="Initiate the impossible" />
          </div>
        </div>
      </div>
    );
  }

  if (user && !showStartupSplash) {
    return (
      <div className={`h-screen w-screen overflow-hidden`}>
        <div className="h-full flex flex-col relative">
          {/* Custom Title Bar - Always Visible */}
          <div
            className="h-10 bg-gray-900 dark:bg-gray-800 flex items-center justify-between px-4 select-none flex-shrink-0 transition-colors duration-300"
            style={{
              WebkitAppRegion: 'drag'
            } as React.CSSProperties}
          >
            <div className="flex items-center space-x-4">
              <h1 className="text-lg font-semibold text-white transition-colors duration-300">
                Sparcclen
              </h1>
            </div>
            <WindowControls
              className="flex-shrink-0"
              isMaximized={isMaximized}
              onMaximizeToggle={() => setIsMaximized(!isMaximized)}
            />
          </div>
          <div className={`flex-1 overflow-hidden bg-gray-900 dark:bg-gray-800 ${showMainApp ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <Shell />
          </div>
        </div>
      </div>
    );
  }

  const handleAuthSuccess = () => {
    setIsAuthSuccess(true);
    // Auth state will be handled by the auth context
  };

  const handleBackToLogin = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setAuthState('login');
      setTimeout(() => setIsTransitioning(false), 50);
    }, 200);
  };

  const handleAuthStateChange = (newState: AuthState) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setAuthState(newState);
      setTimeout(() => setIsTransitioning(false), 50);
    }, 200);
  };

  const renderAuthScreen = () => {
    switch (authState) {
      case 'login':
        return (
          <Login
            onSuccess={handleAuthSuccess}
            onSignUp={() => handleAuthStateChange('signup')}
            onForgotPassword={() => handleAuthStateChange('forgot-password')}
            isTransitioning={isTransitioning}
          />
        );
      case 'signup':
        return (
          <SignUp
            onSuccess={handleBackToLogin}
            onBackToLogin={handleBackToLogin}
            onForgotPassword={() => handleAuthStateChange('forgot-password')}
            isTransitioning={isTransitioning}
          />
        );
      case 'forgot-password':
        return (
          <ForgotPassword onBack={handleBackToLogin} isTransitioning={isTransitioning} />
        );
      case 'update-password':
        return (
          <UpdatePassword onSuccess={handleAuthSuccess} isTransitioning={isTransitioning} />
        );
      case 'auth-confirm':
        return (
          <AuthConfirm isTransitioning={isTransitioning} />
        );
      case 'auth-error':
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        return (
          <AuthError 
            error={urlParams.get('error') || hashParams.get('error') || undefined} 
            isTransitioning={isTransitioning}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={`h-screen w-screen overflow-hidden`}>
      <div className="h-full flex flex-col relative">
        {/* Custom Title Bar - Always Visible */}
        <div
          className="h-10 bg-gray-50 dark:bg-gray-950 flex items-center justify-between px-4 select-none flex-shrink-0 transition-colors duration-300"
          style={{
            WebkitAppRegion: 'drag'
          } as React.CSSProperties}
        >
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300">
              Sparcclen
            </h1>
          </div>
          <WindowControls
            className="flex-shrink-0"
            isMaximized={isMaximized}
            onMaximizeToggle={() => setIsMaximized(!isMaximized)}
          />
        </div>

         {/* Auth Content with swipe-in after splash ends */}
         <div className="flex-1 flex items-center justify-center overflow-auto bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
           <div className={`${showStartupSplash ? 'opacity-0' : isAuthSuccess ? 'animate-slide-down' : 'animate-swipe-in'}`}>
             {renderAuthScreen()}
           </div>
         </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthFlow />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;