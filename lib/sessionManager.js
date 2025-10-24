/**
 * Session Management for Halloween AR Experience
 * Tracks user sessions, QR code interactions, and AR experience state
 */

/**
 * Session states
 */
const SessionStates = {
  INACTIVE: 'inactive',
  ACTIVE: 'active',
  AR_ACTIVE: 'ar_active',
  COMPLETED: 'completed',
  ERROR: 'error'
};

/**
 * Interaction types for tracking
 */
const InteractionTypes = {
  PAGE_VISIT: 'page_visit',
  QR_SCAN: 'qr_scan',
  AR_START: 'ar_start',
  AR_MESSAGE_VIEW: 'ar_message_view',
  AR_END: 'ar_end',
  CAMERA_PERMISSION: 'camera_permission',
  ERROR_OCCURRED: 'error_occurred'
};

/**
 * Session manager class
 */
export class SessionManager {
  constructor() {
    this.sessionId = null;
    this.sessionState = SessionStates.INACTIVE;
    this.sessionData = {};
    this.interactions = [];
    this.startTime = null;
    this.lastActivityTime = null;
    this.listeners = [];
    
    // Session timeout (30 minutes of inactivity)
    this.sessionTimeout = 30 * 60 * 1000;
    this.timeoutId = null;
    
    this.initialize();
  }

  /**
   * Initialize session manager
   */
  async initialize() {
    try {
      // Generate session ID
      this.sessionId = this.generateSessionId();
      
      // Load existing session data if available
      this.loadSessionData();
      
      // Start new session
      this.startSession();
      
      // Setup activity tracking
      this.setupActivityTracking();
      
    } catch (error) {
      console.error('Failed to initialize session manager:', error);
    }
  }

  /**
   * Generate unique session ID
   * @returns {string} Session ID
   */
  generateSessionId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `halloween_ar_${timestamp}_${random}`;
  }

  /**
   * Start a new session
   */
  startSession() {
    this.startTime = new Date();
    this.lastActivityTime = new Date();
    this.sessionState = SessionStates.ACTIVE;
    
    this.sessionData = {
      sessionId: this.sessionId,
      startTime: this.startTime.toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      language: typeof navigator !== 'undefined' ? navigator.language : 'Unknown',
      screenSize: typeof screen !== 'undefined' ? {
        width: screen.width,
        height: screen.height,
        pixelRatio: window.devicePixelRatio || 1
      } : null,
      url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
      referrer: typeof document !== 'undefined' ? document.referrer : 'Unknown'
    };

    // Track session start
    this.trackInteraction(InteractionTypes.PAGE_VISIT, {
      sessionStart: true,
      url: this.sessionData.url
    });

    // Reset session timeout
    this.resetSessionTimeout();
    
    // Save session data
    this.saveSessionData();
    
    // Notify listeners
    this.notifyListeners('sessionStart', this.sessionData);
  }

  /**
   * End current session
   */
  endSession() {
    if (this.sessionState === SessionStates.INACTIVE) {
      return;
    }

    const endTime = new Date();
    const duration = endTime - this.startTime;

    this.sessionData.endTime = endTime.toISOString();
    this.sessionData.duration = duration;
    this.sessionData.interactionCount = this.interactions.length;
    
    this.sessionState = SessionStates.COMPLETED;
    
    // Clear timeout
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    
    // Save final session data
    this.saveSessionData();
    
    // Notify listeners
    this.notifyListeners('sessionEnd', this.sessionData);
  }

  /**
   * Track user interaction
   * @param {string} type - Interaction type
   * @param {Object} data - Interaction data
   */
  trackInteraction(type, data = {}) {
    if (this.sessionState === SessionStates.INACTIVE) {
      return;
    }

    const interaction = {
      id: this.generateInteractionId(),
      sessionId: this.sessionId,
      type,
      timestamp: new Date().toISOString(),
      data
    };

    this.interactions.push(interaction);
    this.lastActivityTime = new Date();
    
    // Reset session timeout
    this.resetSessionTimeout();
    
    // Save session data
    this.saveSessionData();
    
    // Notify listeners
    this.notifyListeners('interaction', interaction);

    // Handle specific interaction types
    this.handleSpecialInteractions(type, data);
  }

  /**
   * Handle special interaction types that change session state
   * @param {string} type - Interaction type
   * @param {Object} data - Interaction data
   */
  handleSpecialInteractions(type, data) {
    switch (type) {
      case InteractionTypes.AR_START:
        this.sessionState = SessionStates.AR_ACTIVE;
        this.sessionData.arStartTime = new Date().toISOString();
        break;
        
      case InteractionTypes.AR_END:
        if (this.sessionState === SessionStates.AR_ACTIVE) {
          this.sessionState = SessionStates.ACTIVE;
          this.sessionData.arEndTime = new Date().toISOString();
          
          // Calculate AR session duration
          if (this.sessionData.arStartTime) {
            const arDuration = new Date() - new Date(this.sessionData.arStartTime);
            this.sessionData.arDuration = arDuration;
          }
        }
        break;
        
      case InteractionTypes.ERROR_OCCURRED:
        this.sessionData.hasErrors = true;
        if (!this.sessionData.errors) {
          this.sessionData.errors = [];
        }
        this.sessionData.errors.push(data);
        break;
    }
  }

  /**
   * Generate unique interaction ID
   * @returns {string} Interaction ID
   */
  generateInteractionId() {
    return `int_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  /**
   * Setup activity tracking to detect user activity
   */
  setupActivityTracking() {
    if (typeof window === 'undefined') {
      return;
    }

    const updateActivity = () => {
      this.lastActivityTime = new Date();
      this.resetSessionTimeout();
    };

    // Track various user activities
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackInteraction('page_hidden');
      } else {
        this.trackInteraction('page_visible');
        updateActivity();
      }
    });

    // Track beforeunload to end session
    window.addEventListener('beforeunload', () => {
      this.endSession();
    });
  }

  /**
   * Reset session timeout
   */
  resetSessionTimeout() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      this.endSession();
    }, this.sessionTimeout);
  }

  /**
   * Save session data to local storage
   */
  saveSessionData() {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      const sessionInfo = {
        sessionData: this.sessionData,
        interactions: this.interactions.slice(-50), // Keep last 50 interactions
        sessionState: this.sessionState,
        lastSaved: new Date().toISOString()
      };

      localStorage.setItem('halloween_ar_session', JSON.stringify(sessionInfo));
    } catch (error) {
      console.warn('Failed to save session data:', error);
    }
  }

  /**
   * Load session data from local storage
   */
  loadSessionData() {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      const stored = localStorage.getItem('halloween_ar_session');
      if (stored) {
        const sessionInfo = JSON.parse(stored);
        
        // Check if session is recent (within 24 hours)
        const lastSaved = new Date(sessionInfo.lastSaved);
        const now = new Date();
        const timeDiff = now - lastSaved;
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        if (hoursDiff < 24) {
          // Restore some session data for continuity
          this.interactions = sessionInfo.interactions || [];
        }
      }
    } catch (error) {
      console.warn('Failed to load session data:', error);
    }
  }

  /**
   * Get session statistics
   * @returns {Object} Session statistics
   */
  getSessionStats() {
    const now = new Date();
    const duration = this.startTime ? now - this.startTime : 0;
    
    const stats = {
      sessionId: this.sessionId,
      state: this.sessionState,
      duration,
      interactionCount: this.interactions.length,
      startTime: this.startTime?.toISOString(),
      lastActivity: this.lastActivityTime?.toISOString()
    };

    // Count interaction types
    stats.interactionTypes = {};
    this.interactions.forEach(interaction => {
      stats.interactionTypes[interaction.type] = (stats.interactionTypes[interaction.type] || 0) + 1;
    });

    // AR-specific stats
    if (this.sessionData.arStartTime) {
      stats.arSessionStarted = true;
      stats.arStartTime = this.sessionData.arStartTime;
      
      if (this.sessionData.arEndTime) {
        stats.arDuration = this.sessionData.arDuration;
      } else if (this.sessionState === SessionStates.AR_ACTIVE) {
        stats.arDuration = now - new Date(this.sessionData.arStartTime);
        stats.arActive = true;
      }
    }

    return stats;
  }

  /**
   * Get recent interactions
   * @param {number} count - Number of recent interactions to return
   * @returns {Array} Recent interactions
   */
  getRecentInteractions(count = 10) {
    return this.interactions.slice(-count);
  }

  /**
   * Get interactions by type
   * @param {string} type - Interaction type to filter by
   * @returns {Array} Filtered interactions
   */
  getInteractionsByType(type) {
    return this.interactions.filter(interaction => interaction.type === type);
  }

  /**
   * Add event listener
   * @param {Function} listener - Event listener function
   */
  addListener(listener) {
    this.listeners.push(listener);
  }

  /**
   * Remove event listener
   * @param {Function} listener - Event listener function
   */
  removeListener(listener) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Notify all listeners of an event
   * @param {string} event - Event type
   * @param {Object} data - Event data
   */
  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Error in session listener:', error);
      }
    });
  }

  /**
   * Export session data for analytics
   * @returns {Object} Exportable session data
   */
  exportSessionData() {
    return {
      session: this.sessionData,
      interactions: this.interactions,
      stats: this.getSessionStats()
    };
  }

  /**
   * Clear session data
   */
  clearSessionData() {
    this.sessionData = {};
    this.interactions = [];
    
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('halloween_ar_session');
    }
  }
}

// Create singleton instance
const sessionManager = new SessionManager();

/**
 * Convenience functions for session tracking
 */

/**
 * Track QR code scan
 * @param {Object} qrData - QR code data
 */
export function trackQRScan(qrData) {
  sessionManager.trackInteraction(InteractionTypes.QR_SCAN, qrData);
}

/**
 * Track AR session start
 * @param {Object} arData - AR initialization data
 */
export function trackARStart(arData) {
  sessionManager.trackInteraction(InteractionTypes.AR_START, arData);
}

/**
 * Track AR message view
 * @param {Object} messageData - Message display data
 */
export function trackARMessageView(messageData) {
  sessionManager.trackInteraction(InteractionTypes.AR_MESSAGE_VIEW, messageData);
}

/**
 * Track AR session end
 * @param {Object} arData - AR session end data
 */
export function trackAREnd(arData) {
  sessionManager.trackInteraction(InteractionTypes.AR_END, arData);
}

/**
 * Track camera permission events
 * @param {Object} permissionData - Permission event data
 */
export function trackCameraPermission(permissionData) {
  sessionManager.trackInteraction(InteractionTypes.CAMERA_PERMISSION, permissionData);
}

/**
 * Track error occurrences
 * @param {Object} errorData - Error information
 */
export function trackError(errorData) {
  sessionManager.trackInteraction(InteractionTypes.ERROR_OCCURRED, errorData);
}

/**
 * Get current session information
 * @returns {Object} Current session data
 */
export function getCurrentSession() {
  return sessionManager.getSessionStats();
}

/**
 * Export current session for analytics
 * @returns {Object} Exportable session data
 */
export function exportSession() {
  return sessionManager.exportSessionData();
}

// Export singleton instance and constants
export { 
  sessionManager as default, 
  SessionStates, 
  InteractionTypes 
};