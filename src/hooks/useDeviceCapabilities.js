/**
 * useDeviceCapabilities Hook
 * Provides device AR capabilities assessment and real-time capability detection
 */

import { useState, useEffect, useCallback } from 'react';

export const useDeviceCapabilities = () => {
  const [capabilities, setCapabilities] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastCheck, setLastCheck] = useState(null);

  // Gather client-side device information
  const gatherDeviceInfo = useCallback(() => {
    try {
      const deviceInfo = {
        userAgent: navigator.userAgent,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        pixelRatio: window.devicePixelRatio || 1,
        deviceMemory: navigator.deviceMemory || null,
        hardwareConcurrency: navigator.hardwareConcurrency || null,
        maxTouchPoints: navigator.maxTouchPoints || 0,
        connection: navigator.connection ? {
          effectiveType: navigator.connection.effectiveType,
          downlink: navigator.connection.downlink
        } : null,
        webgl: detectWebGLSupport(),
        webrtc: detectWebRTCSupport()
      };

      return deviceInfo;
    } catch (error) {
      console.error('Failed to gather device info:', error);
      return {
        userAgent: 'unknown',
        screenWidth: 0,
        screenHeight: 0,
        pixelRatio: 1,
        deviceMemory: null,
        hardwareConcurrency: null,
        maxTouchPoints: 0
      };
    }
  }, []);

  // Detect WebGL support
  const detectWebGLSupport = useCallback(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      const gl2 = canvas.getContext('webgl2');
      
      if (!gl) return { supported: false };

      const info = {
        supported: true,
        webgl2: !!gl2,
        vendor: gl.getParameter(gl.VENDOR),
        renderer: gl.getParameter(gl.RENDERER),
        version: gl.getParameter(gl.VERSION),
        extensions: gl.getSupportedExtensions() || []
      };

      // Cleanup
      const loseContext = gl.getExtension('WEBGL_lose_context');
      if (loseContext) {
        loseContext.loseContext();
      }

      return info;
    } catch (error) {
      console.error('WebGL detection failed:', error);
      return { supported: false };
    }
  }, []);

  // Detect WebRTC support
  const detectWebRTCSupport = useCallback(() => {
    try {
      return {
        supported: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
        rtcPeerConnection: !!(window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection),
        mediaDevices: !!navigator.mediaDevices,
        enumerateDevices: !!(navigator.mediaDevices && navigator.mediaDevices.enumerateDevices)
      };
    } catch (error) {
      console.error('WebRTC detection failed:', error);
      return { supported: false };
    }
  }, []);

  // Fetch capabilities from API
  const fetchCapabilities = useCallback(async (deviceInfo) => {
    try {
      const params = new URLSearchParams({
        userAgent: deviceInfo.userAgent,
        screenWidth: deviceInfo.screenWidth.toString(),
        screenHeight: deviceInfo.screenHeight.toString(),
        pixelRatio: deviceInfo.pixelRatio.toString(),
        deviceMemory: deviceInfo.deviceMemory?.toString() || '',
        hardwareConcurrency: deviceInfo.hardwareConcurrency?.toString() || '',
        maxTouchPoints: deviceInfo.maxTouchPoints.toString(),
        format: 'detailed'
      });

      const response = await fetch(`/api/ar/capabilities?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Capabilities API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Enhance with client-side detection
      const enhancedCapabilities = {
        ...data,
        client_info: deviceInfo,
        enhanced_features: {
          webgl: deviceInfo.webgl,
          webrtc: deviceInfo.webrtc,
          connection: deviceInfo.connection
        }
      };

      return enhancedCapabilities;
    } catch (error) {
      console.error('Failed to fetch capabilities:', error);
      throw error;
    }
  }, []);

  // Assess capabilities
  const assessCapabilities = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Gather device information
      const deviceInfo = gatherDeviceInfo();
      
      // Fetch capabilities from API
      const capabilities = await fetchCapabilities(deviceInfo);
      
      setCapabilities(capabilities);
      setLastCheck(new Date().toISOString());
      
      return capabilities;
    } catch (error) {
      console.error('Capability assessment failed:', error);
      setError(error.message);
      
      // Provide fallback capabilities
      const fallbackCapabilities = {
        browser: { name: 'unknown', version: 0, mobile: false },
        device: { class: 'low_end', performance_score: 40 },
        ar_support: { supported: false, rating: 'unsupported' },
        assessment: { 
          overall_rating: 'unsupported',
          ar_score: 0,
          recommendations: [{
            type: 'error',
            message: 'Unable to assess device capabilities',
            action: 'Please try refreshing the page'
          }]
        }
      };
      
      setCapabilities(fallbackCapabilities);
    } finally {
      setIsLoading(false);
    }
  }, [gatherDeviceInfo, fetchCapabilities]);

  // Test specific capability
  const testCapability = useCallback(async (testType, testData = {}) => {
    try {
      const response = await fetch('/api/ar/capabilities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: testType,
          capabilities: testData
        })
      });

      if (!response.ok) {
        throw new Error(`Capability test failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Failed to test ${testType}:`, error);
      throw error;
    }
  }, []);

  // Test camera access
  const testCameraAccess = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        return { supported: false, error: 'getUserMedia not supported' };
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      // Stop the stream immediately
      stream.getTracks().forEach(track => track.stop());
      
      return { supported: true, error: null };
    } catch (error) {
      return { 
        supported: false, 
        error: error.name === 'NotAllowedError' ? 'permission_denied' : error.message 
      };
    }
  }, []);

  // Get performance recommendations
  const getPerformanceRecommendations = useCallback(() => {
    if (!capabilities) return [];

    const recommendations = [];
    const deviceClass = capabilities.device?.class;
    const arScore = capabilities.assessment?.ar_score || 0;

    if (arScore < 50) {
      recommendations.push({
        type: 'warning',
        message: 'Limited AR performance expected',
        actions: [
          'Use a more powerful device if available',
          'Ensure good lighting conditions',
          'Close other applications'
        ]
      });
    }

    if (deviceClass === 'low_end') {
      recommendations.push({
        type: 'optimization',
        message: 'Performance optimizations enabled',
        actions: [
          'Reduced visual effects',
          'Lower frame rate target',
          'Simplified AR content'
        ]
      });
    }

    if (!capabilities.browser?.mobile) {
      recommendations.push({
        type: 'info',
        message: 'Desktop AR has limitations',
        actions: [
          'Switch to mobile device for best experience',
          'Use Chrome or Firefox for better support'
        ]
      });
    }

    return recommendations;
  }, [capabilities]);

  // Initialize capabilities assessment
  useEffect(() => {
    assessCapabilities();
  }, [assessCapabilities]);

  // Re-assess on visibility change (user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && lastCheck) {
        const timeSinceLastCheck = Date.now() - new Date(lastCheck).getTime();
        
        // Re-assess if it's been more than 5 minutes
        if (timeSinceLastCheck > 5 * 60 * 1000) {
          assessCapabilities();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [lastCheck, assessCapabilities]);

  return {
    capabilities,
    isLoading,
    error,
    lastCheck,
    
    // Methods
    refresh: assessCapabilities,
    testCapability,
    testCameraAccess,
    getPerformanceRecommendations,
    
    // Computed properties
    isSupported: capabilities?.ar_support?.supported || false,
    deviceClass: capabilities?.device?.class || 'unknown',
    arScore: capabilities?.assessment?.ar_score || 0,
    recommendations: capabilities?.assessment?.recommendations || []
  };
};