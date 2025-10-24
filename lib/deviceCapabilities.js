/**
 * Device Capability Detection for Halloween AR Experience
 * Detects and reports device capabilities for AR, camera, and QR code scanning
 */

/**
 * Device capability types
 */
const CapabilityTypes = {
  CAMERA: 'CAMERA',
  WEBXR: 'WEBXR',
  WEBRTC: 'WEBRTC',
  CANVAS: 'CANVAS',
  WEBGL: 'WEBGL',
  DEVICEMOTION: 'DEVICEMOTION',
  ORIENTATION: 'ORIENTATION',
  TOUCH: 'TOUCH',
  GEOLOCATION: 'GEOLOCATION'
};

/**
 * Device types
 */
const DeviceTypes = {
  MOBILE: 'MOBILE',
  TABLET: 'TABLET',
  DESKTOP: 'DESKTOP',
  UNKNOWN: 'UNKNOWN'
};

/**
 * Browser types
 */
const BrowserTypes = {
  CHROME: 'CHROME',
  SAFARI: 'SAFARI',
  FIREFOX: 'FIREFOX',
  EDGE: 'EDGE',
  SAMSUNG: 'SAMSUNG',
  UNKNOWN: 'UNKNOWN'
};

/**
 * Main device capability detection class
 */
export class DeviceCapabilities {
  constructor() {
    this.capabilities = {};
    this.deviceInfo = {};
    this.isInitialized = false;
  }

  /**
   * Initialize device capability detection
   * @returns {Promise<Object>} Device capabilities and info
   */
  async initialize() {
    if (this.isInitialized) {
      return { capabilities: this.capabilities, deviceInfo: this.deviceInfo };
    }

    try {
      // Detect basic device info
      this.deviceInfo = await this.detectDeviceInfo();
      
      // Detect all capabilities
      this.capabilities = await this.detectAllCapabilities();
      
      this.isInitialized = true;
      
      return { 
        capabilities: this.capabilities, 
        deviceInfo: this.deviceInfo,
        arSupported: this.isARSupported(),
        recommendations: this.getRecommendations()
      };
    } catch (error) {
      console.error('Failed to initialize device capabilities:', error);
      throw error;
    }
  }

  /**
   * Detect basic device information
   * @returns {Object} Device information
   */
  async detectDeviceInfo() {
    const userAgent = navigator.userAgent;
    
    return {
      userAgent,
      deviceType: this.detectDeviceType(userAgent),
      browser: this.detectBrowser(userAgent),
      platform: navigator.platform,
      language: navigator.language,
      screenSize: {
        width: screen.width,
        height: screen.height,
        availWidth: screen.availWidth,
        availHeight: screen.availHeight,
        pixelRatio: window.devicePixelRatio || 1
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Detect device type from user agent
   * @param {string} userAgent - Browser user agent string
   * @returns {string} Device type
   */
  detectDeviceType(userAgent) {
    const ua = userAgent.toLowerCase();
    
    if (/tablet|ipad/.test(ua)) {
      return DeviceTypes.TABLET;
    }
    
    if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/.test(ua)) {
      return DeviceTypes.MOBILE;
    }
    
    if (/desktop|windows|macintosh|linux/.test(ua) || window.innerWidth > 1024) {
      return DeviceTypes.DESKTOP;
    }
    
    return DeviceTypes.UNKNOWN;
  }

  /**
   * Detect browser type from user agent
   * @param {string} userAgent - Browser user agent string
   * @returns {string} Browser type
   */
  detectBrowser(userAgent) {
    const ua = userAgent.toLowerCase();
    
    if (ua.includes('samsungbrowser')) {
      return BrowserTypes.SAMSUNG;
    }
    
    if (ua.includes('chrome') && !ua.includes('edg')) {
      return BrowserTypes.CHROME;
    }
    
    if (ua.includes('safari') && !ua.includes('chrome')) {
      return BrowserTypes.SAFARI;
    }
    
    if (ua.includes('firefox')) {
      return BrowserTypes.FIREFOX;
    }
    
    if (ua.includes('edg')) {
      return BrowserTypes.EDGE;
    }
    
    return BrowserTypes.UNKNOWN;
  }

  /**
   * Detect all device capabilities
   * @returns {Promise<Object>} All capabilities
   */
  async detectAllCapabilities() {
    const capabilities = {};
    
    // Check each capability type
    capabilities[CapabilityTypes.CAMERA] = await this.checkCameraCapability();
    capabilities[CapabilityTypes.WEBXR] = await this.checkWebXRCapability();
    capabilities[CapabilityTypes.WEBRTC] = this.checkWebRTCCapability();
    capabilities[CapabilityTypes.CANVAS] = this.checkCanvasCapability();
    capabilities[CapabilityTypes.WEBGL] = this.checkWebGLCapability();
    capabilities[CapabilityTypes.DEVICEMOTION] = this.checkDeviceMotionCapability();
    capabilities[CapabilityTypes.ORIENTATION] = this.checkOrientationCapability();
    capabilities[CapabilityTypes.TOUCH] = this.checkTouchCapability();
    capabilities[CapabilityTypes.GEOLOCATION] = this.checkGeolocationCapability();
    
    return capabilities;
  }

  /**
   * Check camera capability
   * @returns {Promise<Object>} Camera capability info
   */
  async checkCameraCapability() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return { supported: false, reason: 'MediaDevices API not available' };
      }

      // Check for camera permissions without requesting them
      const permissions = await navigator.permissions.query({ name: 'camera' });
      
      const info = {
        supported: true,
        permission: permissions.state,
        facingModes: []
      };

      // Try to enumerate devices to see available cameras
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        info.deviceCount = videoDevices.length;
        info.devices = videoDevices.map(device => ({
          id: device.deviceId,
          label: device.label || 'Camera',
          groupId: device.groupId
        }));

        // Check for common facing modes
        const facingModes = ['user', 'environment'];
        for (const facingMode of facingModes) {
          try {
            const constraints = { 
              video: { 
                facingMode: { exact: facingMode },
                width: { ideal: 640 },
                height: { ideal: 480 }
              } 
            };
            
            // Don't actually request stream, just check if constraints are satisfiable
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            info.facingModes.push(facingMode);
            stream.getTracks().forEach(track => track.stop());
          } catch (e) {
            // Facing mode not supported
          }
        }
      } catch (e) {
        info.enumerationError = e.message;
      }

      return info;
    } catch (error) {
      return { 
        supported: false, 
        reason: error.message 
      };
    }
  }

  /**
   * Check WebXR capability
   * @returns {Promise<Object>} WebXR capability info
   */
  async checkWebXRCapability() {
    try {
      if (!navigator.xr) {
        return { supported: false, reason: 'WebXR not available' };
      }

      const info = {
        supported: true,
        sessions: {}
      };

      // Check different session types
      const sessionTypes = ['immersive-ar', 'immersive-vr', 'inline'];
      
      for (const sessionType of sessionTypes) {
        try {
          const supported = await navigator.xr.isSessionSupported(sessionType);
          info.sessions[sessionType] = supported;
        } catch (e) {
          info.sessions[sessionType] = false;
        }
      }

      return info;
    } catch (error) {
      return { 
        supported: false, 
        reason: error.message 
      };
    }
  }

  /**
   * Check WebRTC capability
   * @returns {Object} WebRTC capability info
   */
  checkWebRTCCapability() {
    try {
      const hasRTCPeerConnection = !!(
        window.RTCPeerConnection ||
        window.webkitRTCPeerConnection ||
        window.mozRTCPeerConnection
      );

      const hasGetUserMedia = !!(
        navigator.mediaDevices?.getUserMedia ||
        navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia
      );

      return {
        supported: hasRTCPeerConnection && hasGetUserMedia,
        peerConnection: hasRTCPeerConnection,
        getUserMedia: hasGetUserMedia
      };
    } catch (error) {
      return { 
        supported: false, 
        reason: error.message 
      };
    }
  }

  /**
   * Check Canvas capability
   * @returns {Object} Canvas capability info
   */
  checkCanvasCapability() {
    try {
      const canvas = document.createElement('canvas');
      const context2d = canvas.getContext('2d');
      
      return {
        supported: !!context2d,
        canvas2d: !!context2d
      };
    } catch (error) {
      return { 
        supported: false, 
        reason: error.message 
      };
    }
  }

  /**
   * Check WebGL capability
   * @returns {Object} WebGL capability info
   */
  checkWebGLCapability() {
    try {
      const canvas = document.createElement('canvas');
      const webgl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      const webgl2 = canvas.getContext('webgl2');

      const info = {
        supported: !!webgl,
        webgl: !!webgl,
        webgl2: !!webgl2
      };

      if (webgl) {
        const debugInfo = webgl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          info.renderer = webgl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          info.vendor = webgl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        }
        info.maxTextureSize = webgl.getParameter(webgl.MAX_TEXTURE_SIZE);
      }

      return info;
    } catch (error) {
      return { 
        supported: false, 
        reason: error.message 
      };
    }
  }

  /**
   * Check device motion capability
   * @returns {Object} Device motion capability info
   */
  checkDeviceMotionCapability() {
    return {
      supported: 'DeviceMotionEvent' in window,
      accelerometer: 'DeviceMotionEvent' in window,
      gyroscope: 'DeviceOrientationEvent' in window
    };
  }

  /**
   * Check orientation capability
   * @returns {Object} Orientation capability info
   */
  checkOrientationCapability() {
    return {
      supported: 'DeviceOrientationEvent' in window || 'onorientationchange' in window,
      orientationChange: 'onorientationchange' in window,
      orientationEvent: 'DeviceOrientationEvent' in window,
      currentOrientation: screen.orientation?.angle || window.orientation || 0
    };
  }

  /**
   * Check touch capability
   * @returns {Object} Touch capability info
   */
  checkTouchCapability() {
    return {
      supported: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      touchEvent: 'ontouchstart' in window
    };
  }

  /**
   * Check geolocation capability
   * @returns {Object} Geolocation capability info
   */
  checkGeolocationCapability() {
    return {
      supported: 'geolocation' in navigator,
      available: !!navigator.geolocation
    };
  }

  /**
   * Determine if AR is supported on this device
   * @returns {boolean} True if AR is supported
   */
  isARSupported() {
    if (!this.isInitialized) {
      return false;
    }

    const camera = this.capabilities[CapabilityTypes.CAMERA];
    const webgl = this.capabilities[CapabilityTypes.WEBGL];
    const canvas = this.capabilities[CapabilityTypes.CANVAS];

    // Basic requirements for AR
    const hasBasicRequirements = camera?.supported && webgl?.supported && canvas?.supported;
    
    // Check if we have environment-facing camera (rear camera)
    const hasRearCamera = camera?.facingModes?.includes('environment');
    
    // Mobile device is preferred for AR
    const isMobileOrTablet = [DeviceTypes.MOBILE, DeviceTypes.TABLET].includes(this.deviceInfo.deviceType);

    return hasBasicRequirements && (hasRearCamera || isMobileOrTablet);
  }

  /**
   * Get AR capability score (0-100)
   * @returns {number} AR capability score
   */
  getARCapabilityScore() {
    if (!this.isInitialized) {
      return 0;
    }

    let score = 0;

    // Camera support (30 points)
    const camera = this.capabilities[CapabilityTypes.CAMERA];
    if (camera?.supported) {
      score += 20;
      if (camera.facingModes?.includes('environment')) score += 10;
    }

    // WebGL support (25 points)
    const webgl = this.capabilities[CapabilityTypes.WEBGL];
    if (webgl?.supported) {
      score += 15;
      if (webgl.webgl2) score += 10;
    }

    // Device type (20 points)
    if (this.deviceInfo.deviceType === DeviceTypes.MOBILE) {
      score += 20;
    } else if (this.deviceInfo.deviceType === DeviceTypes.TABLET) {
      score += 15;
    }

    // Motion sensors (15 points)
    const motion = this.capabilities[CapabilityTypes.DEVICEMOTION];
    const orientation = this.capabilities[CapabilityTypes.ORIENTATION];
    if (motion?.supported) score += 8;
    if (orientation?.supported) score += 7;

    // Touch support (10 points)
    const touch = this.capabilities[CapabilityTypes.TOUCH];
    if (touch?.supported) score += 10;

    return Math.min(score, 100);
  }

  /**
   * Get recommendations for improving AR experience
   * @returns {Array} Array of recommendation objects
   */
  getRecommendations() {
    const recommendations = [];

    if (!this.isInitialized) {
      return recommendations;
    }

    const camera = this.capabilities[CapabilityTypes.CAMERA];
    if (!camera?.supported) {
      recommendations.push({
        type: 'critical',
        message: 'Camera access is required for AR experience',
        action: 'Enable camera permissions in browser settings'
      });
    }

    if (this.deviceInfo.deviceType === DeviceTypes.DESKTOP) {
      recommendations.push({
        type: 'warning',
        message: 'AR works best on mobile devices',
        action: 'Try opening this page on your smartphone or tablet'
      });
    }

    const webgl = this.capabilities[CapabilityTypes.WEBGL];
    if (!webgl?.supported) {
      recommendations.push({
        type: 'error',
        message: 'WebGL is required for AR rendering',
        action: 'Update your browser or enable WebGL in browser settings'
      });
    }

    if (camera?.facingModes && !camera.facingModes.includes('environment')) {
      recommendations.push({
        type: 'info',
        message: 'Rear camera not detected',
        action: 'Make sure your device has a rear-facing camera for best AR experience'
      });
    }

    return recommendations;
  }

  /**
   * Get a summary of device capabilities
   * @returns {Object} Device capability summary
   */
  getSummary() {
    if (!this.isInitialized) {
      return { error: 'Device capabilities not initialized' };
    }

    return {
      deviceInfo: this.deviceInfo,
      arSupported: this.isARSupported(),
      arScore: this.getARCapabilityScore(),
      capabilities: Object.keys(this.capabilities).reduce((summary, key) => {
        summary[key] = this.capabilities[key].supported;
        return summary;
      }, {}),
      recommendations: this.getRecommendations()
    };
  }
}

// Create singleton instance
const deviceCapabilities = new DeviceCapabilities();

/**
 * Convenience function to initialize and get device capabilities
 * @returns {Promise<Object>} Device capabilities
 */
export async function getDeviceCapabilities() {
  return await deviceCapabilities.initialize();
}

/**
 * Quick check if AR is supported
 * @returns {Promise<boolean>} True if AR is supported
 */
export async function isARSupported() {
  await deviceCapabilities.initialize();
  return deviceCapabilities.isARSupported();
}

/**
 * Quick check of AR capability score
 * @returns {Promise<number>} AR capability score (0-100)
 */
export async function getARCapabilityScore() {
  await deviceCapabilities.initialize();
  return deviceCapabilities.getARCapabilityScore();
}

// Export singleton instance
export default deviceCapabilities;