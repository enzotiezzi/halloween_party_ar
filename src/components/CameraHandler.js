/**
 * CameraHandler Component
 * Manages camera access, permissions, and stream handling for AR experience
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from '../../lib/session';
import { useDeviceCapabilities } from '../hooks/useDeviceCapabilities';

const CameraHandler = ({ 
  onCameraReady, 
  onError, 
  onPermissionDenied,
  children,
  autoStart = true,
  facingMode = 'environment' // 'user' | 'environment'
}) => {
  // State management
  const [cameraState, setCameraState] = useState({
    status: 'idle', // 'idle' | 'requesting' | 'active' | 'error' | 'denied'
    stream: null,
    error: null,
    deviceId: null,
    facingMode: facingMode,
    resolution: null
  });

  const [availableDevices, setAvailableDevices] = useState([]);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  
  // Hooks
  const { session, updateSession } = useSession();
  const { capabilities, isLoading: capabilitiesLoading } = useDeviceCapabilities();

  // Camera constraints based on device capabilities
  const getCameraConstraints = useCallback(() => {
    if (!capabilities) {
      return {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 }
        }
      };
    }

    const deviceClass = capabilities.device?.class || 'low_end';
    
    // Optimize constraints based on device performance
    const constraints = {
      video: {
        facingMode: { ideal: facingMode },
        width: { ideal: 640, max: 1280 },
        height: { ideal: 480, max: 720 }
      }
    };

    switch (deviceClass) {
      case 'high_end':
        constraints.video.width = { ideal: 1280, max: 1920 };
        constraints.video.height = { ideal: 720, max: 1080 };
        constraints.video.frameRate = { ideal: 30, max: 60 };
        break;
      case 'mid_range':
        constraints.video.width = { ideal: 1024, max: 1280 };
        constraints.video.height = { ideal: 576, max: 720 };
        constraints.video.frameRate = { ideal: 30, max: 30 };
        break;
      case 'low_end':
        constraints.video.width = { ideal: 640, max: 854 };
        constraints.video.height = { ideal: 480, max: 480 };
        constraints.video.frameRate = { ideal: 24, max: 30 };
        break;
    }

    return constraints;
  }, [capabilities, facingMode]);

  // Get available camera devices
  const getAvailableDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) {
        throw new Error('Device enumeration not supported');
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      setAvailableDevices(videoDevices);
      return videoDevices;
    } catch (error) {
      console.error('Failed to enumerate devices:', error);
      return [];
    }
  }, []);

  // Request camera permission and start stream
  const startCamera = useCallback(async (deviceId = null) => {
    try {
      setCameraState(prev => ({ ...prev, status: 'requesting', error: null }));

      // Check if camera is supported
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access not supported in this browser');
      }

      // Get constraints
      const constraints = getCameraConstraints();
      
      // Add specific device ID if provided
      if (deviceId) {
        constraints.video.deviceId = { exact: deviceId };
      }

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Store stream reference
      streamRef.current = stream;
      
      // Get video track info
      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();
      
      // Update state
      setCameraState(prev => ({
        ...prev,
        status: 'active',
        stream,
        deviceId: settings.deviceId || null,
        facingMode: settings.facingMode || facingMode,
        resolution: {
          width: settings.width,
          height: settings.height,
          frameRate: settings.frameRate
        }
      }));

      // Update session with camera info
      updateSession({
        camera: {
          active: true,
          deviceId: settings.deviceId,
          facingMode: settings.facingMode,
          resolution: `${settings.width}x${settings.height}`,
          timestamp: new Date().toISOString()
        }
      });

      // Attach stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(console.error);
      }

      // Notify parent component
      if (onCameraReady) {
        onCameraReady(stream, {
          deviceId: settings.deviceId,
          facingMode: settings.facingMode,
          resolution: settings
        });
      }

      return stream;

    } catch (error) {
      console.error('Camera access failed:', error);
      
      // Determine error type
      let errorType = 'unknown';
      let errorMessage = error.message;

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorType = 'permission_denied';
        errorMessage = 'Camera permission denied. Please allow camera access and try again.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorType = 'no_camera';
        errorMessage = 'No camera found on this device.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorType = 'camera_busy';
        errorMessage = 'Camera is already in use by another application.';
      } else if (error.name === 'NotSupportedError') {
        errorType = 'not_supported';
        errorMessage = 'Camera access is not supported in this browser.';
      }

      // Update state
      setCameraState(prev => ({
        ...prev,
        status: errorType === 'permission_denied' ? 'denied' : 'error',
        error: { type: errorType, message: errorMessage, original: error }
      }));

      // Update session
      updateSession({
        camera: {
          active: false,
          error: errorType,
          timestamp: new Date().toISOString()
        }
      });

      // Notify parent component
      if (errorType === 'permission_denied' && onPermissionDenied) {
        onPermissionDenied(error);
      } else if (onError) {
        onError(error, errorType);
      }

      throw error;
    }
  }, [getCameraConstraints, facingMode, onCameraReady, onError, onPermissionDenied, updateSession]);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
        });
        streamRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      setCameraState(prev => ({
        ...prev,
        status: 'idle',
        stream: null,
        error: null
      }));

      updateSession({
        camera: {
          active: false,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Failed to stop camera:', error);
    }
  }, [updateSession]);

  // Switch camera (front/back)
  const switchCamera = useCallback(async () => {
    try {
      const newFacingMode = cameraState.facingMode === 'environment' ? 'user' : 'environment';
      
      // Stop current stream
      stopCamera();
      
      // Wait a moment for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Start with new facing mode
      setCameraState(prev => ({ ...prev, facingMode: newFacingMode }));
      
      // Find device with desired facing mode
      const devices = await getAvailableDevices();
      const targetDevice = devices.find(device => {
        const label = device.label.toLowerCase();
        return newFacingMode === 'environment' 
          ? label.includes('back') || label.includes('rear')
          : label.includes('front') || label.includes('user');
      });

      await startCamera(targetDevice?.deviceId);
      
    } catch (error) {
      console.error('Failed to switch camera:', error);
      if (onError) {
        onError(error, 'switch_failed');
      }
    }
  }, [cameraState.facingMode, stopCamera, getAvailableDevices, startCamera, onError]);

  // Initialize camera on mount if autoStart is enabled
  useEffect(() => {
    if (autoStart && !capabilitiesLoading && capabilities?.ar_support?.supported) {
      getAvailableDevices().then(() => {
        startCamera().catch(console.error);
      });
    }

    // Cleanup on unmount
    return () => {
      stopCamera();
    };
  }, [autoStart, capabilitiesLoading, capabilities, getAvailableDevices, startCamera, stopCamera]);

  // Handle device changes
  useEffect(() => {
    const handleDeviceChange = () => {
      getAvailableDevices();
    };

    if (navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      };
    }
  }, [getAvailableDevices]);

  // Handle visibility change (pause/resume camera)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && cameraState.status === 'active') {
        // Pause camera when page is hidden
        if (videoRef.current) {
          videoRef.current.pause();
        }
      } else if (document.visibilityState === 'visible' && cameraState.status === 'active') {
        // Resume camera when page is visible
        if (videoRef.current) {
          videoRef.current.play().catch(console.error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [cameraState.status]);

  // Component API
  const cameraAPI = {
    start: startCamera,
    stop: stopCamera,
    switch: switchCamera,
    getDevices: getAvailableDevices,
    state: cameraState,
    isActive: cameraState.status === 'active',
    isRequesting: cameraState.status === 'requesting',
    hasError: cameraState.status === 'error',
    isPermissionDenied: cameraState.status === 'denied',
    stream: cameraState.stream,
    videoRef,
    availableDevices
  };

  // Render children with camera API
  return (
    <div className="camera-handler">
      {/* Hidden video element for camera stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ display: 'none' }}
        onLoadedMetadata={() => {
          // Video metadata loaded
          if (videoRef.current) {
            const { videoWidth, videoHeight } = videoRef.current;
            setCameraState(prev => ({
              ...prev,
              resolution: {
                ...prev.resolution,
                videoWidth,
                videoHeight
              }
            }));
          }
        }}
        onError={(e) => {
          console.error('Video element error:', e);
          if (onError) {
            onError(new Error('Video playback failed'), 'video_error');
          }
        }}
      />
      
      {/* Render children with camera API */}
      {typeof children === 'function' ? children(cameraAPI) : children}
    </div>
  );
};

export default CameraHandler;