/**
 * AR Message Configuration API
 * Provides configuration and content for AR message display
 */

import { NextApiRequest, NextApiResponse } from 'next';

// AR Message Configuration
const AR_MESSAGES = {
  vampire: {
    id: 'vampire_secret',
    text: process.env.NEXT_PUBLIC_AR_MESSAGE || 'O vampiro se esconde no reflexo, mas Rupert percebeu a verdade… Siga-o para a próxima pista antes que ele desapareça também.',
    language: 'pt',
    type: 'story',
    theme: 'vampire',
    displayDuration: 10000, // 10 seconds
    fadeInDuration: 1000,
    fadeOutDuration: 1000,
    style: {
      fontSize: 'large',
      color: '#8b0000', // Dark red for vampire theme
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      border: '2px solid #8b0000',
      borderRadius: '12px',
      padding: '1.5rem',
      textAlign: 'center',
      fontWeight: '600',
      textShadow: '0 0 10px rgba(139, 0, 0, 0.5)',
      boxShadow: '0 0 20px rgba(139, 0, 0, 0.3), inset 0 0 20px rgba(139, 0, 0, 0.1)',
      maxWidth: '90%',
      wordWrap: 'break-word'
    },
    animation: {
      entrance: 'vampireGlow',
      duration: '2s',
      timing: 'ease-in-out',
      iteration: 'infinite',
      direction: 'alternate'
    },
    audio: {
      enabled: false, // For future enhancement
      soundFile: null,
      volume: 0.7
    },
    metadata: {
      created: '2025-10-24',
      author: 'Halloween AR Experience',
      category: 'vampire_hunt',
      difficulty: 'beginner',
      location_hint: 'reflection'
    }
  },
  
  fallback: {
    id: 'fallback_message',
    text: 'A mysterious message appears...',
    language: 'en',
    type: 'fallback',
    theme: 'halloween',
    displayDuration: 5000,
    fadeInDuration: 500,
    fadeOutDuration: 500,
    style: {
      fontSize: 'medium',
      color: '#ff6b35',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      border: '2px solid #ff6b35',
      borderRadius: '8px',
      padding: '1rem',
      textAlign: 'center'
    }
  }
};

// AR Scene Configuration
const AR_SCENE_CONFIG = {
  marker: {
    type: 'qr',
    size: 1.0, // Marker size in AR world units
    smooth: true,
    smoothCount: 5,
    smoothTolerance: 0.01,
    smoothThreshold: 2
  },
  
  camera: {
    near: 0.1,
    far: 1000,
    fov: 60,
    aspectRatio: 'auto'
  },
  
  renderer: {
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
    powerPreference: 'high-performance'
  },
  
  detection: {
    sensitivity: 0.8,
    threshold: 0.6,
    maxDetectionDistance: 10,
    minDetectionTime: 100 // ms
  },
  
  performance: {
    maxFPS: 30,
    adaptiveQuality: true,
    lowPowerMode: false
  }
};

// Supported device configurations
const DEVICE_PROFILES = {
  desktop: {
    messageScale: 1.0,
    quality: 'high',
    maxFPS: 60,
    enableEffects: true
  },
  
  mobile_high: {
    messageScale: 0.8,
    quality: 'medium',
    maxFPS: 30,
    enableEffects: true
  },
  
  mobile_low: {
    messageScale: 0.7,
    quality: 'low',
    maxFPS: 24,
    enableEffects: false
  },
  
  tablet: {
    messageScale: 0.9,
    quality: 'medium',
    maxFPS: 30,
    enableEffects: true
  }
};

/**
 * AR Message Configuration API Handler
 * @param {NextApiRequest} req - API request
 * @param {NextApiResponse} res - API response
 */
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    switch (req.method) {
      case 'GET':
        await handleGetConfiguration(req, res);
        break;
      case 'POST':
        await handleUpdateConfiguration(req, res);
        break;
      default:
        res.status(405).json({ 
          error: 'Method not allowed',
          allowed: ['GET', 'POST', 'OPTIONS']
        });
    }
  } catch (error) {
    console.error('AR Message API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Configuration request failed'
    });
  }
}

/**
 * Handle GET requests for AR configuration
 */
async function handleGetConfiguration(req, res) {
  const { 
    messageType = 'vampire',
    deviceType = 'mobile_high',
    format = 'full',
    includeScene = 'true'
  } = req.query;

  try {
    // Get base message configuration
    const message = AR_MESSAGES[messageType] || AR_MESSAGES.vampire;
    
    // Get device profile
    const deviceProfile = DEVICE_PROFILES[deviceType] || DEVICE_PROFILES.mobile_high;
    
    // Prepare response based on format
    let response = {};
    
    if (format === 'message') {
      // Only message data
      response = {
        message: {
          ...message,
          style: {
            ...message.style,
            fontSize: adjustFontSize(message.style.fontSize, deviceProfile.messageScale)
          }
        },
        deviceProfile
      };
    } else if (format === 'scene') {
      // Only scene configuration
      response = {
        scene: {
          ...AR_SCENE_CONFIG,
          performance: {
            ...AR_SCENE_CONFIG.performance,
            maxFPS: deviceProfile.maxFPS,
            adaptiveQuality: deviceProfile.quality !== 'high'
          }
        },
        deviceProfile
      };
    } else {
      // Full configuration
      response = {
        message: {
          ...message,
          style: {
            ...message.style,
            fontSize: adjustFontSize(message.style.fontSize, deviceProfile.messageScale)
          }
        },
        scene: includeScene === 'true' ? {
          ...AR_SCENE_CONFIG,
          performance: {
            ...AR_SCENE_CONFIG.performance,
            maxFPS: deviceProfile.maxFPS,
            adaptiveQuality: deviceProfile.quality !== 'high'
          }
        } : null,
        deviceProfile,
        metadata: {
          version: '1.0.0',
          generated: new Date().toISOString(),
          deviceType,
          messageType
        }
      };
    }

    // Add caching headers
    res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
    res.setHeader('ETag', generateConfigETag(messageType, deviceType, format));

    res.status(200).json(response);

  } catch (error) {
    console.error('Configuration retrieval error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve configuration',
      messageType,
      deviceType
    });
  }
}

/**
 * Handle POST requests for configuration updates
 */
async function handleUpdateConfiguration(req, res) {
  const { action, data } = req.body;

  try {
    switch (action) {
      case 'validate_message':
        const validation = validateMessageConfig(data);
        res.status(200).json({ valid: validation.valid, errors: validation.errors });
        break;
        
      case 'test_device_profile':
        const profile = testDeviceProfile(data);
        res.status(200).json({ profile, supported: profile.supported });
        break;
        
      default:
        res.status(400).json({ 
          error: 'Invalid action',
          validActions: ['validate_message', 'test_device_profile']
        });
    }
  } catch (error) {
    console.error('Configuration update error:', error);
    res.status(500).json({ 
      error: 'Failed to update configuration',
      action
    });
  }
}

/**
 * Adjust font size based on device scale
 * @param {string} fontSize - Original font size
 * @param {number} scale - Scale factor
 * @returns {string} Adjusted font size
 */
function adjustFontSize(fontSize, scale) {
  const sizeMap = {
    'small': scale < 0.8 ? 'x-small' : 'small',
    'medium': scale < 0.8 ? 'small' : 'medium',
    'large': scale < 0.8 ? 'medium' : 'large',
    'x-large': scale < 0.8 ? 'large' : 'x-large'
  };
  
  return sizeMap[fontSize] || fontSize;
}

/**
 * Validate message configuration
 * @param {Object} config - Message configuration to validate
 * @returns {Object} Validation result
 */
function validateMessageConfig(config) {
  const errors = [];
  
  if (!config.text || config.text.length === 0) {
    errors.push('Message text is required');
  }
  
  if (config.text && config.text.length > 500) {
    errors.push('Message text too long (max 500 characters)');
  }
  
  if (config.displayDuration && (config.displayDuration < 1000 || config.displayDuration > 30000)) {
    errors.push('Display duration must be between 1-30 seconds');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Test device profile compatibility
 * @param {Object} deviceInfo - Device information
 * @returns {Object} Profile recommendation
 */
function testDeviceProfile(deviceInfo) {
  const { userAgent, screenWidth, pixelRatio, deviceMemory } = deviceInfo;
  
  let recommendedProfile = 'mobile_high';
  let supported = true;
  
  // Simple device classification
  if (userAgent && userAgent.includes('Mobile')) {
    if (screenWidth < 768 || (deviceMemory && deviceMemory < 4)) {
      recommendedProfile = 'mobile_low';
    }
  } else if (userAgent && userAgent.includes('Tablet')) {
    recommendedProfile = 'tablet';
  } else {
    recommendedProfile = 'desktop';
  }
  
  // Check WebAR support indicators
  if (!userAgent || (!userAgent.includes('Chrome') && !userAgent.includes('Safari'))) {
    supported = false;
  }
  
  return {
    recommended: recommendedProfile,
    supported,
    profile: DEVICE_PROFILES[recommendedProfile],
    reason: supported ? 'Compatible browser detected' : 'Limited WebAR support'
  };
}

/**
 * Generate ETag for configuration caching
 * @param {string} messageType - Message type
 * @param {string} deviceType - Device type  
 * @param {string} format - Response format
 * @returns {string} ETag
 */
function generateConfigETag(messageType, deviceType, format) {
  const hash = require('crypto')
    .createHash('md5')
    .update(`${messageType}-${deviceType}-${format}-v1.0.0`)
    .digest('hex');
  return `"${hash}"`;
}

/**
 * Get available message types
 * @returns {Object} Available message configurations
 */
export function getAvailableMessages() {
  return Object.keys(AR_MESSAGES).map(key => ({
    id: key,
    name: AR_MESSAGES[key].text.substring(0, 50) + '...',
    language: AR_MESSAGES[key].language,
    theme: AR_MESSAGES[key].theme,
    type: AR_MESSAGES[key].type
  }));
}

/**
 * Get device profiles
 * @returns {Object} Available device profiles
 */
export function getDeviceProfiles() {
  return DEVICE_PROFILES;
}