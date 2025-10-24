/**
 * Session Hook
 * React hook for managing session state across the application
 */

import { useState, useEffect, useCallback, useContext, createContext } from 'react';

// Session Context
const SessionContext = createContext(null);

/**
 * Session Provider Component
 */
export function SessionProvider({ children }) {
  const [session, setSession] = useState({
    id: null,
    active: false,
    data: {},
    timestamp: null
  });

  // Initialize session on mount
  useEffect(() => {
    initializeSession();
  }, []);

  // Initialize new session
  const initializeSession = useCallback(() => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newSession = {
      id: sessionId,
      active: true,
      data: {
        created_at: new Date().toISOString(),
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        viewport: typeof window !== 'undefined' ? {
          width: window.innerWidth,
          height: window.innerHeight
        } : null
      },
      timestamp: Date.now()
    };

    setSession(newSession);
    
    // Store in sessionStorage for persistence
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('halloween_ar_session', JSON.stringify(newSession));
      } catch (error) {
        console.error('Failed to store session:', error);
      }
    }

    return newSession;
  }, []);

  // Update session data
  const updateSession = useCallback((data) => {
    setSession(prev => {
      const updated = {
        ...prev,
        data: {
          ...prev.data,
          ...data,
          updated_at: new Date().toISOString()
        },
        timestamp: Date.now()
      };

      // Store updated session
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('halloween_ar_session', JSON.stringify(updated));
        } catch (error) {
          console.error('Failed to update session:', error);
        }
      }

      return updated;
    });
  }, []);

  // End session
  const endSession = useCallback(() => {
    setSession(prev => ({
      ...prev,
      active: false,
      data: {
        ...prev.data,
        ended_at: new Date().toISOString()
      }
    }));

    // Clear session storage
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('halloween_ar_session');
      } catch (error) {
        console.error('Failed to clear session:', error);
      }
    }
  }, []);

  // Get current session
  const getCurrentSession = useCallback(() => {
    return session;
  }, [session]);

  const contextValue = {
    session,
    updateSession,
    endSession,
    getCurrentSession,
    initializeSession
  };

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
}

/**
 * Use Session Hook
 */
export function useSession() {
  const context = useContext(SessionContext);
  
  if (!context) {
    // If no provider, create a simple local session
    const [localSession, setLocalSession] = useState({
      id: `local_${Date.now()}`,
      active: true,
      data: {},
      timestamp: Date.now()
    });

    const updateSession = useCallback((data) => {
      setLocalSession(prev => ({
        ...prev,
        data: { ...prev.data, ...data },
        timestamp: Date.now()
      }));
    }, []);

    const endSession = useCallback(() => {
      setLocalSession(prev => ({ ...prev, active: false }));
    }, []);

    const getCurrentSession = useCallback(() => localSession, [localSession]);
    const initializeSession = useCallback(() => localSession, [localSession]);

    return {
      session: localSession,
      updateSession,
      endSession,
      getCurrentSession,
      initializeSession
    };
  }
  
  return context;
}

// Export for compatibility with existing imports
export default {
  SessionProvider,
  useSession
};