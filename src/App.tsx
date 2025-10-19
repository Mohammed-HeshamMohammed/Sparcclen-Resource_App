import { readSave } from './lib/system/saveClient';
import React, { useState, useEffect } from 'react';
import { SplashScreen, Shell, ThemeSelection, ThemeProvider, WindowControls, useTheme, WelcomeLoading } from './components/Layout';
import { AuthProvider, useAuth } from '@/lib/auth';
import { SonnerToaster } from './lib/toast';
import { ProfileProvider, useProfile } from './lib/contexts/ProfileContext';
import { Login, SignUp, ForgotPassword, UpdatePassword, AuthConfirm, AuthError } from './components/Auth';

type AuthState = 'login' | 'signup' | 'forgot-password' | 'update-password' | 'auth-confirm' | 'auth-error';

interface WindowSize {
  width: number;
  height: number;
}

function MainApp() {
  const { profile, isInitialLoad } = useProfile()
  const [showWelcome, setShowWelcome] = useState(true)
  const [isMaximized, setIsMaximized] = useState(false)


  useEffect(() => {
    if (!isInitialLoad && showWelcome) {
      const timer = setTimeout(() => {}, 500)
      return () => clearTimeout(timer)
    }
  }, [isInitialLoad, showWelcome])

  useEffect(() => {
    const handleWindowResize = (size: WindowSize) => {
      const screenWidth = window.screen.width
      const screenHeight = window.screen.height
      setIsMaximized(size.width >= screenWidth - 50 && size.height >= screenHeight - 50)
    }

    if (window.api?.onWindowResize && window.api?.getWindowSize) {
      const removeListener = window.api.onWindowResize(handleWindowResize)
      window.api.getWindowSize()
        .then(handleWindowResize)
        .catch(() => setIsMaximized(false))
      return removeListener
    } else {
      setIsMaximized(false)
    }
  }, [])

  if (showWelcome) {
    return (
      <div className="h-screen w-screen overflow-hidden">
        <div className="h-full flex flex-col relative">
          <div
            className="h-10 bg-[#87CEEB] dark:bg-gray-800 flex items-center justify-between px-4 select-none flex-shrink-0 transition-colors duration-300"
            style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
          >
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300">Sparcclen</h1>
            </div>
            <WindowControls
              className="flex-shrink-0"
              isMaximized={isMaximized}
              onMaximizeToggle={() => setIsMaximized(!isMaximized)}
            />
          </div>
          <div className="flex-1">
            <WelcomeLoading
              displayName={profile.displayName}
              avatarUrl={profile.avatarUrl}
              onComplete={() => setShowWelcome(false)}
              duration={2500}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen overflow-hidden">
      <div className="h-full flex flex-col relative">
        <div
          className="h-10 bg-[#87CEEB] dark:bg-gray-800 flex items-center justify-between px-4 select-none flex-shrink-0 transition-colors duration-300"
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300">Sparcclen</h1>
          </div>
          <WindowControls
            className="flex-shrink-0"
            isMaximized={isMaximized}
            onMaximizeToggle={() => setIsMaximized(!isMaximized)}
          />
        </div>
        <div className="flex-1 overflow-hidden bg-[#87CEEB] dark:bg-gray-800 animate-fade-in-up">
          <Shell />
        </div>
      </div>
    </div>
  )
}

function AuthFlow() {
  const { user, loading } = useAuth();
  const { isFirstTime, markFirstTimeComplete, setTheme } = useTheme();
  const [showStartupSplash, setShowStartupSplash] = useState(true);
  const [showThemeSelection, setShowThemeSelection] = useState(false);
  const [authState, setAuthState] = useState<AuthState>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    
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
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [offlineSession, setOfflineSession] = useState<boolean>(false);
  const [showOfflineInterstitial, setShowOfflineInterstitial] = useState(false);
  const [offlineInterstitialDone, setOfflineInterstitialDone] = useState(false);

  const handleThemeSelect = (theme: 'system' | 'light' | 'dark') => {
    setTheme(theme);
  };

  const handleThemeConfirm = () => {
    markFirstTimeComplete();
    setShowThemeSelection(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowStartupSplash(false);
      if (isFirstTime) {
        setShowThemeSelection(true);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [isFirstTime]);

  useEffect(() => {
    const updateOnline = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);
    setIsOnline(navigator.onLine);
    (async () => {
      try {
        const s = await readSave();
        setOfflineSession(!!s.offlineSession);
      } catch {}
    })();
    const onSaveUpdated = (e: CustomEvent) => {
      try {
        const detail = e?.detail;
        if (typeof detail?.offlineSession === 'boolean') {
          setOfflineSession(!!detail.offlineSession);
        }
      } catch {}
    };
    window.addEventListener('save:updated', onSaveUpdated as EventListener);
    return () => {
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
      window.removeEventListener('save:updated', onSaveUpdated as EventListener);
    };
  }, []);

  useEffect(() => {
    const allowOffline = offlineSession && !isOnline;
    if ((user || allowOffline) && !showStartupSplash) {
      if (allowOffline && showOfflineInterstitial && !offlineInterstitialDone) {
        setShowMainApp(false);
        return;
      }
      if (isAuthSuccess) {
        const timer = setTimeout(() => {
          setShowMainApp(true);
        }, 600);
        return () => clearTimeout(timer);
      }
      setShowMainApp(true);
    } else if (!user && !allowOffline) {
      setIsAuthSuccess(false);
      setShowMainApp(false);
      setShowOfflineInterstitial(false);
      setOfflineInterstitialDone(false);
    }
  }, [isAuthSuccess, user, showStartupSplash, offlineSession, isOnline, showOfflineInterstitial, offlineInterstitialDone]);

  useEffect(() => {
    const handleWindowResize = (size: WindowSize) => {
      const screenWidth = window.screen.width;
      const screenHeight = window.screen.height;
      setIsMaximized(size.width >= screenWidth - 50 && size.height >= screenHeight - 50);
    };

    if (window.api?.onWindowResize && window.api?.getWindowSize) {
      const removeListener = window.api.onWindowResize(handleWindowResize);

      window.api.getWindowSize()
        .then((size: WindowSize) => {
          handleWindowResize(size);
        })
        .catch((error: unknown) => {
          console.warn('Failed to get window size:', error);
          setIsMaximized(false);
        });

      return () => {
        removeListener();
      };
    } else {
      setIsMaximized(false);
    }
  }, []);

  if (showStartupSplash) {
    return (
      <div className={`h-screen w-screen overflow-hidden`}>
        <div className="h-full flex flex-col relative">
          <div
            className="h-10 bg-[#87CEEB] dark:bg-gray-950 flex items-center justify-between px-4 select-none flex-shrink-0 transition-colors duration-300"
            style={{
              WebkitAppRegion: 'drag'
            } as React.CSSProperties}
          >
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300">Sparcclen</h1>
            </div>
            <WindowControls
              className="flex-shrink-0"
              isMaximized={isMaximized}
              onMaximizeToggle={() => setIsMaximized(!isMaximized)}
            />
          </div>
          <div className="flex-1 flex items-center justify-center bg-[#F0FFFF] dark:bg-gray-950">
            <SplashScreen onLoaded={() => {}} brandName="Sparcclen" tagline="Initiate the impossible" />
          </div>
        </div>
      </div>
    );
  }

  if (showThemeSelection) {
    return (
      <div className={`h-screen w-screen overflow-hidden`}>
        <div className="h-full flex flex-col relative">
          <div
            className="h-10 bg-[#87CEEB] dark:bg-gray-800 flex items-center justify-between px-4 select-none flex-shrink-0 relative z-[60] transition-colors duration-300"
            style={{
              WebkitAppRegion: 'drag'
            } as React.CSSProperties}
          >
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300">Sparcclen</h1>
            </div>
            <WindowControls
              className="flex-shrink-0"
              isMaximized={isMaximized}
              onMaximizeToggle={() => setIsMaximized(!isMaximized)}
            />
          </div>
          <div className="flex-1 overflow-hidden bg-[#F0FFFF] dark:bg-gray-950">
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
            className="h-10 bg-[#87CEEB] dark:bg-gray-950 flex items-center justify-between px-4 select-none flex-shrink-0 transition-colors duration-300"
            style={{
              WebkitAppRegion: 'drag'
            } as React.CSSProperties}
          >
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300">Sparcclen</h1>
            </div>
            <WindowControls
              className="flex-shrink-0"
              isMaximized={isMaximized}
              onMaximizeToggle={() => setIsMaximized(!isMaximized)}
            />
          </div>
          <div className="flex-1 flex items-center justify-center bg-[#F0FFFF] dark:bg-gray-950">
            <SplashScreen onLoaded={() => {}} brandName="Sparcclen" tagline="Initiate the impossible" />
          </div>
        </div>
      </div>
    );
  }

  

  if ((user || (offlineSession && !isOnline)) && !showStartupSplash && showMainApp) {
    return <MainApp />;
  }

  const handleAuthSuccess = () => {
    setIsAuthSuccess(true);
    if (!isOnline) {
      setShowOfflineInterstitial(true);
      setOfflineInterstitialDone(false);
    }
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
        <div
          className="h-10 bg-[#87CEEB] dark:bg-gray-950 flex items-center justify-between px-4 select-none flex-shrink-0 transition-colors duration-300"
          style={{
            WebkitAppRegion: 'drag'
          } as React.CSSProperties}
        >
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300">Sparcclen</h1>
          </div>
          <WindowControls
            className="flex-shrink-0"
            isMaximized={isMaximized}
            onMaximizeToggle={() => setIsMaximized(!isMaximized)}
          />
        </div>

         <div className="flex-1 flex items-center justify-center overflow-auto bg-[#F0FFFF] dark:bg-gray-950 transition-colors duration-300">
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
      <SonnerToaster position="bottom-right" toastOptions={{ unstyled: true, className: 'flex justify-end' }} />
      <AuthProvider>
        <ProfileProvider>
          <AuthFlow />
        </ProfileProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;