/**
 * QR Code Display Component
 * Displays QR codes with Halloween theming and AR-optimized styling
 */

import { useState, useEffect, useCallback } from 'react';
import styles from '../styles/ar.module.css';

const QRCodeDisplay = ({ 
  url, 
  size = 256, 
  title = "Scan to Enter AR Experience",
  className = "",
  onError = null,
  onLoad = null,
  showInstructions = true,
  ariaLabel = "QR code for AR experience"
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Generate QR code URL for the API
  const generateQRCode = useCallback(async () => {
    if (!url) {
      setError('No URL provided for QR code generation');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Build API request URL with parameters optimized for AR
      const apiUrl = new URL('/api/qr-code', window.location.origin);
      apiUrl.searchParams.set('data', url);
      apiUrl.searchParams.set('size', size.toString());
      apiUrl.searchParams.set('format', 'png');
      apiUrl.searchParams.set('errorLevel', 'H'); // High error correction for AR

      // Test if the QR code can be generated
      const response = await fetch(apiUrl.toString());
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to generate QR code (${response.status})`);
      }

      // Set the QR code URL for display
      setQrCodeUrl(apiUrl.toString());
      
      if (onLoad) {
        onLoad(apiUrl.toString());
      }

    } catch (err) {
      console.error('QR code generation failed:', err);
      setError(err.message);
      
      if (onError) {
        onError(err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [url, size, onError, onLoad]);

  // Retry QR code generation
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    generateQRCode();
  };

  // Generate QR code when component mounts or dependencies change
  useEffect(() => {
    generateQRCode();
  }, [generateQRCode]);

  // Handle image load error
  const handleImageError = () => {
    setError('Failed to load QR code image');
    if (onError) {
      onError(new Error('QR code image load failed'));
    }
  };

  // Handle successful image load
  const handleImageLoad = () => {
    setError(null);
    if (onLoad) {
      onLoad(qrCodeUrl);
    }
  };

  return (
    <div className={`qr-container ${className}`}>
      {/* Title */}
      {title && (
        <h3 className="text-xl font-bold text-orange-400 mb-4 text-center halloween-glow">
          {title}
        </h3>
      )}

      {/* QR Code Display Area */}
      <div className="qr-code-wrapper relative">
        {isLoading && (
          <div className="qr-loading flex flex-col items-center justify-center" 
               style={{ width: size, height: size }}>
            <div className="loading-spinner mb-2"></div>
            <p className="text-purple-300 text-sm">Generating QR Code...</p>
          </div>
        )}

        {error && (
          <div className="qr-error flex flex-col items-center justify-center spooky-border bg-red-900/20" 
               style={{ width: size, height: size }}>
            <div className="text-red-400 text-center p-4">
              <p className="font-semibold mb-2">⚠️ QR Code Error</p>
              <p className="text-sm mb-3">{error}</p>
              <button 
                onClick={handleRetry}
                className="btn btn-secondary px-3 py-1 text-xs"
                aria-label="Retry QR code generation"
              >
                Retry {retryCount > 0 && `(${retryCount})`}
              </button>
            </div>
          </div>
        )}

        {qrCodeUrl && !isLoading && !error && (
          <div className="qr-code-display">
            <img
              src={qrCodeUrl}
              alt={ariaLabel}
              width={size}
              height={size}
              className="qr-code rounded-lg shadow-lg"
              onError={handleImageError}
              onLoad={handleImageLoad}
              style={{
                imageRendering: 'crisp-edges', // Ensure sharp QR code rendering
                maxWidth: '100%',
                height: 'auto'
              }}
            />
            
            {/* QR Code Frame Effect */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `
                  linear-gradient(45deg, transparent 10px, rgba(255, 107, 53, 0.1) 10px, rgba(255, 107, 53, 0.1) 12px, transparent 12px),
                  linear-gradient(-45deg, transparent 10px, rgba(255, 107, 53, 0.1) 10px, rgba(255, 107, 53, 0.1) 12px, transparent 12px)
                `,
                borderRadius: '0.5rem'
              }}
            />
          </div>
        )}
      </div>

      {/* Instructions */}
      {showInstructions && !isLoading && !error && (
        <div className="qr-instructions mt-4 text-center">
          <div className="bg-purple-900/30 backdrop-blur-sm rounded-lg p-3 border border-purple-500/30">
            <p className="text-purple-200 text-sm mb-2">
              📱 <strong>Scan with your camera to access the site</strong>
            </p>
            <p className="text-purple-300 text-xs">
              💀 Once on the site, point your camera at this same QR code to reveal the vampire's message
            </p>
          </div>
        </div>
      )}

      {/* Download Link */}
      {qrCodeUrl && !isLoading && !error && (
        <div className="qr-actions mt-3 text-center">
          <a
            href={qrCodeUrl}
            download="halloween-ar-qr-code.png"
            className="text-orange-400 hover:text-orange-300 text-sm underline transition-colors"
            aria-label="Download QR code image"
          >
            💾 Download QR Code
          </a>
        </div>
      )}

      {/* Technical Info (Development Mode) */}
      {process.env.NODE_ENV === 'development' && qrCodeUrl && (
        <details className="mt-4 text-xs text-gray-400">
          <summary className="cursor-pointer hover:text-gray-300">Technical Details</summary>
          <div className="mt-2 p-2 bg-gray-800 rounded text-xs font-mono">
            <p><strong>URL:</strong> {url}</p>
            <p><strong>Size:</strong> {size}px</p>
            <p><strong>API:</strong> {qrCodeUrl}</p>
            <p><strong>Error Level:</strong> H (High)</p>
            <p><strong>Retries:</strong> {retryCount}</p>
          </div>
        </details>
      )}
    </div>
  );
};

/**
 * Compact QR Code Component for smaller displays
 */
export const CompactQRCode = ({ url, size = 128, className = "" }) => {
  return (
    <QRCodeDisplay
      url={url}
      size={size}
      title=""
      className={`compact-qr ${className}`}
      showInstructions={false}
      ariaLabel="Compact QR code"
    />
  );
};

/**
 * QR Code with Custom Styling Hook
 */
export const useQRCode = (url, options = {}) => {
  const [qrState, setQrState] = useState({
    url: '',
    isLoading: false,
    error: null,
    retryCount: 0
  });

  const generateQR = useCallback(async () => {
    if (!url) return;

    setQrState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const apiUrl = new URL('/api/qr-code', window.location.origin);
      apiUrl.searchParams.set('data', url);
      
      // Apply options
      if (options.size) apiUrl.searchParams.set('size', options.size.toString());
      if (options.format) apiUrl.searchParams.set('format', options.format);
      if (options.errorLevel) apiUrl.searchParams.set('errorLevel', options.errorLevel);

      const response = await fetch(apiUrl.toString());
      
      if (!response.ok) {
        throw new Error(`QR generation failed: ${response.status}`);
      }

      setQrState(prev => ({
        ...prev,
        url: apiUrl.toString(),
        isLoading: false,
        error: null
      }));

    } catch (error) {
      setQrState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message,
        retryCount: prev.retryCount + 1
      }));
    }
  }, [url, options]);

  const retry = useCallback(() => {
    generateQR();
  }, [generateQR]);

  useEffect(() => {
    generateQR();
  }, [generateQR]);

  return {
    ...qrState,
    retry
  };
};

export default QRCodeDisplay;