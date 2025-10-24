/**
 * Error Handling Utilities for Halloween AR Experience
 * Provides centralized error handling for AR, camera, and QR code operations
 */

// Error types for categorization
export const ErrorTypes = {
  CAMERA_ERROR: 'CAMERA_ERROR',
  AR_ERROR: 'AR_ERROR',
  QR_ERROR: 'QR_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  PERMISSION_ERROR: 'PERMISSION_ERROR',
  BROWSER_ERROR: 'BROWSER_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR'
};

// Error severity levels
export const ErrorSeverity = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

/**
 * Custom error class for AR-related errors
 */
export class ARError extends Error {
  constructor(message, type = ErrorTypes.AR_ERROR, severity = ErrorSeverity.MEDIUM, details = {}) {
    super(message);
    this.name = 'ARError';
    this.type = type;
    this.severity = severity;
    this.details = details;
    this.timestamp = new Date().toISOString();
    
    // Capture stack trace for debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ARError);
    }
  }
}

/**
 * Error handler class for centralized error management
 */
export class ErrorHandler {
  constructor() {
    this.errorLog = [];
    this.maxLogSize = 100;
    this.listeners = [];
  }

  /**
   * Handle and process errors
   * @param {Error|ARError} error - The error to handle
   * @param {Object} context - Additional context about the error
   */
  handleError(error, context = {}) {
    const processedError = this.processError(error, context);
    
    // Log the error
    this.logError(processedError);
    
    // Notify listeners
    this.notifyListeners(processedError);
    
    // Console logging for development
    if (process.env.NODE_ENV === 'development') {
      console.error('AR Error:', processedError);
    }
    
    return processedError;
  }

  /**
   * Process and enrich error information
   * @param {Error} error - The error to process
   * @param {Object} context - Additional context
   * @returns {Object} Processed error object
   */
  processError(error, context) {
    const isARError = error instanceof ARError;
    
    return {
      id: this.generateErrorId(),
      message: error.message,
      type: isARError ? error.type : this.categorizeError(error),
      severity: isARError ? error.severity : this.determineSeverity(error),
      timestamp: new Date().toISOString(),
      stack: error.stack,
      context: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
        ...context,
        ...(isARError ? error.details : {})
      }
    };
  }

  /**
   * Categorize errors based on their characteristics
   * @param {Error} error - The error to categorize
   * @returns {string} Error type
   */
  categorizeError(error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('camera') || message.includes('media') || message.includes('video')) {
      return ErrorTypes.CAMERA_ERROR;
    }
    
    if (message.includes('ar') || message.includes('marker') || message.includes('tracking')) {
      return ErrorTypes.AR_ERROR;
    }
    
    if (message.includes('qr') || message.includes('code')) {
      return ErrorTypes.QR_ERROR;
    }
    
    if (message.includes('permission') || message.includes('denied')) {
      return ErrorTypes.PERMISSION_ERROR;
    }
    
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return ErrorTypes.NETWORK_ERROR;
    }
    
    if (message.includes('browser') || message.includes('unsupported')) {
      return ErrorTypes.BROWSER_ERROR;
    }
    
    return ErrorTypes.VALIDATION_ERROR;
  }

  /**
   * Determine error severity
   * @param {Error} error - The error to analyze
   * @returns {string} Severity level
   */
  determineSeverity(error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('critical') || message.includes('fatal')) {
      return ErrorSeverity.CRITICAL;
    }
    
    if (message.includes('permission') || message.includes('camera') || message.includes('ar')) {
      return ErrorSeverity.HIGH;
    }
    
    if (message.includes('network') || message.includes('connection')) {
      return ErrorSeverity.MEDIUM;
    }
    
    return ErrorSeverity.LOW;
  }

  /**
   * Log error to internal storage
   * @param {Object} processedError - The processed error object
   */
  logError(processedError) {
    this.errorLog.push(processedError);
    
    // Maintain log size limit
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }
  }

  /**
   * Add error listener
   * @param {Function} listener - Callback function for error events
   */
  addListener(listener) {
    this.listeners.push(listener);
  }

  /**
   * Remove error listener
   * @param {Function} listener - Listener to remove
   */
  removeListener(listener) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Notify all listeners of an error
   * @param {Object} processedError - The processed error object
   */
  notifyListeners(processedError) {
    this.listeners.forEach(listener => {
      try {
        listener(processedError);
      } catch (listenerError) {
        console.error('Error in error listener:', listenerError);
      }
    });
  }

  /**
   * Generate unique error ID
   * @returns {string} Unique error identifier
   */
  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get recent errors
   * @param {number} count - Number of recent errors to retrieve
   * @returns {Array} Recent errors
   */
  getRecentErrors(count = 10) {
    return this.errorLog.slice(-count);
  }

  /**
   * Get errors by type
   * @param {string} type - Error type to filter by
   * @returns {Array} Filtered errors
   */
  getErrorsByType(type) {
    return this.errorLog.filter(error => error.type === type);
  }

  /**
   * Clear error log
   */
  clearLog() {
    this.errorLog = [];
  }

  /**
   * Get error statistics
   * @returns {Object} Error statistics
   */
  getStats() {
    const stats = {
      total: this.errorLog.length,
      byType: {},
      bySeverity: {},
      recent: this.getRecentErrors(5)
    };

    this.errorLog.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
    });

    return stats;
  }
}

// Create singleton instance
const errorHandler = new ErrorHandler();

/**
 * Convenience functions for specific error types
 */

/**
 * Handle camera-related errors
 * @param {Error} error - Camera error
 * @param {Object} context - Additional context
 */
export function handleCameraError(error, context = {}) {
  return errorHandler.handleError(
    new ARError(
      error.message,
      ErrorTypes.CAMERA_ERROR,
      ErrorSeverity.HIGH,
      { originalError: error.name, ...context }
    ),
    context
  );
}

/**
 * Handle AR-specific errors
 * @param {Error} error - AR error
 * @param {Object} context - Additional context
 */
export function handleARError(error, context = {}) {
  return errorHandler.handleError(
    new ARError(
      error.message,
      ErrorTypes.AR_ERROR,
      ErrorSeverity.HIGH,
      { originalError: error.name, ...context }
    ),
    context
  );
}

/**
 * Handle QR code errors
 * @param {Error} error - QR error
 * @param {Object} context - Additional context
 */
export function handleQRError(error, context = {}) {
  return errorHandler.handleError(
    new ARError(
      error.message,
      ErrorTypes.QR_ERROR,
      ErrorSeverity.MEDIUM,
      { originalError: error.name, ...context }
    ),
    context
  );
}

/**
 * Handle permission errors
 * @param {Error} error - Permission error
 * @param {Object} context - Additional context
 */
export function handlePermissionError(error, context = {}) {
  return errorHandler.handleError(
    new ARError(
      error.message,
      ErrorTypes.PERMISSION_ERROR,
      ErrorSeverity.CRITICAL,
      { originalError: error.name, ...context }
    ),
    context
  );
}

/**
 * Handle browser compatibility errors
 * @param {Error} error - Browser error
 * @param {Object} context - Additional context
 */
export function handleBrowserError(error, context = {}) {
  return errorHandler.handleError(
    new ARError(
      error.message,
      ErrorTypes.BROWSER_ERROR,
      ErrorSeverity.HIGH,
      { originalError: error.name, ...context }
    ),
    context
  );
}

/**
 * User-friendly error messages for different error types
 */
export const ErrorMessages = {
  [ErrorTypes.CAMERA_ERROR]: {
    title: "Camera Access Issue",
    message: "Unable to access your camera. Please check permissions and try again.",
    action: "Check camera permissions in your browser settings"
  },
  [ErrorTypes.AR_ERROR]: {
    title: "AR Experience Issue",
    message: "The AR experience encountered a problem. Please try again.",
    action: "Ensure good lighting and point camera at QR code"
  },
  [ErrorTypes.QR_ERROR]: {
    title: "QR Code Issue",
    message: "Unable to scan or generate QR code. Please try again.",
    action: "Check QR code quality and lighting"
  },
  [ErrorTypes.PERMISSION_ERROR]: {
    title: "Permission Required",
    message: "Camera permission is required for the AR experience.",
    action: "Please allow camera access and reload the page"
  },
  [ErrorTypes.BROWSER_ERROR]: {
    title: "Browser Not Supported",
    message: "Your browser doesn't support this AR experience.",
    action: "Please use a modern mobile browser like Chrome or Safari"
  },
  [ErrorTypes.NETWORK_ERROR]: {
    title: "Connection Issue",
    message: "Network connection problem. Please check your internet.",
    action: "Check your internet connection and try again"
  }
};

/**
 * Get user-friendly error message
 * @param {string} errorType - The error type
 * @returns {Object} User-friendly error information
 */
export function getUserFriendlyError(errorType) {
  return ErrorMessages[errorType] || {
    title: "Something went wrong",
    message: "An unexpected error occurred. Please try again.",
    action: "Refresh the page and try again"
  };
}

// Export singleton instance
export default errorHandler;