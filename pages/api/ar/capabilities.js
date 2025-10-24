/**
 * AR Device Capabilities Detection API
 * Provides detailed AR capability assessment for client devices
 */

import { NextApiRequest, NextApiResponse } from 'next';

// Browser AR support matrix
const BROWSER_SUPPORT = {
  chrome: {
    mobile: { min_version: 81, webxr: true, webrtc: true, rating: 'excellent' },
    desktop: { min_version: 81, webxr: true, webrtc: true, rating: 'good' }
  },
  safari: {
    mobile: { min_version: 14, webxr: false, webrtc: true, rating: 'good' },
    desktop: { min_version: 14, webxr: false, webrtc: true, rating: 'limited' }
  },
  firefox: {
    mobile: { min_version: 85, webxr: true, webrtc: true, rating: 'fair' },
    desktop: { min_version: 85, webxr: true, webrtc: true, rating: 'fair' }
  },
  edge: {
    mobile: { min_version: 81, webxr: true, webrtc: true, rating: 'good' },
    desktop: { min_version: 81, webxr: true, webrtc: true, rating: 'good' }
  },
  samsung: {
    mobile: { min_version: 13, webxr: false, webrtc: true, rating: 'good' }
  }
};

// Device performance profiles
const DEVICE_CLASSES = {
  high_end: {
    criteria: { ram: 6, cores: 8, gpu_tier: 'high' },
    ar_quality: 'high',
    max_fps: 60,
    effects: true,
    marker_resolution: 'high'
  },
  mid_range: {
    criteria: { ram: 4, cores: 6, gpu_tier: 'medium' },
    ar_quality: 'medium',
    max_fps: 30,
    effects: true,
    marker_resolution: 'medium'
  },
  low_end: {
    criteria: { ram: 2, cores: 4, gpu_tier: 'low' },
    ar_quality: 'low',
    max_fps: 24,
    effects: false,
    marker_resolution: 'low'
  }
};

/**
 * AR Capabilities Detection API Handler
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
        await handleGetCapabilities(req, res);
        break;
      case 'POST':
        await handleTestCapabilities(req, res);
        break;
      default:
        res.status(405).json({ 
          error: 'Method not allowed',
          allowed: ['GET', 'POST', 'OPTIONS']
        });
    }
  } catch (error) {
    console.error('AR Capabilities API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Capability detection failed'
    });
  }
}

/**
 * Handle GET requests for capability information
 */
async function handleGetCapabilities(req, res) {
  const { 
    userAgent,
    screenWidth,
    screenHeight,
    pixelRatio,
    deviceMemory,
    hardwareConcurrency,
    maxTouchPoints,
    format = 'detailed'
  } = req.query;

  try {
    // Parse user agent
    const browserInfo = parseUserAgent(userAgent);
    
    // Assess device capabilities
    const deviceCapabilities = assessDeviceCapabilities({
      screenWidth: parseInt(screenWidth) || 0,
      screenHeight: parseInt(screenHeight) || 0,
      pixelRatio: parseFloat(pixelRatio) || 1,
      deviceMemory: parseInt(deviceMemory) || null,
      hardwareConcurrency: parseInt(hardwareConcurrency) || null,
      maxTouchPoints: parseInt(maxTouchPoints) || 0
    });

    // Check browser AR support
    const arSupport = checkARSupport(browserInfo);
    
    // Generate overall assessment
    const assessment = generateARAssessment(browserInfo, deviceCapabilities, arSupport);

    let response = {};

    if (format === 'simple') {
      response = {
        supported: assessment.overall_rating !== 'unsupported',
        rating: assessment.overall_rating,
        recommendations: assessment.recommendations.slice(0, 3)
      };
    } else {
      response = {
        browser: browserInfo,
        device: deviceCapabilities,
        ar_support: arSupport,
        assessment,
        timestamp: new Date().toISOString()
      };
    }

    // Cache based on capabilities
    const cacheTime = assessment.overall_rating === 'unsupported' ? 3600 : 1800;
    res.setHeader('Cache-Control', `public, max-age=${cacheTime}`);

    res.status(200).json(response);

  } catch (error) {
    console.error('Capability assessment error:', error);
    res.status(500).json({ 
      error: 'Failed to assess capabilities',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Handle POST requests for capability testing
 */
async function handleTestCapabilities(req, res) {
  const { action, capabilities } = req.body;

  try {
    switch (action) {
      case 'test_webrtc':
        const webrtcResult = await testWebRTCCapabilities(capabilities);
        res.status(200).json(webrtcResult);
        break;
        
      case 'test_webgl':
        const webglResult = testWebGLCapabilities(capabilities);
        res.status(200).json(webglResult);
        break;
        
      case 'benchmark_performance':
        const benchmark = performanceBenchmark(capabilities);
        res.status(200).json(benchmark);
        break;
        
      default:
        res.status(400).json({ 
          error: 'Invalid action',
          validActions: ['test_webrtc', 'test_webgl', 'benchmark_performance']
        });
    }
  } catch (error) {
    console.error('Capability testing error:', error);
    res.status(500).json({ 
      error: 'Failed to test capabilities',
      action
    });
  }
}

/**
 * Parse user agent string to extract browser information
 * @param {string} userAgent - User agent string
 * @returns {Object} Browser information
 */
function parseUserAgent(userAgent) {
  if (!userAgent) {
    return { name: 'unknown', version: 0, mobile: false, supported: false };
  }

  const ua = userAgent.toLowerCase();
  let browser = { name: 'unknown', version: 0, mobile: false };

  // Detect mobile
  browser.mobile = /mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(ua);

  // Detect browser
  if (ua.includes('samsungbrowser')) {
    browser.name = 'samsung';
    const match = ua.match(/samsungbrowser\/(\d+)/);
    browser.version = match ? parseInt(match[1]) : 0;
  } else if (ua.includes('chrome') && !ua.includes('edg')) {
    browser.name = 'chrome';
    const match = ua.match(/chrome\/(\d+)/);
    browser.version = match ? parseInt(match[1]) : 0;
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browser.name = 'safari';
    const match = ua.match(/version\/(\d+)/);
    browser.version = match ? parseInt(match[1]) : 0;
  } else if (ua.includes('firefox')) {
    browser.name = 'firefox';
    const match = ua.match(/firefox\/(\d+)/);
    browser.version = match ? parseInt(match[1]) : 0;
  } else if (ua.includes('edg')) {
    browser.name = 'edge';
    const match = ua.match(/edg\/(\d+)/);
    browser.version = match ? parseInt(match[1]) : 0;
  }

  return browser;
}

/**
 * Assess device hardware capabilities
 * @param {Object} deviceInfo - Device information
 * @returns {Object} Device capabilities assessment
 */
function assessDeviceCapabilities(deviceInfo) {
  const {
    screenWidth,
    screenHeight,
    pixelRatio,
    deviceMemory,
    hardwareConcurrency,
    maxTouchPoints
  } = deviceInfo;

  // Calculate device metrics
  const totalPixels = screenWidth * screenHeight * pixelRatio * pixelRatio;
  const estimatedRAM = deviceMemory || estimateRAMFromSpecs(screenWidth, screenHeight);
  const estimatedCores = hardwareConcurrency || estimateCoresFromRAM(estimatedRAM);

  // Classify device performance
  let deviceClass = 'low_end';
  if (estimatedRAM >= 6 && estimatedCores >= 8 && totalPixels <= 2073600) { // <= 1080p
    deviceClass = 'high_end';
  } else if (estimatedRAM >= 4 && estimatedCores >= 6) {
    deviceClass = 'mid_range';
  }

  const deviceProfile = DEVICE_CLASSES[deviceClass];

  return {
    class: deviceClass,
    profile: deviceProfile,
    metrics: {
      screen_resolution: `${screenWidth}x${screenHeight}`,
      pixel_ratio: pixelRatio,
      total_pixels: totalPixels,
      estimated_ram_gb: estimatedRAM,
      estimated_cores: estimatedCores,
      touch_support: maxTouchPoints > 0,
      max_touch_points: maxTouchPoints
    },
    performance_score: calculatePerformanceScore(estimatedRAM, estimatedCores, totalPixels)
  };
}

/**
 * Check AR support for browser
 * @param {Object} browserInfo - Browser information
 * @returns {Object} AR support assessment
 */
function checkARSupport(browserInfo) {
  const { name, version, mobile } = browserInfo;
  const deviceType = mobile ? 'mobile' : 'desktop';
  
  const support = BROWSER_SUPPORT[name]?.[deviceType];
  
  if (!support) {
    return {
      supported: false,
      rating: 'unsupported',
      reason: 'Browser not recognized or not supported',
      features: { webxr: false, webrtc: false, camera: false }
    };
  }

  const versionSupported = version >= support.min_version;
  
  return {
    supported: versionSupported,
    rating: versionSupported ? support.rating : 'outdated',
    reason: versionSupported ? 'Browser version supports AR' : `Browser version too old (minimum: ${support.min_version})`,
    features: {
      webxr: support.webxr && versionSupported,
      webrtc: support.webrtc && versionSupported,
      camera: versionSupported,
      detection_method: support.webxr ? 'WebXR' : 'WebRTC'
    },
    minimum_version: support.min_version,
    current_version: version
  };
}

/**
 * Generate overall AR assessment
 * @param {Object} browserInfo - Browser information
 * @param {Object} deviceCapabilities - Device capabilities
 * @param {Object} arSupport - AR support information
 * @returns {Object} Overall assessment
 */
function generateARAssessment(browserInfo, deviceCapabilities, arSupport) {
  const recommendations = [];
  let overallRating = 'unsupported';

  // Determine overall rating
  if (!arSupport.supported) {
    overallRating = 'unsupported';
    recommendations.push({
      type: 'critical',
      message: 'Browser does not support AR features',
      action: 'Update browser or use Chrome/Safari on mobile'
    });
  } else {
    // Base rating on device performance and browser support
    const deviceScore = deviceCapabilities.performance_score;
    const browserRating = arSupport.rating;

    if (deviceScore >= 80 && ['excellent', 'good'].includes(browserRating)) {
      overallRating = 'excellent';
    } else if (deviceScore >= 60 && ['excellent', 'good', 'fair'].includes(browserRating)) {
      overallRating = 'good';
    } else if (deviceScore >= 40) {
      overallRating = 'fair';
    } else {
      overallRating = 'poor';
    }
  }

  // Add device-specific recommendations
  if (deviceCapabilities.class === 'low_end') {
    recommendations.push({
      type: 'warning',
      message: 'Device may have limited AR performance',
      action: 'Consider using a more powerful device for better experience'
    });
  }

  if (!browserInfo.mobile) {
    recommendations.push({
      type: 'info',
      message: 'AR works best on mobile devices',
      action: 'Try accessing from a smartphone or tablet'
    });
  }

  if (deviceCapabilities.metrics.total_pixels > 2073600) { // > 1080p
    recommendations.push({
      type: 'info',
      message: 'High resolution display may impact performance',
      action: 'AR quality will be automatically adjusted'
    });
  }

  return {
    overall_rating: overallRating,
    ar_score: calculateARScore(deviceCapabilities.performance_score, arSupport.rating),
    recommended_quality: deviceCapabilities.profile.ar_quality,
    recommended_fps: deviceCapabilities.profile.max_fps,
    can_use_effects: deviceCapabilities.profile.effects,
    recommendations,
    summary: generateAssessmentSummary(overallRating, deviceCapabilities.class, browserInfo.name)
  };
}

/**
 * Estimate RAM from screen specifications
 * @param {number} width - Screen width
 * @param {number} height - Screen height
 * @returns {number} Estimated RAM in GB
 */
function estimateRAMFromSpecs(width, height) {
  const totalPixels = width * height;
  if (totalPixels < 921600) return 2;      // < 720p
  if (totalPixels < 2073600) return 4;     // < 1080p
  if (totalPixels < 8294400) return 6;     // < 4K
  return 8;                                // >= 4K
}

/**
 * Estimate CPU cores from RAM
 * @param {number} ram - RAM in GB
 * @returns {number} Estimated cores
 */
function estimateCoresFromRAM(ram) {
  if (ram <= 2) return 4;
  if (ram <= 4) return 6;
  if (ram <= 6) return 8;
  return 12;
}

/**
 * Calculate device performance score
 * @param {number} ram - RAM in GB
 * @param {number} cores - CPU cores
 * @param {number} pixels - Total pixels
 * @returns {number} Performance score (0-100)
 */
function calculatePerformanceScore(ram, cores, pixels) {
  const ramScore = Math.min((ram / 8) * 40, 40);          // Max 40 points
  const coreScore = Math.min((cores / 12) * 30, 30);     // Max 30 points
  const pixelScore = Math.max(30 - (pixels / 2073600) * 10, 10); // Fewer pixels = better performance

  return Math.round(ramScore + coreScore + pixelScore);
}

/**
 * Calculate AR capability score
 * @param {number} performanceScore - Device performance score
 * @param {string} browserRating - Browser support rating
 * @returns {number} AR score (0-100)
 */
function calculateARScore(performanceScore, browserRating) {
  const browserMultiplier = {
    'excellent': 1.0,
    'good': 0.9,
    'fair': 0.7,
    'limited': 0.5,
    'poor': 0.3,
    'unsupported': 0
  };

  return Math.round(performanceScore * (browserMultiplier[browserRating] || 0));
}

/**
 * Generate assessment summary text
 * @param {string} rating - Overall rating
 * @param {string} deviceClass - Device class
 * @param {string} browserName - Browser name
 * @returns {string} Summary text
 */
function generateAssessmentSummary(rating, deviceClass, browserName) {
  const deviceText = deviceClass.replace('_', '-');
  const browserText = browserName.charAt(0).toUpperCase() + browserName.slice(1);
  
  switch (rating) {
    case 'excellent':
      return `Your ${deviceText} device with ${browserText} provides excellent AR support.`;
    case 'good':
      return `Your ${deviceText} device with ${browserText} provides good AR support.`;
    case 'fair':
      return `Your ${deviceText} device with ${browserText} provides fair AR support.`;
    case 'poor':
      return `Your ${deviceText} device has limited AR capabilities.`;
    default:
      return `Your device/browser combination does not support AR features.`;
  }
}

/**
 * Test WebRTC capabilities (placeholder for future implementation)
 */
async function testWebRTCCapabilities(capabilities) {
  return {
    getUserMedia: true,
    mediaDevices: true,
    constraints: ['video', 'audio'],
    tested: new Date().toISOString()
  };
}

/**
 * Test WebGL capabilities
 */
function testWebGLCapabilities(capabilities) {
  return {
    webgl: capabilities.webgl || false,
    webgl2: capabilities.webgl2 || false,
    extensions: capabilities.extensions || [],
    tested: new Date().toISOString()
  };
}

/**
 * Performance benchmark (placeholder for future implementation)
 */
function performanceBenchmark(capabilities) {
  return {
    score: Math.floor(Math.random() * 100),
    fps_estimate: 30,
    memory_usage: 'normal',
    tested: new Date().toISOString()
  };
}