/**
 * Halloween AR Experience - Home Page
 * Main landing page with QR code display and AR instructions
 */

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import QRCodeDisplay from '../components/QRCodeDisplay';
import { trackQRScan, trackARStart, getCurrentSession } from '../lib/sessionManager';
import { getDeviceCapabilities, isARSupported } from '../lib/deviceCapabilities';
import { isCameraAvailable, getPermissionGuidance } from '../lib/cameraUtils';

export default function Home() {
  const [currentUrl, setCurrentUrl] = useState('');
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [arCapabilities, setArCapabilities] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [showAdvancedInfo, setShowAdvancedInfo] = useState(false);

  // Initialize page and detect capabilities
  useEffect(() => {
    const initialize = async () => {
      try {
        // Set current URL for QR code
        setCurrentUrl(window.location.href);

        // Get device capabilities
        const capabilities = await getDeviceCapabilities();
        setDeviceInfo(capabilities.deviceInfo);
        setArCapabilities(capabilities);

        // Get session information
        const session = getCurrentSession();
        setSessionInfo(session);

        // Track page visit
        if (typeof window !== 'undefined') {
          trackQRScan({
            action: 'page_visit',
            url: window.location.href,
            userAgent: navigator.userAgent,
            capabilities: capabilities.arSupported
          });
        }
      } catch (error) {
        console.error('Failed to initialize home page:', error);
      }
    };

    initialize();
  }, []);

  // Handle QR code successful generation
  const handleQRGenerated = (qrUrl) => {
    console.log('QR code generated:', qrUrl);
    
    // Track QR code generation
    trackQRScan({
      action: 'qr_generated',
      qrUrl,
      currentUrl
    });
  };

  // Handle QR code errors
  const handleQRError = (error) => {
    console.error('QR code error:', error);
    
    // Track error
    trackQRScan({
      action: 'qr_error',
      error: error.message,
      currentUrl
    });
  };

  return (
    <>
      <Head>
        <title>Halloween AR Hunt - Vampire's Secret</title>
        <meta name="description" content="Scan the QR code and discover the vampire's hidden message in augmented reality" />
        <meta name="keywords" content="Halloween, AR, augmented reality, vampire, QR code, hunt" />
        
        {/* Open Graph / Social Media */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Halloween AR Hunt - Vampire's Secret" />
        <meta property="og:description" content="Scan the QR code and discover the vampire's hidden message in augmented reality" />
        <meta property="og:url" content={currentUrl} />
        
        {/* Mobile optimization */}
        <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </Head>

      <Layout title="Halloween AR Hunt" showARUI={false}>
        {/* Hero Section */}
        <section className="text-center mb-8 px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-orange-400 mb-4 halloween-glow">
              🎃 The Vampire's Secret
            </h1>
            <p className="text-xl md:text-2xl text-purple-300 mb-6">
              A hidden message awaits those brave enough to seek it...
            </p>
            <div className="bg-purple-900/30 backdrop-blur-sm rounded-lg p-6 border border-purple-500/30">
              <p className="text-purple-200 text-lg leading-relaxed">
                🧛‍♂️ <em>"O vampiro se esconde no reflexo, mas Rupert percebeu a verdade... 
                Siga-o para a próxima pista antes que ele desapareça também."</em>
              </p>
              <p className="text-purple-400 text-sm mt-2">
                But this message is just the beginning. To see the vampire's true secret, 
                you must use the power of augmented reality...
              </p>
            </div>
          </div>
        </section>

        {/* Instructions Section */}
        <section className="mb-8 px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-orange-400 mb-4 text-center">
              🔍 How to Reveal the Secret
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-black/40 rounded-lg p-4 border border-orange-400/30">
                <div className="text-2xl mb-2">1️⃣</div>
                <h3 className="font-semibold text-orange-300 mb-2">Start AR Experience</h3>
                <p className="text-purple-200 text-sm">
                  Click "Start AR Experience" below on your mobile device to begin
                </p>
              </div>
              <div className="bg-black/40 rounded-lg p-4 border border-orange-400/30">
                <div className="text-2xl mb-2">2️⃣</div>
                <h3 className="font-semibold text-orange-300 mb-2">Allow Camera</h3>
                <p className="text-purple-200 text-sm">
                  Grant camera permission when prompted to enable AR scanning
                </p>
              </div>
              <div className="bg-black/40 rounded-lg p-4 border border-orange-400/30">
                <div className="text-2xl mb-2">3️⃣</div>
                <h3 className="font-semibold text-orange-300 mb-2">Point at QR Code</h3>
                <p className="text-purple-200 text-sm">
                  Point your camera at the QR code below to reveal the vampire's message
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* QR Code Section */}
        <section className="mb-8 px-4">
          <div className="max-w-md mx-auto">
            {currentUrl ? (
              <QRCodeDisplay
                url={currentUrl}
                size={320}
                title="🧛‍♂️ Vampire's Portal"
                onLoad={handleQRGenerated}
                onError={handleQRError}
                showInstructions={true}
                className="mx-auto"
              />
            ) : (
              <div className="text-center">
                <div className="loading-spinner mx-auto mb-4"></div>
                <p className="text-purple-300">Preparing your portal...</p>
              </div>
            )}
          </div>
        </section>

        {/* Device Compatibility Section */}
        {arCapabilities && (
          <section className="mb-8 px-4">
            <div className="max-w-2xl mx-auto">
              <div className={`rounded-lg p-4 border ${
                arCapabilities.arSupported 
                  ? 'bg-green-900/20 border-green-400/30' 
                  : 'bg-yellow-900/20 border-yellow-400/30'
              }`}>
                <div className="flex items-center mb-3">
                  <span className="text-2xl mr-2">
                    {arCapabilities.arSupported ? '✅' : '⚠️'}
                  </span>
                  <h3 className="font-semibold text-lg">
                    {arCapabilities.arSupported ? 'AR Ready!' : 'Limited AR Support'}
                  </h3>
                </div>
                
                <p className="text-sm mb-3">
                  {arCapabilities.arSupported 
                    ? 'Your device supports the full AR experience. Scan the QR code to begin!'
                    : 'Your device has limited AR support. You can still view the content, but the AR experience may be reduced.'
                  }
                </p>

                {/* Device Info */}
                {deviceInfo && (
                  <div className="text-xs text-gray-400">
                    <p>Device: {deviceInfo.deviceType} • Browser: {deviceInfo.browser}</p>
                    <p>AR Score: {arCapabilities.arScore}/100</p>
                  </div>
                )}

                {/* Recommendations */}
                {arCapabilities.recommendations && arCapabilities.recommendations.length > 0 && (
                  <details className="mt-3">
                    <summary className="text-sm cursor-pointer hover:text-orange-300">
                      View Recommendations
                    </summary>
                    <div className="mt-2 space-y-2">
                      {arCapabilities.recommendations.map((rec, index) => (
                        <div key={index} className="text-xs p-2 bg-black/30 rounded">
                          <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                            rec.type === 'critical' ? 'bg-red-400' :
                            rec.type === 'warning' ? 'bg-yellow-400' :
                            rec.type === 'error' ? 'bg-red-400' : 'bg-blue-400'
                          }`}></span>
                          <strong>{rec.message}</strong>
                          {rec.action && <div className="ml-4 mt-1 text-gray-400">{rec.action}</div>}
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </div>
          </section>
        )}

        {/* AR Experience Button */}
        {arCapabilities?.arSupported && (
          <section className="mb-8 px-4">
            <div className="text-center">
              <a
                href="/ar"
                className="inline-block btn btn-primary text-lg px-8 py-3 halloween-glow no-underline"
              >
                🧛‍♂️ Start AR Experience
              </a>
              <p className="text-purple-300 text-sm mt-2">
                Launch the AR vampire hunt directly on your mobile device
              </p>
              <div className="mt-4 text-xs text-gray-400">
                <p>✨ Best experienced on mobile devices</p>
                <p>📱 Requires camera permission</p>
              </div>
            </div>
          </section>
        )}

        {/* Footer Info */}
        <section className="px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-purple-900/20 rounded-lg p-4">
              <h3 className="font-semibold text-orange-300 mb-2">About this Experience</h3>
              <p className="text-purple-200 text-sm mb-3">
                This Halloween AR hunt uses your device's camera and advanced web technologies 
                to overlay digital content onto the real world. No app download required!
              </p>
              
              {/* Advanced Info Toggle */}
              <button
                onClick={() => setShowAdvancedInfo(!showAdvancedInfo)}
                className="text-orange-400 hover:text-orange-300 text-sm underline"
              >
                {showAdvancedInfo ? 'Hide' : 'Show'} Technical Details
              </button>

              {/* Advanced Information */}
              {showAdvancedInfo && sessionInfo && (
                <div className="mt-4 text-left text-xs font-mono bg-black/40 rounded p-3 border border-gray-600">
                  <p><strong>Session:</strong> {sessionInfo.sessionId}</p>
                  <p><strong>Duration:</strong> {Math.round(sessionInfo.duration / 1000)}s</p>
                  <p><strong>Interactions:</strong> {sessionInfo.interactionCount}</p>
                  <p><strong>AR State:</strong> {sessionInfo.state}</p>
                  {deviceInfo && (
                    <>
                      <p><strong>Screen:</strong> {deviceInfo.screenSize?.width}×{deviceInfo.screenSize?.height}</p>
                      <p><strong>Language:</strong> {deviceInfo.language}</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </Layout>
    </>
  );
}