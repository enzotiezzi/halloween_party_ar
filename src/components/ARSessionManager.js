/**
 * ARSessionManager Component
 * Manages AR session lifecycle, state, and coordination between components
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from '../../lib/session';
import { useDeviceCapabilities } from '../hooks/useDeviceCapabilities';
import CameraHandler from './CameraHandler';
import ARScene from './ARScene';

const ARSessionManager = ({
  qrCodeData,
  onSessionStart,
  onSessionEnd,
  onMarkerDetected,
  onError,
  autoStart = true,
  className = '',
  style = {}
}) => {
  // State management
  const [sessionState, setSessionState] = useState({
    phase: 'idle', // 'idle' | 'checking' | 'requesting_camera' | 'initializing' | 'ready' | 'active' | 'error'
    error: null,
    cameraReady: false,
    arReady: false,
    markerDetected: false,
    performance: null,
    startTime: null,
    statistics: {
      markerDetections: 0,
      totalSessionTime: 0,
      errorCount: 0
    }
  });

  const [cameraStream, setCameraStream] = useState(null);
  const sessionRef = useRef(null);
  const performanceMonitorRef = useRef(null);

  // Hooks
  const { session, updateSession } = useSession();
  const { capabilities, isLoading: capabilitiesLoading, isSupported } = useDeviceCapabilities();

  // Session lifecycle management
  const startSession = useCallback(async () => {
    try {
      console.log('Starting AR session...');
      
      setSessionState(prev => ({
        ...prev,
        phase: 'checking',
        error: null,
        startTime: Date.now()
      }));

      // Check device capabilities
      if (capabilitiesLoading) {
        setSessionState(prev => ({ ...prev, phase: 'checking' }));
        return;
      }

      if (!isSupported) {
        throw new Error('AR is not supported on this device/browser');
      }

      // Update session
      updateSession({
        ar_session: {
          session_id: `session_${Date.now()}`,
          started_at: new Date().toISOString(),
          device_capabilities: capabilities,
          qr_code_data: qrCodeData || null
        }
      });

      // Start camera first
      setSessionState(prev => ({ ...prev, phase: 'requesting_camera' }));

      if (onSessionStart) {
        onSessionStart();
      }

    } catch (error) {
      console.error('Failed to start AR session:', error);
      handleSessionError(error);
    }
  }, [capabilitiesLoading, isSupported, capabilities, qrCodeData, updateSession, onSessionStart]);

  // End session
  const endSession = useCallback(async () => {
    try {
      console.log('Ending AR session...');

      const endTime = Date.now();
      const sessionDuration = sessionState.startTime ? endTime - sessionState.startTime : 0;

      // Update statistics
      setSessionState(prev => ({
        ...prev,
        phase: 'idle',
        cameraReady: false,
        arReady: false,
        markerDetected: false,
        statistics: {
          ...prev.statistics,
          totalSessionTime: prev.statistics.totalSessionTime + sessionDuration
        }
      }));

      // Clear camera stream
      setCameraStream(null);

      // Update session
      updateSession({
        ar_session: {
          ended_at: new Date().toISOString(),
          session_duration: sessionDuration,
          statistics: sessionState.statistics
        }
      });

      if (onSessionEnd) {
        onSessionEnd({
          duration: sessionDuration,
          statistics: sessionState.statistics
        });
      }

    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }, [sessionState.startTime, sessionState.statistics, updateSession, onSessionEnd]);

  // Handle session errors
  const handleSessionError = useCallback((error) => {
    console.error('AR Session error:', error);

    setSessionState(prev => ({
      ...prev,
      phase: 'error',
      error: error.message || 'Unknown error occurred',
      statistics: {
        ...prev.statistics,
        errorCount: prev.statistics.errorCount + 1
      }
    }));

    updateSession({
      ar_session: {
        error: error.message,
        error_count: sessionState.statistics.errorCount + 1,
        error_timestamp: new Date().toISOString()
      }
    });

    if (onError) {
      onError(error);
    }
  }, [sessionState.statistics.errorCount, updateSession, onError]);

  // Handle camera ready
  const handleCameraReady = useCallback((stream, cameraInfo) => {
    console.log('Camera ready:', cameraInfo);
    
    setCameraStream(stream);
    
    setSessionState(prev => ({
      ...prev,
      cameraReady: true,
      phase: prev.arReady ? 'active' : 'initializing'
    }));

    updateSession({
      ar_session: {
        camera_ready: true,
        camera_info: cameraInfo,
        camera_ready_at: new Date().toISOString()
      }
    });

    // Start performance monitoring
    startPerformanceMonitoring();
  }, [updateSession]);

  // Handle camera errors
  const handleCameraError = useCallback((error, errorType) => {
    console.error('Camera error:', error, errorType);
    
    const errorMessage = errorType === 'permission_denied' 
      ? 'Camera permission denied. Please allow camera access and try again.'
      : `Camera error: ${error.message}`;
      
    handleSessionError(new Error(errorMessage));
  }, [handleSessionError]);

  // Handle AR marker detection
  const handleMarkerFound = useCallback((anchor) => {
    console.log('AR marker detected');
    
    setSessionState(prev => ({
      ...prev,
      markerDetected: true,
      statistics: {
        ...prev.statistics,
        markerDetections: prev.statistics.markerDetections + 1
      }
    }));

    updateSession({
      ar_session: {
        marker_detected: true,
        marker_detection_count: sessionState.statistics.markerDetections + 1,
        last_marker_detection: new Date().toISOString()
      }
    });

    if (onMarkerDetected) {
      onMarkerDetected(anchor);
    }
  }, [sessionState.statistics.markerDetections, updateSession, onMarkerDetected]);

  // Handle AR marker lost
  const handleMarkerLost = useCallback((anchor) => {
    console.log('AR marker lost');
    
    setSessionState(prev => ({
      ...prev,
      markerDetected: false
    }));

    updateSession({
      ar_session: {
        marker_detected: false,
        last_marker_lost: new Date().toISOString()
      }
    });
  }, [updateSession]);

  // Handle AR errors
  const handleARError = useCallback((error) => {
    console.error('AR error:', error);
    handleSessionError(error);
  }, [handleSessionError]);

  // Performance monitoring
  const startPerformanceMonitoring = useCallback(() => {
    if (performanceMonitorRef.current) {
      clearInterval(performanceMonitorRef.current);
    }

    performanceMonitorRef.current = setInterval(() => {
      const performance = {
        memory: performance.memory ? {
          used: Math.round(performance.memory.usedJSHeapSize / (1024 * 1024)),
          total: Math.round(performance.memory.totalJSHeapSize / (1024 * 1024))
        } : null,
        timestamp: Date.now()
      };

      setSessionState(prev => ({
        ...prev,
        performance
      }));
    }, 2000);
  }, []);

  // Auto-start session when ready
  useEffect(() => {
    if (autoStart && !capabilitiesLoading && sessionState.phase === 'idle') {
      startSession();
    }
  }, [autoStart, capabilitiesLoading, sessionState.phase, startSession]);

  // Update AR ready state
  useEffect(() => {
    if (sessionState.cameraReady && sessionState.phase === 'initializing') {
      setSessionState(prev => ({
        ...prev,
        arReady: true,
        phase: 'active'
      }));

      updateSession({
        ar_session: {
          ar_ready: true,
          ar_ready_at: new Date().toISOString(),
          active: true
        }
      });
    }
  }, [sessionState.cameraReady, sessionState.phase, updateSession]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (performanceMonitorRef.current) {
        clearInterval(performanceMonitorRef.current);
      }
      
      if (sessionState.phase === 'active') {
        endSession();
      }
    };
  }, [sessionState.phase, endSession]);

  // Handle page visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && sessionState.phase === 'active') {
        // Pause session when page is hidden
        updateSession({
          ar_session: {
            paused: true,
            paused_at: new Date().toISOString()
          }
        });
      } else if (document.visibilityState === 'visible' && sessionState.phase === 'active') {
        // Resume session when page is visible
        updateSession({
          ar_session: {
            paused: false,
            resumed_at: new Date().toISOString()
          }
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [sessionState.phase, updateSession]);

  // Session API for external control
  const sessionAPI = {
    start: startSession,
    end: endSession,
    state: sessionState,
    capabilities,
    isActive: sessionState.phase === 'active',
    isReady: sessionState.cameraReady && sessionState.arReady,
    hasError: sessionState.phase === 'error',
    canStart: !capabilitiesLoading && isSupported
  };

  return (
    <div 
      className={`ar-session-manager ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        ...style
      }}
    >
      {/* Loading State */}
      {capabilitiesLoading && (
        <div className="session-loading">
          <div className="loading-content">
            <div className="spinner"></div>
            <p>Verificando capacidades do dispositivo...</p>
          </div>
        </div>
      )}

      {/* Unsupported State */}
      {!capabilitiesLoading && !isSupported && (
        <div className="session-unsupported">
          <div className="unsupported-content">
            <h3>AR não suportado</h3>
            <p>Seu dispositivo ou navegador não suporta AR.</p>
            <div className="recommendations">
              {capabilities?.assessment?.recommendations?.map((rec, index) => (
                <div key={index} className="recommendation">
                  <strong>{rec.message}</strong>
                  {rec.action && <p>{rec.action}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {sessionState.phase === 'error' && (
        <div className="session-error">
          <div className="error-content">
            <h3>Erro na Sessão AR</h3>
            <p>{sessionState.error}</p>
            <button 
              onClick={startSession}
              className="retry-button"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      )}

      {/* Camera Requesting State */}
      {sessionState.phase === 'requesting_camera' && (
        <div className="session-camera-request">
          <div className="camera-request-content">
            <h3>Permissão da Câmera</h3>
            <p>Por favor, permita o acesso à câmera para continuar.</p>
          </div>
        </div>
      )}

      {/* Active Session */}
      {(sessionState.phase === 'requesting_camera' || 
        sessionState.phase === 'initializing' || 
        sessionState.phase === 'active') && (
        <>
          {/* Camera Handler */}
          <CameraHandler
            onCameraReady={handleCameraReady}
            onError={handleCameraError}
            onPermissionDenied={handleCameraError}
            autoStart={true}
            facingMode="environment"
          >
            {(cameraAPI) => (
              /* AR Scene */
              sessionState.cameraReady && (
                <ARScene
                  cameraStream={cameraStream}
                  qrCodeData={qrCodeData}
                  onMarkerFound={handleMarkerFound}
                  onMarkerLost={handleMarkerLost}
                  onError={handleARError}
                />
              )
            )}
          </CameraHandler>

          {/* Session Controls */}
          <div className="session-controls">
            <button 
              onClick={endSession}
              className="end-session-button"
              aria-label="Encerrar sessão AR"
            >
              ✕
            </button>
            
            {sessionState.performance && (
              <div className="performance-indicator">
                {sessionState.performance.memory && (
                  <span>Mem: {sessionState.performance.memory.used}MB</span>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Session API Provider */}
      {typeof children === 'function' && children(sessionAPI)}

      <style jsx>{`
        .ar-session-manager {
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .session-loading,
        .session-unsupported,
        .session-error,
        .session-camera-request {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .loading-content,
        .unsupported-content,
        .error-content,
        .camera-request-content {
          text-align: center;
          color: white;
          max-width: 90%;
          padding: 2rem;
        }
        
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top: 3px solid #8b0000;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }
        
        .recommendations {
          margin-top: 1rem;
          text-align: left;
        }
        
        .recommendation {
          background: rgba(139, 0, 0, 0.2);
          border: 1px solid rgba(139, 0, 0, 0.4);
          border-radius: 0.5rem;
          padding: 1rem;
          margin-bottom: 0.5rem;
        }
        
        .retry-button {
          background: #8b0000;
          color: white;
          border: none;
          padding: 0.8rem 1.5rem;
          border-radius: 0.5rem;
          font-size: 1rem;
          cursor: pointer;
          transition: background 0.3s ease;
        }
        
        .retry-button:hover {
          background: #a00000;
        }
        
        .session-controls {
          position: absolute;
          top: 1rem;
          right: 1rem;
          z-index: 100;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .end-session-button {
          background: rgba(0, 0, 0, 0.7);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          width: 3rem;
          height: 3rem;
          font-size: 1.2rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }
        
        .end-session-button:hover {
          background: rgba(139, 0, 0, 0.8);
          border-color: rgba(139, 0, 0, 0.8);
        }
        
        .performance-indicator {
          background: rgba(0, 0, 0, 0.7);
          color: rgba(255, 255, 255, 0.8);
          padding: 0.3rem 0.6rem;
          border-radius: 0.3rem;
          font-size: 0.8rem;
          font-family: monospace;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .session-controls {
            top: 0.5rem;
            right: 0.5rem;
          }
          
          .end-session-button {
            width: 2.5rem;
            height: 2.5rem;
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ARSessionManager;