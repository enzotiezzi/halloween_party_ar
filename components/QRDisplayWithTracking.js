/**
 * QR Display with Session Tracking Integration
 * Enhanced QR code display component with session tracking capabilities
 */

import { useState, useEffect, useCallback } from 'react';
import QRCodeDisplay from './QRCodeDisplay';
import { trackQRScan, trackError, getCurrentSession } from '../lib/sessionManager';
import { generateCurrentPageARQR } from '../lib/services/qrService';

const QRDisplayWithTracking = ({ 
  url, 
  size = 256,
  title = "Scan to Enter AR Experience",
  trackingEnabled = true,
  sessionId = null,
  onScanTracked = null,
  onError = null,
  ...props 
}) => {
  const [qrResult, setQrResult] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [trackingData, setTrackingData] = useState({
    generated: false,
    displayed: false,
    scanTracked: false,
    errors: []
  });

  // Initialize session tracking
  useEffect(() => {
    if (trackingEnabled) {
      const session = getCurrentSession();
      setSessionInfo(session);
    }
  }, [trackingEnabled]);

  // Enhanced QR generation with tracking
  const handleQRGenerated = useCallback(async (qrUrl) => {
    try {
      // Track QR code generation
      if (trackingEnabled) {
        trackQRScan({
          action: 'qr_generated',
          qrUrl,
          targetUrl: url,
          size,
          sessionId: sessionId || sessionInfo?.sessionId,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          screenSize: {
            width: window.innerWidth,
            height: window.innerHeight
          }
        });
      }

      // Update tracking data
      setTrackingData(prev => ({
        ...prev,
        generated: true,
        displayed: true
      }));

      // Store QR result for analytics
      setQrResult({
        qrUrl,
        targetUrl: url,
        generatedAt: new Date().toISOString(),
        size
      });

      // Call parent callback
      if (onScanTracked) {
        onScanTracked({
          type: 'generated',
          qrUrl,
          targetUrl: url,
          sessionId: sessionId || sessionInfo?.sessionId
        });
      }

    } catch (error) {
      console.error('QR generation tracking failed:', error);
      
      // Track the error
      if (trackingEnabled) {
        trackError({
          error: error.message,
          context: 'qr_generation_tracking',
          qrUrl,
          targetUrl: url
        });
      }
    }
  }, [url, size, trackingEnabled, sessionId, sessionInfo, onScanTracked]);

  // Enhanced error handling with tracking
  const handleQRError = useCallback((error) => {
    console.error('QR generation error:', error);

    // Track the error
    if (trackingEnabled) {
      trackError({
        error: error.message,
        context: 'qr_generation_error',
        targetUrl: url,
        size,
        sessionId: sessionId || sessionInfo?.sessionId,
        timestamp: new Date().toISOString()
      });
    }

    // Update tracking data
    setTrackingData(prev => ({
      ...prev,
      errors: [...prev.errors, {
        message: error.message,
        timestamp: new Date().toISOString()
      }]
    }));

    // Call parent error handler
    if (onError) {
      onError(error);
    }
  }, [url, size, trackingEnabled, sessionId, sessionInfo, onError]);

  // Track QR display visibility
  useEffect(() => {
    if (trackingEnabled && qrResult && !trackingData.displayed) {
      // Track when QR is actually displayed
      trackQRScan({
        action: 'qr_displayed',
        qrUrl: qrResult.qrUrl,
        targetUrl: qrResult.targetUrl,
        sessionId: sessionId || sessionInfo?.sessionId,
        timestamp: new Date().toISOString(),
        visibility: document.visibilityState
      });

      setTrackingData(prev => ({ ...prev, displayed: true }));
    }
  }, [qrResult, trackingData.displayed, trackingEnabled, sessionId, sessionInfo]);

  // Track page visibility changes
  useEffect(() => {
    if (!trackingEnabled || !qrResult) return;

    const handleVisibilityChange = () => {
      trackQRScan({
        action: 'qr_visibility_change',
        qrUrl: qrResult.qrUrl,
        targetUrl: qrResult.targetUrl,
        sessionId: sessionId || sessionInfo?.sessionId,
        visibility: document.visibilityState,
        timestamp: new Date().toISOString()
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [qrResult, trackingEnabled, sessionId, sessionInfo]);

  // Enhanced QR display with session context
  return (
    <div className="qr-display-with-tracking">
      <QRCodeDisplay
        url={url}
        size={size}
        title={title}
        onLoad={handleQRGenerated}
        onError={handleQRError}
        {...props}
      />

      {/* Session Info (Development Mode) */}
      {process.env.NODE_ENV === 'development' && trackingEnabled && sessionInfo && (
        <details className="mt-4 text-xs text-gray-400">
          <summary className="cursor-pointer hover:text-gray-300">Session Tracking Info</summary>
          <div className="mt-2 p-2 bg-gray-800 rounded text-xs font-mono">
            <p><strong>Session ID:</strong> {sessionInfo.sessionId}</p>
            <p><strong>State:</strong> {sessionInfo.state}</p>
            <p><strong>Duration:</strong> {Math.round(sessionInfo.duration / 1000)}s</p>
            <p><strong>Interactions:</strong> {sessionInfo.interactionCount}</p>
            <p><strong>QR Generated:</strong> {trackingData.generated ? 'Yes' : 'No'}</p>
            <p><strong>QR Displayed:</strong> {trackingData.displayed ? 'Yes' : 'No'}</p>
            {trackingData.errors.length > 0 && (
              <p><strong>Errors:</strong> {trackingData.errors.length}</p>
            )}
          </div>
        </details>
      )}
    </div>
  );
};

/**
 * Smart QR Display Component
 * Automatically generates AR-optimized QR codes with full session tracking
 */
export const SmartQRDisplay = ({
  autoGenerate = true,
  arOptimized = true,
  trackingEnabled = true,
  onAnalytics = null,
  ...props
}) => {
  const [currentUrl, setCurrentUrl] = useState('');
  const [qrData, setQrData] = useState(null);
  const [analytics, setAnalytics] = useState({
    impressions: 0,
    errors: 0,
    generated: false
  });

  // Auto-generate current page URL
  useEffect(() => {
    if (autoGenerate && typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
    }
  }, [autoGenerate]);

  // Generate AR-optimized QR code
  useEffect(() => {
    const generateARQR = async () => {
      if (!currentUrl || !arOptimized) return;

      try {
        const result = await generateCurrentPageARQR({
          size: props.size || 512,
          errorCorrectionLevel: 'H'
        });
        
        setQrData(result);
        setAnalytics(prev => ({ ...prev, generated: true }));
        
      } catch (error) {
        console.error('AR QR generation failed:', error);
        setAnalytics(prev => ({ ...prev, errors: prev.errors + 1 }));
      }
    };

    generateARQR();
  }, [currentUrl, arOptimized, props.size]);

  // Track analytics
  const handleAnalytics = useCallback((eventData) => {
    const newAnalytics = { ...analytics };
    
    switch (eventData.type) {
      case 'generated':
        newAnalytics.impressions++;
        break;
      case 'error':
        newAnalytics.errors++;
        break;
    }
    
    setAnalytics(newAnalytics);
    
    if (onAnalytics) {
      onAnalytics(newAnalytics, eventData);
    }
  }, [analytics, onAnalytics]);

  if (!currentUrl && autoGenerate) {
    return (
      <div className="text-center p-4">
        <div className="loading-spinner mx-auto mb-2"></div>
        <p className="text-purple-300 text-sm">Preparing AR experience...</p>
      </div>
    );
  }

  return (
    <QRDisplayWithTracking
      url={currentUrl || props.url}
      trackingEnabled={trackingEnabled}
      onScanTracked={handleAnalytics}
      {...props}
    />
  );
};

/**
 * QR Analytics Hook
 * Provides QR code analytics and tracking data
 */
export const useQRAnalytics = (qrId = null) => {
  const [analytics, setAnalytics] = useState({
    impressions: 0,
    scans: 0,
    errors: 0,
    sessionData: null,
    performance: {
      averageGenerationTime: 0,
      successRate: 0
    }
  });

  const trackEvent = useCallback((eventType, data = {}) => {
    setAnalytics(prev => {
      const updated = { ...prev };
      
      switch (eventType) {
        case 'impression':
          updated.impressions++;
          break;
        case 'scan':
          updated.scans++;
          break;
        case 'error':
          updated.errors++;
          break;
        case 'performance':
          if (data.generationTime) {
            const totalTime = (updated.performance.averageGenerationTime * updated.impressions) + data.generationTime;
            updated.performance.averageGenerationTime = totalTime / (updated.impressions + 1);
          }
          break;
      }
      
      // Calculate success rate
      const total = updated.impressions + updated.errors;
      updated.performance.successRate = total > 0 ? (updated.impressions / total) * 100 : 0;
      
      return updated;
    });

    // Track in session manager
    trackQRScan({
      action: `qr_${eventType}`,
      qrId,
      ...data,
      timestamp: new Date().toISOString()
    });
  }, [qrId]);

  const getSessionData = useCallback(() => {
    const session = getCurrentSession();
    setAnalytics(prev => ({ ...prev, sessionData: session }));
    return session;
  }, []);

  return {
    analytics,
    trackEvent,
    getSessionData
  };
};

export default QRDisplayWithTracking;