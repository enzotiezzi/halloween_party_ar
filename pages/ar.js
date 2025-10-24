/**
 * AR Experience Page
 * Main AR experience with QR marker detection and vampire message display
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../components/Layout';
import ARSessionManager from '../src/components/ARSessionManager';
import { useSession } from '../lib/session';
import { useDeviceCapabilities } from '../src/hooks/useDeviceCapabilities';

export default function ARExperience() {
  const router = useRouter();
  const { qr } = router.query; // QR code data from URL params
  
  // State
  const [arState, setArState] = useState({
    sessionActive: false,
    markerDetected: false,
    error: null,
    sessionStats: null
  });

  // Hooks
  const { session, updateSession } = useSession();
  const { capabilities, isLoading, isSupported } = useDeviceCapabilities();

  // Handle session start
  const handleSessionStart = () => {
    console.log('AR session started');
    setArState(prev => ({ ...prev, sessionActive: true, error: null }));
    
    updateSession({
      ar_experience: {
        started: true,
        started_at: new Date().toISOString(),
        entry_point: 'ar_page'
      }
    });
  };

  // Handle session end
  const handleSessionEnd = (stats) => {
    console.log('AR session ended', stats);
    setArState(prev => ({
      ...prev,
      sessionActive: false,
      sessionStats: stats
    }));
    
    updateSession({
      ar_experience: {
        ended: true,
        ended_at: new Date().toISOString(),
        session_stats: stats
      }
    });
  };

  // Handle marker detection
  const handleMarkerDetected = (anchor) => {
    console.log('Vampire marker detected!', anchor);
    setArState(prev => ({ ...prev, markerDetected: true }));
    
    updateSession({
      ar_experience: {
        vampire_marker_detected: true,
        marker_detected_at: new Date().toISOString()
      }
    });
  };

  // Handle AR errors
  const handleARError = (error) => {
    console.error('AR Experience error:', error);
    setArState(prev => ({ ...prev, error: error.message }));
    
    updateSession({
      ar_experience: {
        error: error.message,
        error_at: new Date().toISOString()
      }
    });
  };

  // Handle back navigation
  const handleBackNavigation = () => {
    if (arState.sessionActive) {
      // Session will be ended by ARSessionManager
      router.push('/');
    } else {
      router.push('/');
    }
  };

  // Page title and meta
  const pageTitle = 'AR Vampiro - Experiência Imersiva';
  const pageDescription = 'Aponte sua câmera para o código QR e descubra a mensagem secreta do vampiro Rupert.';

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        
        {/* PWA Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#8b0000" />
        
        {/* Prevent zoom on iOS */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
        
        {/* Preload AR libraries */}
        <link rel="preload" href="https://unpkg.com/three@0.158.0/build/three.min.js" as="script" />
        <link rel="preload" href="https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-three.prod.js" as="script" />
        
        {/* Portuguese AR Fonts */}
        <link rel="stylesheet" href="/fonts/portuguese-ar.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        
        {/* Open Graph */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/vampire-og-image.png" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content="/vampire-og-image.png" />
      </Head>

      <Layout className="ar-experience-layout">
        <div className="ar-experience-page">
          {/* Loading State */}
          {isLoading && (
            <div className="loading-overlay">
              <div className="loading-content">
                <div className="vampire-spinner"></div>
                <h2>Preparando Experiência AR</h2>
                <p>Verificando capacidades do seu dispositivo...</p>
              </div>
            </div>
          )}

          {/* Unsupported Device */}
          {!isLoading && !isSupported && (
            <div className="unsupported-overlay">
              <div className="unsupported-content">
                <h2>AR Não Suportado</h2>
                <p>Seu dispositivo ou navegador não suporta a experiência AR.</p>
                
                <div className="support-info">
                  <h3>Dispositivos Recomendados:</h3>
                  <ul>
                    <li>📱 iPhone com iOS 14+ (Safari)</li>
                    <li>📱 Android com Chrome 81+</li>
                    <li>📱 Samsung Internet Browser</li>
                  </ul>
                </div>

                <div className="fallback-options">
                  <h3>Alternativas:</h3>
                  <button 
                    onClick={() => router.push('/')}
                    className="back-button"
                  >
                    Voltar ao QR Code
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* AR Session */}
          {!isLoading && isSupported && (
            <ARSessionManager
              qrCodeData={qr}
              onSessionStart={handleSessionStart}
              onSessionEnd={handleSessionEnd}
              onMarkerDetected={handleMarkerDetected}
              onError={handleARError}
              autoStart={true}
              className="ar-session"
            />
          )}

          {/* AR Instructions Overlay */}
          {!isLoading && isSupported && !arState.markerDetected && arState.sessionActive && (
            <div className="instructions-overlay">
              <div className="instructions-content">
                <div className="instruction-icon">📱</div>
                <h3>Encontre o Vampiro</h3>
                <p>Aponte sua câmera para o código QR para revelar a mensagem secreta</p>
                
                <div className="instruction-tips">
                  <div className="tip">
                    <span className="tip-icon">💡</span>
                    <span>Mantenha o QR code visível na tela</span>
                  </div>
                  <div className="tip">
                    <span className="tip-icon">🔦</span>
                    <span>Certifique-se de ter boa iluminação</span>
                  </div>
                  <div className="tip">
                    <span className="tip-icon">📐</span>
                    <span>Mantenha a câmera estável</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Success State */}
          {arState.markerDetected && (
            <div className="success-indicator">
              <div className="success-icon">🧛‍♂️</div>
              <p>Vampiro encontrado!</p>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="navigation-controls">
            <button 
              onClick={handleBackNavigation}
              className="back-nav-button"
              aria-label="Voltar"
            >
              <span className="back-icon">←</span>
              <span className="back-text">Voltar</span>
            </button>
          </div>

          {/* Error Display */}
          {arState.error && (
            <div className="error-notification">
              <div className="error-content">
                <span className="error-icon">⚠️</span>
                <span className="error-text">{arState.error}</span>
              </div>
            </div>
          )}

          {/* Session Stats (when session ends) */}
          {arState.sessionStats && !arState.sessionActive && (
            <div className="session-stats-overlay">
              <div className="stats-content">
                <h3>Sessão AR Finalizada</h3>
                <div className="stats-grid">
                  <div className="stat">
                    <span className="stat-label">Duração</span>
                    <span className="stat-value">
                      {Math.round(arState.sessionStats.duration / 1000)}s
                    </span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Detecções</span>
                    <span className="stat-value">
                      {arState.sessionStats.statistics?.markerDetections || 0}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => router.push('/')}
                  className="stats-close-button"
                >
                  Finalizar
                </button>
              </div>
            </div>
          )}
        </div>

        <style jsx>{`
          .ar-experience-page {
            position: relative;
            width: 100vw;
            height: 100vh;
            background: #000;
            overflow: hidden;
          }

          .ar-session {
            width: 100%;
            height: 100%;
          }

          .loading-overlay,
          .unsupported-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, #1a0d1a 0%, #2d1b2d 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }

          .loading-content,
          .unsupported-content {
            text-align: center;
            color: white;
            max-width: 90%;
            padding: 2rem;
          }

          .vampire-spinner {
            width: 60px;
            height: 60px;
            border: 3px solid rgba(139, 0, 0, 0.3);
            border-top: 3px solid #8b0000;
            border-radius: 50%;
            animation: vampireSpin 1.5s linear infinite;
            margin: 0 auto 1.5rem;
          }

          .support-info,
          .fallback-options {
            margin: 1.5rem 0;
            text-align: left;
          }

          .support-info ul {
            list-style: none;
            padding: 0;
          }

          .support-info li {
            padding: 0.5rem 0;
            border-bottom: 1px solid rgba(139, 0, 0, 0.2);
          }

          .back-button {
            background: #8b0000;
            color: white;
            border: none;
            padding: 1rem 2rem;
            border-radius: 0.5rem;
            font-size: 1rem;
            cursor: pointer;
            transition: background 0.3s ease;
          }

          .back-button:hover {
            background: #a00000;
          }

          .instructions-overlay {
            position: absolute;
            bottom: 2rem;
            left: 1rem;
            right: 1rem;
            background: rgba(20, 0, 20, 0.95);
            border: 2px solid rgba(139, 0, 0, 0.6);
            border-radius: 1rem;
            padding: 1.5rem;
            color: white;
            backdrop-filter: blur(10px);
            z-index: 100;
            animation: slideUpFade 0.8s ease-out;
          }

          .instructions-content {
            text-align: center;
          }

          .instruction-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
          }

          .instruction-tips {
            margin-top: 1rem;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .tip {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.9rem;
            opacity: 0.9;
          }

          .tip-icon {
            flex-shrink: 0;
          }

          .success-indicator {
            position: absolute;
            top: 2rem;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 100, 0, 0.9);
            color: white;
            padding: 1rem 2rem;
            border-radius: 2rem;
            text-align: center;
            z-index: 200;
            animation: successPulse 2s ease-in-out infinite;
          }

          .success-icon {
            font-size: 1.5rem;
            margin-bottom: 0.5rem;
          }

          .navigation-controls {
            position: absolute;
            top: 1rem;
            left: 1rem;
            z-index: 150;
          }

          .back-nav-button {
            background: rgba(0, 0, 0, 0.7);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 2rem;
            padding: 0.8rem 1.5rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            cursor: pointer;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
          }

          .back-nav-button:hover {
            background: rgba(139, 0, 0, 0.8);
            border-color: rgba(139, 0, 0, 0.8);
          }

          .back-icon {
            font-size: 1.2rem;
          }

          .error-notification {
            position: absolute;
            bottom: 1rem;
            left: 1rem;
            right: 1rem;
            background: rgba(139, 0, 0, 0.9);
            border: 1px solid rgba(139, 0, 0, 1);
            border-radius: 0.5rem;
            padding: 1rem;
            color: white;
            z-index: 200;
            animation: errorSlide 0.5s ease-out;
          }

          .error-content {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .session-stats-overlay {
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

          .stats-content {
            background: linear-gradient(135deg, #2d1b2d 0%, #1a0d1a 100%);
            border: 2px solid rgba(139, 0, 0, 0.6);
            border-radius: 1rem;
            padding: 2rem;
            color: white;
            text-align: center;
            max-width: 90%;
          }

          .stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            margin: 1.5rem 0;
          }

          .stat {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
          }

          .stat-label {
            font-size: 0.9rem;
            opacity: 0.8;
          }

          .stat-value {
            font-size: 1.5rem;
            font-weight: bold;
            color: #8b0000;
          }

          .stats-close-button {
            background: #8b0000;
            color: white;
            border: none;
            padding: 0.8rem 2rem;
            border-radius: 0.5rem;
            cursor: pointer;
            transition: background 0.3s ease;
          }

          .stats-close-button:hover {
            background: #a00000;
          }

          @keyframes vampireSpin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          @keyframes slideUpFade {
            0% {
              opacity: 0;
              transform: translateY(100%);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes successPulse {
            0%, 100% {
              opacity: 0.8;
              transform: translateX(-50%) scale(1);
            }
            50% {
              opacity: 1;
              transform: translateX(-50%) scale(1.05);
            }
          }

          @keyframes errorSlide {
            0% {
              opacity: 0;
              transform: translateY(100%);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @media (max-width: 768px) {
            .instructions-overlay {
              bottom: 1rem;
              left: 0.5rem;
              right: 0.5rem;
              padding: 1rem;
            }

            .instruction-tips {
              font-size: 0.8rem;
            }

            .navigation-controls {
              top: 0.5rem;
              left: 0.5rem;
            }

            .back-nav-button {
              padding: 0.6rem 1rem;
            }

            .back-text {
              display: none;
            }
          }

          @media (orientation: landscape) and (max-height: 500px) {
            .instructions-overlay {
              bottom: 0.5rem;
              padding: 0.8rem;
            }

            .instruction-icon {
              font-size: 2rem;
              margin-bottom: 0.5rem;
            }

            .instructions-content h3 {
              margin: 0.5rem 0;
            }
          }
        `}</style>
      </Layout>
    </>
  );
}