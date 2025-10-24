/**
 * QR Code Generation API Endpoint
 * Generates QR codes that link to the AR experience and serve as AR markers
 */

import QRCode from 'qrcode';
import { NextApiRequest, NextApiResponse } from 'next';

// QR Code configuration for AR optimization
const QR_CONFIG = {
  // High error correction for better AR marker recognition
  errorCorrectionLevel: 'H',
  type: 'image/png',
  quality: 0.92,
  margin: 2,
  color: {
    dark: '#000000',  // Black modules for better contrast
    light: '#FFFFFF'  // White background
  },
  width: 512,  // Optimal size for AR scanning and web display
  scale: 8     // High resolution for crisp rendering
};

// Validation patterns
const URL_PATTERN = /^https?:\/\/.+/i;
const MAX_URL_LENGTH = 2048;

/**
 * QR Code Generation API Handler
 * @param {NextApiRequest} req - API request
 * @param {NextApiResponse} res - API response
 */
export default async function handler(req, res) {
  // Set CORS headers for cross-origin requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    let qrData = '';
    let customConfig = {};

    // Handle different HTTP methods
    if (req.method === 'GET') {
      // Extract data from query parameters
      qrData = req.query.data || req.query.url || '';
      
      // Parse custom configuration from query
      if (req.query.size) {
        customConfig.width = parseInt(req.query.size, 10);
      }
      if (req.query.format) {
        customConfig.type = req.query.format === 'svg' ? 'svg' : 'image/png';
      }
      if (req.query.errorLevel) {
        customConfig.errorCorrectionLevel = req.query.errorLevel.toUpperCase();
      }
      
    } else if (req.method === 'POST') {
      // Extract data from request body
      const body = req.body;
      qrData = body.data || body.url || '';
      customConfig = body.config || {};
      
    } else {
      res.status(405).json({ 
        error: 'Method not allowed',
        allowed: ['GET', 'POST', 'OPTIONS']
      });
      return;
    }

    // Validate input data
    if (!qrData) {
      res.status(400).json({ 
        error: 'Missing required parameter: data or url',
        example: '/api/qr-code?data=https://yoursite.com'
      });
      return;
    }

    // Validate URL format if it looks like a URL
    if (qrData.startsWith('http') && !URL_PATTERN.test(qrData)) {
      res.status(400).json({ 
        error: 'Invalid URL format',
        provided: qrData
      });
      return;
    }

    // Check data length
    if (qrData.length > MAX_URL_LENGTH) {
      res.status(400).json({ 
        error: 'Data too long',
        maxLength: MAX_URL_LENGTH,
        provided: qrData.length
      });
      return;
    }

    // Merge configuration
    const config = { ...QR_CONFIG, ...customConfig };

    // Validate configuration values
    if (config.width && (config.width < 64 || config.width > 2048)) {
      res.status(400).json({ 
        error: 'Invalid size',
        range: '64-2048 pixels',
        provided: config.width
      });
      return;
    }

    if (config.errorCorrectionLevel && !['L', 'M', 'Q', 'H'].includes(config.errorCorrectionLevel)) {
      res.status(400).json({ 
        error: 'Invalid error correction level',
        allowed: ['L', 'M', 'Q', 'H'],
        provided: config.errorCorrectionLevel
      });
      return;
    }

    // Generate QR code
    let qrCode;
    const startTime = Date.now();

    if (config.type === 'svg') {
      // Generate SVG format
      qrCode = await QRCode.toString(qrData, {
        ...config,
        type: 'svg'
      });
      
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Content-Disposition', `inline; filename="qr-code.svg"`);
      
    } else {
      // Generate PNG format (default)
      qrCode = await QRCode.toBuffer(qrData, config);
      
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `inline; filename="qr-code.png"`);
    }

    const generationTime = Date.now() - startTime;

    // Add caching headers for better performance
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.setHeader('ETag', generateETag(qrData, config));

    // Add custom headers with generation info
    res.setHeader('X-QR-Data-Length', qrData.length.toString());
    res.setHeader('X-QR-Generation-Time', generationTime.toString());
    res.setHeader('X-QR-Error-Level', config.errorCorrectionLevel);

    // Send the QR code
    res.status(200).send(qrCode);

    // Log generation (for development/debugging)
    if (process.env.NODE_ENV === 'development') {
      console.log(`QR Code generated: ${qrData.substring(0, 50)}${qrData.length > 50 ? '...' : ''} (${generationTime}ms)`);
    }

  } catch (error) {
    console.error('QR Code generation error:', error);
    
    // Handle specific QR code errors
    if (error.message.includes('Input too long')) {
      res.status(400).json({ 
        error: 'Data too long for QR code',
        message: 'Reduce the amount of data or use a lower error correction level'
      });
    } else if (error.message.includes('Invalid')) {
      res.status(400).json({ 
        error: 'Invalid QR code data',
        message: error.message
      });
    } else {
      res.status(500).json({ 
        error: 'QR code generation failed',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

/**
 * Generate ETag for caching
 * @param {string} data - QR code data
 * @param {Object} config - QR code configuration
 * @returns {string} ETag string
 */
function generateETag(data, config) {
  const hash = require('crypto')
    .createHash('md5')
    .update(data + JSON.stringify(config))
    .digest('hex');
  return `"${hash}"`;
}

/**
 * Get QR code info without generating the image
 * Helper function for QR code analysis
 * @param {string} data - Data to analyze
 * @returns {Object} QR code information
 */
export function getQRCodeInfo(data) {
  try {
    // Estimate QR code version and capacity
    const dataLength = data.length;
    
    // Rough estimation of QR code version based on data length
    let version = 1;
    let capacity = 25; // Version 1 capacity for alphanumeric with high error correction
    
    while (dataLength > capacity && version < 40) {
      version++;
      // Simplified capacity calculation - actual capacity varies by data type
      capacity = Math.floor(version * version * 0.6);
    }

    return {
      dataLength,
      estimatedVersion: Math.min(version, 40),
      recommendedErrorLevel: dataLength > 100 ? 'M' : 'H',
      recommendedSize: dataLength > 200 ? 768 : 512,
      canGenerate: version <= 40
    };
  } catch (error) {
    return {
      error: error.message,
      canGenerate: false
    };
  }
}