/**
 * MessageOverlay Component
 * Displays AR vampire message with animations and Portuguese typography
 */

import { useState, useEffect, useRef } from 'react';
import { useSession } from '../../lib/session';

const MessageOverlay = ({ 
  message,
  isVisible = false,
  position = { x: 0.5, y: 0.5, z: 0 },
  scale = 1,
  opacity = 1,
  animationType = 'fade-in',
  autoHide = false,
  autoHideDelay = 5000,
  onShow,
  onHide,
  onAnimationComplete,
  className = '',
  style = {}
}) => {
  // State
  const [displayState, setDisplayState] = useState({
    visible: isVisible,
    animating: false,
    animationPhase: 'idle' // 'idle' | 'entering' | 'visible' | 'exiting'
  });

  const [messageStats, setMessageStats] = useState({
    showCount: 0,
    totalVisibleTime: 0,
    lastShown: null
  });

  // Refs
  const overlayRef = useRef(null);
  const animationRef = useRef(null);
  const hideTimeoutRef = useRef(null);
  const visibilityStartRef = useRef(null);

  // Hooks
  const { session, updateSession } = useSession();

  // Animation configurations
  const animations = {
    'fade-in': {
      enter: { opacity: 0, transform: 'scale(0.8)' },
      visible: { opacity: 1, transform: 'scale(1)' },
      exit: { opacity: 0, transform: 'scale(0.8)' },
      duration: 800,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    },
    'slide-up': {
      enter: { opacity: 0, transform: 'translateY(100%) scale(0.9)' },
      visible: { opacity: 1, transform: 'translateY(0%) scale(1)' },
      exit: { opacity: 0, transform: 'translateY(-50%) scale(0.9)' },
      duration: 1000,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    },
    'glow-emerge': {
      enter: { 
        opacity: 0, 
        transform: 'scale(0.5)',
        filter: 'blur(10px) brightness(0.5)',
        textShadow: '0 0 0 rgba(139, 0, 0, 0)'
      },
      visible: { 
        opacity: 1, 
        transform: 'scale(1)',
        filter: 'blur(0px) brightness(1)',
        textShadow: '0 0 20px rgba(139, 0, 0, 0.8), 0 0 40px rgba(139, 0, 0, 0.5)'
      },
      exit: { 
        opacity: 0, 
        transform: 'scale(1.2)',
        filter: 'blur(5px) brightness(2)',
        textShadow: '0 0 30px rgba(139, 0, 0, 1)'
      },
      duration: 1200,
      easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    },
    'vampire-whisper': {
      enter: { 
        opacity: 0, 
        transform: 'scale(0.3) rotateZ(-5deg)',
        filter: 'blur(15px)',
        textShadow: '0 0 0 transparent'
      },
      visible: { 
        opacity: 1, 
        transform: 'scale(1) rotateZ(0deg)',
        filter: 'blur(0px)',
        textShadow: '0 0 15px rgba(139, 0, 0, 0.6), 0 0 30px rgba(75, 0, 130, 0.4), 2px 2px 4px rgba(0, 0, 0, 0.8)'
      },
      exit: { 
        opacity: 0, 
        transform: 'scale(0.1) rotateZ(3deg)',
        filter: 'blur(20px)',
        textShadow: '0 0 50px rgba(139, 0, 0, 1)'
      },
      duration: 1500,
      easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    }
  };

  // Get current animation config
  const currentAnimation = animations[animationType] || animations['fade-in'];

  // Show message with animation
  const showMessage = async () => {
    if (displayState.animating || displayState.visible) return;

    // Cancel any pending hide
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    try {
      // Update state
      setDisplayState(prev => ({
        ...prev,
        visible: true,
        animating: true,
        animationPhase: 'entering'
      }));

      // Track visibility start
      visibilityStartRef.current = Date.now();

      // Update stats
      setMessageStats(prev => ({
        ...prev,
        showCount: prev.showCount + 1,
        lastShown: new Date().toISOString()
      }));

      // Update session
      updateSession({
        ar_message: {
          shown: true,
          show_count: messageStats.showCount + 1,
          last_shown: new Date().toISOString(),
          message_text: message,
          animation_type: animationType
        }
      });

      // Apply enter animation
      if (overlayRef.current) {
        const overlay = overlayRef.current;
        
        // Set initial state
        Object.assign(overlay.style, {
          display: 'block',
          ...currentAnimation.enter,
          transition: 'none'
        });

        // Force reflow
        overlay.offsetHeight;

        // Animate to visible state
        Object.assign(overlay.style, {
          ...currentAnimation.visible,
          transition: `all ${currentAnimation.duration}ms ${currentAnimation.easing}`
        });

        // Wait for animation to complete
        await new Promise(resolve => {
          animationRef.current = setTimeout(resolve, currentAnimation.duration);
        });

        // Update state
        setDisplayState(prev => ({
          ...prev,
          animating: false,
          animationPhase: 'visible'
        }));

        // Notify callbacks
        if (onShow) onShow();
        if (onAnimationComplete) onAnimationComplete('enter');

        // Set auto-hide timer if enabled
        if (autoHide && autoHideDelay > 0) {
          hideTimeoutRef.current = setTimeout(() => {
            hideMessage();
          }, autoHideDelay);
        }
      }

    } catch (error) {
      console.error('Failed to show message:', error);
      setDisplayState(prev => ({
        ...prev,
        animating: false,
        animationPhase: 'idle'
      }));
    }
  };

  // Hide message with animation
  const hideMessage = async () => {
    if (displayState.animating || !displayState.visible) return;

    // Cancel auto-hide timer
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    try {
      // Update state
      setDisplayState(prev => ({
        ...prev,
        animating: true,
        animationPhase: 'exiting'
      }));

      // Track visibility duration
      if (visibilityStartRef.current) {
        const visibleDuration = Date.now() - visibilityStartRef.current;
        setMessageStats(prev => ({
          ...prev,
          totalVisibleTime: prev.totalVisibleTime + visibleDuration
        }));
        visibilityStartRef.current = null;
      }

      // Apply exit animation
      if (overlayRef.current) {
        const overlay = overlayRef.current;
        
        // Animate to exit state
        Object.assign(overlay.style, {
          ...currentAnimation.exit,
          transition: `all ${currentAnimation.duration}ms ${currentAnimation.easing}`
        });

        // Wait for animation to complete
        await new Promise(resolve => {
          animationRef.current = setTimeout(resolve, currentAnimation.duration);
        });

        // Hide element
        overlay.style.display = 'none';

        // Update state
        setDisplayState(prev => ({
          ...prev,
          visible: false,
          animating: false,
          animationPhase: 'idle'
        }));

        // Update session
        updateSession({
          ar_message: {
            shown: false,
            hidden_at: new Date().toISOString(),
            total_visible_time: messageStats.totalVisibleTime
          }
        });

        // Notify callbacks
        if (onHide) onHide();
        if (onAnimationComplete) onAnimationComplete('exit');
      }

    } catch (error) {
      console.error('Failed to hide message:', error);
      setDisplayState(prev => ({
        ...prev,
        animating: false,
        animationPhase: 'idle'
      }));
    }
  };

  // Toggle message visibility
  const toggleMessage = () => {
    if (displayState.visible) {
      hideMessage();
    } else {
      showMessage();
    }
  };

  // Handle external visibility changes
  useEffect(() => {
    if (isVisible && !displayState.visible) {
      showMessage();
    } else if (!isVisible && displayState.visible) {
      hideMessage();
    }
  }, [isVisible, displayState.visible]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  // Calculate position styles
  const positionStyles = {
    position: 'absolute',
    left: `${position.x * 100}%`,
    top: `${position.y * 100}%`,
    transform: `translate(-50%, -50%) scale(${scale})`,
    opacity: opacity,
    zIndex: 1000,
    pointerEvents: displayState.visible ? 'auto' : 'none'
  };

  // Merge styles
  const combinedStyles = {
    ...positionStyles,
    ...style
  };

  return (
    <div 
      ref={overlayRef}
      className={`message-overlay ${className} ${animationType} ${displayState.animationPhase}`}
      style={{
        display: 'none',
        ...combinedStyles
      }}
      data-animation={animationType}
      data-phase={displayState.animationPhase}
      onClick={(e) => {
        e.stopPropagation();
        // Allow dismissing message by clicking
        if (displayState.visible && !autoHide) {
          hideMessage();
        }
      }}
    >
      {/* Main message container */}
      <div className="message-content">
        {/* Vampire message text */}
        <div className="vampire-message">
          <p className="message-text">
            {message}
          </p>
          
          {/* Optional subtitle for context */}
          <div className="message-subtitle">
            <span>— Uma mensagem do além —</span>
          </div>
        </div>

        {/* Interactive elements */}
        <div className="message-actions">
          {!autoHide && (
            <button 
              className="close-message"
              onClick={(e) => {
                e.stopPropagation();
                hideMessage();
              }}
              aria-label="Fechar mensagem"
            >
              <span>×</span>
            </button>
          )}
        </div>
      </div>

      {/* Background effects */}
      <div className="message-effects">
        <div className="glow-effect"></div>
        <div className="shadow-effect"></div>
      </div>

      {/* Component styles */}
      <style jsx>{`
        .message-overlay {
          font-family: 'Playfair Display', 'Georgia', serif;
          max-width: 90vw;
          max-height: 80vh;
          user-select: none;
          cursor: pointer;
        }

        .message-content {
          position: relative;
          background: linear-gradient(135deg, 
            rgba(20, 0, 20, 0.95) 0%,
            rgba(40, 0, 20, 0.9) 50%,
            rgba(60, 0, 30, 0.95) 100%);
          border: 2px solid rgba(139, 0, 0, 0.6);
          border-radius: 12px;
          padding: 2rem;
          backdrop-filter: blur(10px);
          box-shadow: 
            0 0 30px rgba(139, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .vampire-message {
          text-align: center;
          color: #f4f4f4;
        }

        .message-text {
          font-size: clamp(1.2rem, 4vw, 2rem);
          line-height: 1.4;
          margin: 0 0 1rem 0;
          text-shadow: 
            0 0 10px rgba(139, 0, 0, 0.5),
            2px 2px 4px rgba(0, 0, 0, 0.8);
          font-weight: 400;
          letter-spacing: 0.5px;
        }

        .message-subtitle {
          font-size: clamp(0.8rem, 2.5vw, 1rem);
          color: rgba(220, 220, 220, 0.8);
          font-style: italic;
          margin-top: 1rem;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.6);
        }

        .message-actions {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
        }

        .close-message {
          background: rgba(139, 0, 0, 0.2);
          border: 1px solid rgba(139, 0, 0, 0.4);
          border-radius: 50%;
          width: 2rem;
          height: 2rem;
          color: rgba(255, 255, 255, 0.8);
          font-size: 1.2rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .close-message:hover {
          background: rgba(139, 0, 0, 0.4);
          color: white;
          transform: scale(1.1);
        }

        .message-effects {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          border-radius: 12px;
          overflow: hidden;
        }

        .glow-effect {
          position: absolute;
          top: -50%;
          left: -50%;
          right: -50%;
          bottom: -50%;
          background: radial-gradient(
            circle at center,
            rgba(139, 0, 0, 0.1) 0%,
            transparent 50%
          );
          animation: pulse-glow 3s ease-in-out infinite;
        }

        .shadow-effect {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            45deg,
            transparent 0%,
            rgba(139, 0, 0, 0.05) 25%,
            transparent 50%,
            rgba(75, 0, 130, 0.05) 75%,
            transparent 100%
          );
          animation: shadow-dance 6s ease-in-out infinite;
        }

        @keyframes pulse-glow {
          0%, 100% { 
            opacity: 0.3;
            transform: scale(1);
          }
          50% { 
            opacity: 0.6;
            transform: scale(1.1);
          }
        }

        @keyframes shadow-dance {
          0%, 100% { 
            transform: rotate(0deg) scale(1);
          }
          33% { 
            transform: rotate(2deg) scale(1.02);
          }
          66% { 
            transform: rotate(-1deg) scale(0.98);
          }
        }

        /* Animation state classes */
        .message-overlay.entering {
          pointer-events: none;
        }

        .message-overlay.exiting {
          pointer-events: none;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .message-content {
            padding: 1.5rem;
            margin: 1rem;
          }
          
          .message-text {
            line-height: 1.3;
          }
        }

        @media (max-width: 480px) {
          .message-content {
            padding: 1rem;
            margin: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default MessageOverlay;