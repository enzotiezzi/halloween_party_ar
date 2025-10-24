/**
 * Camera Permission and Utility Functions for Halloween AR Experience
 * Handles camera access, permissions, and streaming for AR functionality
 */

import { handleCameraError, handlePermissionError } from './errorHandler.js';

/**
 * Camera permission states
 */
const PermissionStates = {
  GRANTED: 'granted',
  DENIED: 'denied',
  PROMPT: 'prompt',
  UNKNOWN: 'unknown'
};

/**
 * Camera stream states
 */
const StreamStates = {
  INACTIVE: 'inactive',
  REQUESTING: 'requesting',
  ACTIVE: 'active',
  ERROR: 'error'
};

/**
 * Camera facing modes
 */
const FacingModes = {
  USER: 'user',        // Front camera
  ENVIRONMENT: 'environment',  // Rear camera
  LEFT: 'left',
  RIGHT: 'right'
};

/**
 * Camera utility class for managing camera access and streaming
 */
export class CameraUtils {
  constructor() {
    this.currentStream = null;
    this.streamState = StreamStates.INACTIVE;
    this.permissionState = PermissionStates.UNKNOWN;
    this.currentConstraints = null;
    this.listeners = [];
    this.supportedConstraints = {};
    
    this.initialize();
  }

  /**
   * Initialize camera utilities
   */
  async initialize() {
    try {
      // Check initial permission state
      await this.checkPermissionState();
      
      // Get supported constraints
      if (navigator.mediaDevices && navigator.mediaDevices.getSupportedConstraints) {
        this.supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
      }
    } catch (error) {
      console.warn('Failed to initialize camera utils:', error);
    }
  }

  /**
   * Check current camera permission state
   * @returns {Promise<string>} Current permission state
   */
  async checkPermissionState() {
    try {
      if (!navigator.permissions) {
        this.permissionState = PermissionStates.UNKNOWN;
        return this.permissionState;
      }

      const permission = await navigator.permissions.query({ name: 'camera' });
      this.permissionState = permission.state;
      
      // Listen for permission changes
      permission.onchange = () => {
        this.permissionState = permission.state;
        this.notifyListeners('permissionChange', { state: permission.state });
      };

      return this.permissionState;
    } catch (error) {
      this.permissionState = PermissionStates.UNKNOWN;
      return this.permissionState;
    }
  }

  /**
   * Request camera permission and stream
   * @param {Object} options - Camera stream options
   * @returns {Promise<MediaStream>} Camera stream
   */
  async requestCameraAccess(options = {}) {
    try {
      this.streamState = StreamStates.REQUESTING;
      this.notifyListeners('stateChange', { state: this.streamState });

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser');
      }

      // Build constraints
      const constraints = this.buildConstraints(options);
      this.currentConstraints = constraints;

      // Request camera stream
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Stop any existing stream
      await this.stopCamera();
      
      this.currentStream = stream;
      this.streamState = StreamStates.ACTIVE;
      
      // Update permission state
      await this.checkPermissionState();
      
      this.notifyListeners('streamStart', { stream, constraints });
      this.notifyListeners('stateChange', { state: this.streamState });

      return stream;
    } catch (error) {
      this.streamState = StreamStates.ERROR;
      this.notifyListeners('stateChange', { state: this.streamState });
      
      // Handle specific error types
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        handlePermissionError(error, { context: 'camera_access_request' });
        throw new Error('Camera permission denied. Please allow camera access to use AR features.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        handleCameraError(error, { context: 'no_camera_found' });
        throw new Error('No camera found on this device.');
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        handleCameraError(error, { context: 'camera_in_use' });
        throw new Error('Camera is already in use by another application.');
      } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
        handleCameraError(error, { context: 'unsupported_constraints', constraints: this.currentConstraints });
        throw new Error('Camera does not support the requested configuration.');
      } else {
        handleCameraError(error, { context: 'general_camera_error' });
        throw new Error(`Camera access failed: ${error.message}`);
      }
    }
  }

  /**
   * Build camera constraints based on options
   * @param {Object} options - Camera options
   * @returns {Object} Media constraints
   */
  buildConstraints(options = {}) {
    const constraints = {
      video: {
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 },
        frameRate: { ideal: 30, max: 60 }
      },
      audio: false  // AR doesn't need audio
    };

    // Set facing mode preference
    if (options.facingMode) {
      if (this.supportedConstraints.facingMode) {
        constraints.video.facingMode = { ideal: options.facingMode };
      }
    } else {
      // Default to rear camera for AR
      if (this.supportedConstraints.facingMode) {
        constraints.video.facingMode = { ideal: FacingModes.ENVIRONMENT };
      }
    }

    // Override width/height if specified
    if (options.width) {
      constraints.video.width = { ideal: options.width };
    }
    if (options.height) {
      constraints.video.height = { ideal: options.height };
    }

    // Set frame rate if specified
    if (options.frameRate) {
      constraints.video.frameRate = { ideal: options.frameRate };
    }

    // Advanced constraints for AR optimization
    if (options.arOptimized) {
      // Optimize for AR scanning
      constraints.video.width = { ideal: 640, max: 1280 };
      constraints.video.height = { ideal: 480, max: 720 };
      constraints.video.frameRate = { ideal: 30 };
      
      // Add focus mode if supported
      if (this.supportedConstraints.focusMode) {
        constraints.video.focusMode = 'continuous';
      }
      
      // Add exposure mode if supported
      if (this.supportedConstraints.exposureMode) {
        constraints.video.exposureMode = 'continuous';
      }
    }

    return constraints;
  }

  /**
   * Switch camera facing mode
   * @param {string} facingMode - New facing mode
   * @returns {Promise<MediaStream>} New camera stream
   */
  async switchCamera(facingMode = FacingModes.ENVIRONMENT) {
    try {
      if (!this.supportedConstraints.facingMode) {
        throw new Error('Camera switching not supported on this device');
      }

      const options = {
        facingMode,
        width: this.currentConstraints?.video?.width?.ideal || 1280,
        height: this.currentConstraints?.video?.height?.ideal || 720,
        arOptimized: true
      };

      return await this.requestCameraAccess(options);
    } catch (error) {
      handleCameraError(error, { context: 'camera_switch', facingMode });
      throw error;
    }
  }

  /**
   * Stop camera stream
   * @returns {Promise<void>}
   */
  async stopCamera() {
    try {
      if (this.currentStream) {
        this.currentStream.getTracks().forEach(track => {
          track.stop();
        });
        
        this.notifyListeners('streamStop', { stream: this.currentStream });
        this.currentStream = null;
      }
      
      this.streamState = StreamStates.INACTIVE;
      this.notifyListeners('stateChange', { state: this.streamState });
    } catch (error) {
      handleCameraError(error, { context: 'stop_camera' });
      throw error;
    }
  }

  /**
   * Get available camera devices
   * @returns {Promise<Array>} Array of camera device info
   */
  async getCameraDevices() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        return [];
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      return videoDevices.map(device => ({
        id: device.deviceId,
        label: device.label || 'Camera',
        groupId: device.groupId,
        kind: device.kind
      }));
    } catch (error) {
      handleCameraError(error, { context: 'enumerate_devices' });
      return [];
    }
  }

  /**
   * Test camera access without starting stream
   * @returns {Promise<boolean>} True if camera is accessible
   */
  async testCameraAccess() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 320, height: 240 } 
      });
      
      // Immediately stop the test stream
      stream.getTracks().forEach(track => track.stop());
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get camera stream capabilities
   * @returns {Object} Stream capabilities
   */
  getCameraCapabilities() {
    if (!this.currentStream) {
      return null;
    }

    const videoTrack = this.currentStream.getVideoTracks()[0];
    if (!videoTrack) {
      return null;
    }

    const capabilities = videoTrack.getCapabilities ? videoTrack.getCapabilities() : {};
    const settings = videoTrack.getSettings ? videoTrack.getSettings() : {};
    const constraints = videoTrack.getConstraints ? videoTrack.getConstraints() : {};

    return {
      capabilities,
      settings,
      constraints,
      track: {
        id: videoTrack.id,
        kind: videoTrack.kind,
        label: videoTrack.label,
        readyState: videoTrack.readyState,
        enabled: videoTrack.enabled
      }
    };
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
        console.error('Error in camera listener:', error);
      }
    });
  }

  /**
   * Get current camera state
   * @returns {Object} Current state information
   */
  getState() {
    return {
      streamState: this.streamState,
      permissionState: this.permissionState,
      hasStream: !!this.currentStream,
      constraints: this.currentConstraints,
      capabilities: this.getCameraCapabilities(),
      supportedConstraints: this.supportedConstraints
    };
  }

  /**
   * Apply camera settings for optimal AR performance
   * @returns {Promise<void>}
   */
  async optimizeForAR() {
    if (!this.currentStream) {
      throw new Error('No active camera stream to optimize');
    }

    const videoTrack = this.currentStream.getVideoTracks()[0];
    if (!videoTrack || !videoTrack.applyConstraints) {
      return; // Can't apply constraints
    }

    try {
      const optimizationConstraints = {
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { ideal: 30 }
      };

      // Add advanced constraints if supported
      if (this.supportedConstraints.focusMode) {
        optimizationConstraints.focusMode = 'continuous';
      }
      
      if (this.supportedConstraints.exposureMode) {
        optimizationConstraints.exposureMode = 'continuous';
      }

      await videoTrack.applyConstraints(optimizationConstraints);
      
      this.notifyListeners('optimized', { constraints: optimizationConstraints });
    } catch (error) {
      handleCameraError(error, { context: 'ar_optimization' });
      // Don't throw - optimization failure shouldn't break the experience
    }
  }
}

// Create singleton instance
const cameraUtils = new CameraUtils();

/**
 * Convenience functions for camera operations
 */

/**
 * Quick camera access for AR
 * @param {Object} options - Camera options
 * @returns {Promise<MediaStream>} Camera stream
 */
export async function getARCamera(options = {}) {
  const arOptions = {
    arOptimized: true,
    facingMode: FacingModes.ENVIRONMENT,
    ...options
  };
  
  return await cameraUtils.requestCameraAccess(arOptions);
}

/**
 * Check if camera permission is granted
 * @returns {Promise<boolean>} True if permission is granted
 */
export async function isCameraPermissionGranted() {
  const state = await cameraUtils.checkPermissionState();
  return state === PermissionStates.GRANTED;
}

/**
 * Test camera availability
 * @returns {Promise<boolean>} True if camera is available
 */
export async function isCameraAvailable() {
  return await cameraUtils.testCameraAccess();
}

/**
 * Get user-friendly permission guidance
 * @param {string} permissionState - Current permission state
 * @returns {Object} Guidance information
 */
export function getPermissionGuidance(permissionState) {
  switch (permissionState) {
    case PermissionStates.GRANTED:
      return {
        status: 'success',
        title: 'Camera Access Granted',
        message: 'You can now use the AR features!',
        action: null
      };
      
    case PermissionStates.DENIED:
      return {
        status: 'error',
        title: 'Camera Access Denied',
        message: 'Camera permission is required for AR experience.',
        action: 'Please enable camera access in your browser settings and reload the page.'
      };
      
    case PermissionStates.PROMPT:
      return {
        status: 'info',
        title: 'Camera Permission Needed',
        message: 'Click "Allow" when prompted to enable AR features.',
        action: 'Grant camera permission to continue.'
      };
      
    default:
      return {
        status: 'warning',
        title: 'Camera Status Unknown',
        message: 'Unable to determine camera permission status.',
        action: 'Please ensure your browser supports camera access.'
      };
  }
}

// Export singleton instance and constants
export { cameraUtils as default, PermissionStates, StreamStates, FacingModes };