/**
 * ARScene Component
 * Core AR experience using MindAR.js for QR code marker detection and Three.js for rendering
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSession } from '../../lib/session';
import { useDeviceCapabilities } from '../hooks/useDeviceCapabilities';
import MessageOverlay from './MessageOverlay';

const ARScene = ({
  cameraStream,
  qrCodeData,
  onMarkerFound,
  onMarkerLost,
  onError,
  children,
  className = '',
  style = {}
}) => {
  // State
  const [arState, setArState] = useState({
    initialized: false,
    running: false,
    markerVisible: false,
    error: null,
    performance: null
  });

  const [vampireMessage, setVampireMessage] = useState(null);
  const [showMessage, setShowMessage] = useState(false);

  // Refs
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const mindARRef = useRef(null);
  const threeSceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const performanceRef = useRef({
    frameCount: 0,
    lastFPS: 0,
    startTime: Date.now()
  });

  // Hooks
  const { session, updateSession } = useSession();
  const { capabilities } = useDeviceCapabilities();

  // Load MindAR and Three.js libraries
  const loadLibraries = useCallback(async () => {
    try {
      // Check if libraries are already loaded
      if (window.MINDAR && window.THREE) {
        return { MINDAR: window.MINDAR, THREE: window.THREE };
      }

      // Load Three.js
      if (!window.THREE) {
        await loadScript('https://unpkg.com/three@0.158.0/build/three.min.js');
      }

      // Load MindAR
      if (!window.MINDAR) {
        await loadScript('https://cdn.jsdelivr.net/npm/mind-ar@1.2.2/dist/mindar-image.prod.js');
      }

      return { MINDAR: window.MINDAR, THREE: window.THREE };
    } catch (error) {
      console.error('Failed to load AR libraries:', error);
      throw new Error('AR libraries failed to load');
    }
  }, []);

  // Utility function to load scripts
  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  // Fetch vampire message configuration
  const fetchVampireMessage = useCallback(async () => {
    try {
      const response = await fetch('/api/ar/message');
      if (!response.ok) {
        throw new Error('Failed to fetch vampire message');
      }
      const data = await response.json();
      setVampireMessage(data);
      return data;
    } catch (error) {
      console.error('Failed to fetch vampire message:', error);
      return null;
    }
  }, []);

  // Initialize Three.js scene
  const initializeThreeScene = useCallback((THREE) => {
    try {
      // Create scene
      const scene = new THREE.Scene();
      
      // Create camera (will be replaced by MindAR camera)
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      
      // Create renderer
      const renderer = new THREE.WebGLRenderer({ 
        canvas: canvasRef.current,
        alpha: true,
        antialias: capabilities?.device?.class === 'high_end' ? true : false
      });
      
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
      
      // Store references
      threeSceneRef.current = scene;
      rendererRef.current = renderer;
      cameraRef.current = camera;

      return { scene, camera, renderer };
    } catch (error) {
      console.error('Failed to initialize Three.js scene:', error);
      throw error;
    }
  }, [capabilities]);

  // Create AR marker content
  const createARContent = useCallback((THREE, scene) => {
    try {
      // Create anchor group for AR content
      const anchor = new THREE.Group();
      
      // Create vampire message plane
      const messageGeometry = new THREE.PlaneGeometry(2, 1);
      
      // Create canvas for text rendering
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 256;
      const context = canvas.getContext('2d');
      
      // Style vampire message
      context.fillStyle = 'rgba(20, 0, 20, 0.9)';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add border
      context.strokeStyle = 'rgba(139, 0, 0, 0.8)';
      context.lineWidth = 4;
      context.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
      
      // Add text
      context.fillStyle = '#f4f4f4';
      context.font = 'bold 28px serif';
      context.textAlign = 'center';
      context.shadowColor = 'rgba(139, 0, 0, 0.8)';
      context.shadowBlur = 10;
      
      const text = vampireMessage?.content?.text || 'Vampire message loading...';
      const maxWidth = canvas.width - 40;
      const lineHeight = 35;
      
      // Wrap text
      const words = text.split(' ');
      let line = '';
      let y = 80;
      
      words.forEach((word, index) => {
        const testLine = line + word + ' ';
        const metrics = context.measureText(testLine);
        
        if (metrics.width > maxWidth && index > 0) {
          context.fillText(line, canvas.width / 2, y);
          line = word + ' ';
          y += lineHeight;
        } else {
          line = testLine;
        }
      });
      
      context.fillText(line, canvas.width / 2, y);
      
      // Add subtitle
      context.font = 'italic 18px serif';
      context.fillStyle = 'rgba(220, 220, 220, 0.8)';
      context.fillText('— Uma mensagem do além —', canvas.width / 2, y + 40);
      
      // Create texture and material
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.MeshBasicMaterial({ 
        map: texture, 
        transparent: true,
        opacity: 0.9
      });
      
      const messagePlane = new THREE.Mesh(messageGeometry, material);
      messagePlane.position.set(0, 0, 0.1);
      anchor.add(messagePlane);
      
      // Add glowing border effect
      const borderGeometry = new THREE.PlaneGeometry(2.2, 1.2);
      const borderMaterial = new THREE.MeshBasicMaterial({
        color: 0x8b0000,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
      });
      
      const borderPlane = new THREE.Mesh(borderGeometry, borderMaterial);
      borderPlane.position.set(0, 0, 0.05);
      anchor.add(borderPlane);
      
      // Add to scene
      scene.add(anchor);
      
      return anchor;
    } catch (error) {
      console.error('Failed to create AR content:', error);
      return null;
    }
  }, [vampireMessage]);

  // Initialize MindAR
  const initializeMindAR = useCallback(async () => {
    try {
      const { MINDAR, THREE } = await loadLibraries();
      
      // Initialize Three.js
      const { scene, camera, renderer } = initializeThreeScene(THREE);
      
      // Create QR code marker image
      const markerImage = await createQRMarkerImage();
      
      // Initialize MindAR
      const mindar = new MINDAR.IMAGE.MindARThree({
        container: containerRef.current,
        imageTargetSrc: markerImage,
        maxTrack: 1,
        uiLoading: 'no',
        uiScanning: 'no',
        uiError: 'no'
      });
      
      // Store reference
      mindARRef.current = mindar;
      
      // Get MindAR scene and camera
      const { scene: mindARScene, camera: mindARCamera, renderer: mindARRenderer } = mindar;
      
      // Update references
      threeSceneRef.current = mindARScene;
      cameraRef.current = mindARCamera;
      rendererRef.current = mindARRenderer;
      
      // Create AR content
      const arContent = createARContent(THREE, mindARScene);
      
      // Add anchor for marker tracking
      const anchor = mindar.addAnchor(0);
      if (arContent) {
        anchor.group.add(arContent);
      }
      
      // Set up marker events
      anchor.onTargetFound = () => {
        console.log('AR marker found');
        setArState(prev => ({ ...prev, markerVisible: true }));
        setShowMessage(true);
        
        updateSession({
          ar_session: {
            marker_found: true,
            marker_found_at: new Date().toISOString()
          }
        });
        
        if (onMarkerFound) {
          onMarkerFound(anchor);
        }
      };
      
      anchor.onTargetLost = () => {
        console.log('AR marker lost');
        setArState(prev => ({ ...prev, markerVisible: false }));
        setShowMessage(false);
        
        updateSession({
          ar_session: {
            marker_found: false,
            marker_lost_at: new Date().toISOString()
          }
        });
        
        if (onMarkerLost) {
          onMarkerLost(anchor);
        }
      };
      
      return mindar;
    } catch (error) {
      console.error('Failed to initialize MindAR:', error);
      throw error;
    }
  }, [loadLibraries, initializeThreeScene, createARContent, onMarkerFound, onMarkerLost, updateSession]);

  // Create QR marker image from QR code data
  const createQRMarkerImage = useCallback(async () => {
    try {
      if (!qrCodeData) {
        // Use default QR code if none provided
        const QRCode = (await import('qrcode')).default;
        const qrDataURL = await QRCode.toDataURL('https://halloween-vampire-ar.vercel.app/', {
          errorCorrectionLevel: 'M',
          type: 'image/png',
          quality: 1,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          width: 256
        });
        return qrDataURL;
      }
      
      return qrCodeData;
    } catch (error) {
      console.error('Failed to create QR marker image:', error);
      // Return a simple data URL as fallback
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    }
  }, [qrCodeData]);

  // Start AR experience
  const startAR = useCallback(async () => {
    try {
      if (!mindARRef.current) {
        throw new Error('MindAR not initialized');
      }
      
      setArState(prev => ({ ...prev, running: true, error: null }));
      
      // Start MindAR
      await mindARRef.current.start();
      
      // Start performance monitoring
      startPerformanceMonitoring();
      
      updateSession({
        ar_session: {
          started: true,
          started_at: new Date().toISOString(),
          device_capabilities: capabilities
        }
      });
      
    } catch (error) {
      console.error('Failed to start AR:', error);
      setArState(prev => ({ 
        ...prev, 
        running: false, 
        error: error.message 
      }));
      
      if (onError) {
        onError(error);
      }
    }
  }, [capabilities, updateSession, onError]);

  // Stop AR experience
  const stopAR = useCallback(async () => {
    try {
      if (mindARRef.current) {
        await mindARRef.current.stop();
      }
      
      setArState(prev => ({ 
        ...prev, 
        running: false, 
        markerVisible: false 
      }));
      
      setShowMessage(false);
      
      updateSession({
        ar_session: {
          started: false,
          stopped_at: new Date().toISOString()
        }
      });
      
    } catch (error) {
      console.error('Failed to stop AR:', error);
    }
  }, [updateSession]);

  // Performance monitoring
  const startPerformanceMonitoring = useCallback(() => {
    const monitor = () => {
      if (!arState.running) return;
      
      performanceRef.current.frameCount++;
      const now = Date.now();
      const elapsed = now - performanceRef.current.startTime;
      
      if (elapsed >= 1000) { // Update every second
        const fps = Math.round((performanceRef.current.frameCount * 1000) / elapsed);
        performanceRef.current.lastFPS = fps;
        performanceRef.current.frameCount = 0;
        performanceRef.current.startTime = now;
        
        setArState(prev => ({
          ...prev,
          performance: { fps, timestamp: now }
        }));
      }
      
      requestAnimationFrame(monitor);
    };
    
    monitor();
  }, [arState.running]);

  // Initialize AR when camera stream is available
  useEffect(() => {
    if (cameraStream && !arState.initialized) {
      fetchVampireMessage().then(() => {
        initializeMindAR().then(() => {
          setArState(prev => ({ ...prev, initialized: true }));
        }).catch(error => {
          console.error('AR initialization failed:', error);
          setArState(prev => ({ 
            ...prev, 
            error: error.message 
          }));
          if (onError) {
            onError(error);
          }
        });
      });
    }
  }, [cameraStream, arState.initialized, fetchVampireMessage, initializeMindAR, onError]);

  // Auto-start AR when initialized
  useEffect(() => {
    if (arState.initialized && !arState.running && !arState.error) {
      startAR();
    }
  }, [arState.initialized, arState.running, arState.error, startAR]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (rendererRef.current && cameraRef.current) {
        const { innerWidth, innerHeight } = window;
        
        rendererRef.current.setSize(innerWidth, innerHeight);
        cameraRef.current.aspect = innerWidth / innerHeight;
        cameraRef.current.updateProjectionMatrix();
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAR();
    };
  }, [stopAR]);

  return (
    <div 
      ref={containerRef}
      className={`ar-scene ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        ...style
      }}
    >
      {/* AR Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          touchAction: 'none'
        }}
      />
      
      {/* Message Overlay */}
      {vampireMessage && (
        <MessageOverlay
          message={vampireMessage.content?.text}
          isVisible={showMessage && arState.markerVisible}
          animationType="vampire-whisper"
          autoHide={false}
          position={{ x: 0.5, y: 0.7, z: 0 }}
          scale={1}
        />
      )}
      
      {/* AR Status Indicators */}
      <div className="ar-status">
        {arState.running && (
          <div className="status-indicator active">
            <span>AR Ativo</span>
            {arState.performance && (
              <span className="fps">{arState.performance.fps} FPS</span>
            )}
          </div>
        )}
        
        {arState.error && (
          <div className="status-indicator error">
            <span>Erro AR: {arState.error}</span>
          </div>
        )}
        
        {!arState.markerVisible && arState.running && (
          <div className="scan-instruction">
            <span>Aponte a câmera para o código QR</span>
          </div>
        )}
      </div>
      
      {/* Additional content */}
      {children}
      
      <style jsx>{`
        .ar-scene {
          background: #000;
        }
        
        .ar-status {
          position: absolute;
          top: 1rem;
          left: 1rem;
          right: 1rem;
          z-index: 100;
          pointer-events: none;
        }
        
        .status-indicator {
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .status-indicator.active {
          border-left: 3px solid #00ff00;
        }
        
        .status-indicator.error {
          border-left: 3px solid #ff0000;
        }
        
        .fps {
          font-family: monospace;
          font-size: 0.8rem;
          opacity: 0.8;
        }
        
        .scan-instruction {
          position: absolute;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(139, 0, 0, 0.8);
          color: white;
          padding: 1rem 2rem;
          border-radius: 2rem;
          font-size: 1rem;
          text-align: center;
          animation: pulse 2s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.8; transform: translateX(-50%) scale(1); }
          50% { opacity: 1; transform: translateX(-50%) scale(1.05); }
        }
        
        @media (max-width: 768px) {
          .ar-status {
            top: 0.5rem;
            left: 0.5rem;
            right: 0.5rem;
          }
          
          .status-indicator {
            font-size: 0.8rem;
            padding: 0.4rem 0.8rem;
          }
          
          .scan-instruction {
            bottom: 1rem;
            padding: 0.8rem 1.5rem;
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ARScene;