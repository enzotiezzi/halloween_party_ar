import Head from 'next/head';
import { useState, useEffect } from 'react';

const Layout = ({ children, title = 'Halloween AR Experience', showARUI = false }) => {
  const [isARSupported, setIsARSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for AR support (WebXR or WebRTC)
    const checkARSupport = async () => {
      let supported = false;
      
      try {
        // Check for camera access
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          // Check for WebXR support
          if (navigator.xr) {
            const isSupported = await navigator.xr.isSessionSupported('immersive-ar');
            supported = isSupported;
          } else {
            // Fallback: assume camera access means AR capability
            supported = true;
          }
        }
      } catch (error) {
        console.warn('AR support check failed:', error);
        supported = false;
      }
      
      setIsARSupported(supported);
      setIsLoading(false);
    };

    checkARSupport();
  }, []);

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="Halloween AR Experience - QR Code Vampire Hunt" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* AR-specific meta tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* Preload AR libraries when AR UI is needed */}
        {showARUI && (
          <>
            <link rel="preload" href="https://cdn.jsdelivr.net/npm/mind-ar@1.2.2/dist/mindar-image.prod.js" as="script" />
            <link rel="preload" href="https://cdn.jsdelivr.net/npm/mind-ar@1.2.2/dist/mindar-image-aframe.prod.js" as="script" />
            <link rel="preload" href="https://aframe.io/releases/1.4.0/aframe.min.js" as="script" />
          </>
        )}
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-black to-purple-900">
        {/* Header */}
        <header className="p-4 text-center">
          <h1 className="text-2xl md:text-4xl font-bold text-orange-400 mb-2">
            🎃 Halloween AR Hunt
          </h1>
          {!isLoading && (
            <p className="text-purple-300 text-sm md:text-base">
              {isARSupported 
                ? "AR Ready - Scan QR codes to reveal hidden messages" 
                : "Camera access required for AR experience"
              }
            </p>
          )}
        </header>

        {/* Main content */}
        <main className="container mx-auto px-4 pb-8">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400 mx-auto mb-4"></div>
                <p className="text-purple-300">Checking AR capabilities...</p>
              </div>
            </div>
          ) : (
            children
          )}
        </main>

        {/* Footer */}
        <footer className="text-center p-4 text-purple-400 text-sm">
          <p>Follow the vampire's trail... if you dare 🧛‍♂️</p>
        </footer>

        {/* AR Status Indicator */}
        {showARUI && !isLoading && (
          <div className="fixed top-4 right-4 z-50">
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              isARSupported 
                ? 'bg-green-600 text-white' 
                : 'bg-red-600 text-white'
            }`}>
              {isARSupported ? '📱 AR Ready' : '❌ AR Unavailable'}
            </div>
          </div>
        )}
      </div>

      {/* Global styles for Halloween theme */}
      <style jsx global>{`
        body {
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #000;
          color: #fff;
        }
        
        * {
          box-sizing: border-box;
        }
        
        .halloween-glow {
          text-shadow: 0 0 10px #ff6b35, 0 0 20px #ff6b35, 0 0 30px #ff6b35;
        }
        
        .vampire-shadow {
          box-shadow: 0 4px 20px rgba(139, 69, 19, 0.3);
        }
        
        @media (max-width: 768px) {
          .container {
            padding-left: 1rem;
            padding-right: 1rem;
          }
        }
      `}</style>
    </>
  );
};

export default Layout;