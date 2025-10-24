/**
 * QR Code Generation Service
 * High-level service for QR code operations and management
 */

import QRCode from '../models/QRCode.js';
import { handleQRError } from '../errorHandler.js';

/**
 * QR Code Service Class
 * Provides high-level QR code operations
 */
export class QRService {
  constructor() {
    this.cache = new Map();
    this.cacheMaxSize = 100;
    this.cacheTimeout = 60 * 60 * 1000; // 1 hour
    this.apiBaseUrl = '/api/qr-code';
  }

  /**
   * Generate QR code for URL
   * @param {string} url - URL to encode
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} QR code result
   */
  async generateForUrl(url, options = {}) {
    try {
      // Create QR code entity
      const qrCode = QRCode.forUrl(url, options);
      
      // Validate
      const validation = qrCode.validate();
      if (!validation.valid) {
        throw new Error(`Invalid QR code: ${validation.errors.join(', ')}`);
      }

      // Check cache
      const cacheKey = this.getCacheKey(qrCode);
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // Generate QR code
      const result = await this.generateQRCode(qrCode);
      
      // Cache result
      this.addToCache(cacheKey, result);
      
      return result;
    } catch (error) {
      handleQRError(error, { url, options });
      throw error;
    }
  }

  /**
   * Generate QR code for text
   * @param {string} text - Text to encode
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} QR code result
   */
  async generateForText(text, options = {}) {
    try {
      // Create QR code entity
      const qrCode = QRCode.forText(text, options);
      
      // Validate
      const validation = qrCode.validate();
      if (!validation.valid) {
        throw new Error(`Invalid QR code: ${validation.errors.join(', ')}`);
      }

      // Check cache
      const cacheKey = this.getCacheKey(qrCode);
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // Generate QR code
      const result = await this.generateQRCode(qrCode);
      
      // Cache result
      this.addToCache(cacheKey, result);
      
      return result;
    } catch (error) {
      handleQRError(error, { text, options });
      throw error;
    }
  }

  /**
   * Generate AR-optimized QR code
   * @param {string} content - Content to encode
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} QR code result
   */
  async generateForAR(content, options = {}) {
    try {
      // Create AR-optimized QR code entity
      const qrCode = QRCode.forAR(content, options);
      
      // Validate
      const validation = qrCode.validate();
      if (!validation.valid) {
        throw new Error(`Invalid AR QR code: ${validation.errors.join(', ')}`);
      }

      // Check cache
      const cacheKey = this.getCacheKey(qrCode);
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // Generate QR code
      const result = await this.generateQRCode(qrCode);
      
      // Add AR-specific metadata
      result.arOptimized = true;
      result.arMetadata = {
        markerSize: qrCode.size,
        errorCorrection: qrCode.errorCorrectionLevel,
        margin: qrCode.margin,
        contrast: 'high'
      };
      
      // Cache result
      this.addToCache(cacheKey, result);
      
      return result;
    } catch (error) {
      handleQRError(error, { content, options, context: 'ar_generation' });
      throw error;
    }
  }

  /**
   * Generate QR code using API
   * @param {QRCode} qrCode - QR code entity
   * @returns {Promise<Object>} Generation result
   */
  async generateQRCode(qrCode) {
    const startTime = Date.now();
    
    try {
      // Build API URL
      const url = new URL(this.apiBaseUrl, this.getBaseUrl());
      
      // Add parameters
      const content = qrCode.getContent();
      url.searchParams.set('data', content);
      url.searchParams.set('size', qrCode.size.toString());
      url.searchParams.set('format', qrCode.format);
      url.searchParams.set('errorLevel', qrCode.errorCorrectionLevel);
      
      if (qrCode.margin !== 2) {
        url.searchParams.set('margin', qrCode.margin.toString());
      }

      // Make API request
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API request failed (${response.status})`);
      }

      // Get generation info from headers
      const generationTime = parseInt(response.headers.get('X-QR-Generation-Time') || '0', 10);
      const dataLength = parseInt(response.headers.get('X-QR-Data-Length') || '0', 10);
      
      const result = {
        qrCode,
        url: url.toString(),
        imageUrl: url.toString(),
        content,
        size: qrCode.size,
        format: qrCode.format,
        generationTime: generationTime || (Date.now() - startTime),
        dataLength,
        complexity: qrCode.estimateComplexity(),
        createdAt: new Date().toISOString()
      };

      return result;
    } catch (error) {
      const generationTime = Date.now() - startTime;
      handleQRError(error, { 
        qrCodeId: qrCode.id,
        content: qrCode.getContent(),
        generationTime,
        context: 'api_generation'
      });
      throw error;
    }
  }

  /**
   * Get QR code information without generating
   * @param {string} content - Content to analyze
   * @param {Object} options - Analysis options
   * @returns {Object} QR code information
   */
  getQRInfo(content, options = {}) {
    try {
      // Create temporary QR code entity
      const qrCode = content.startsWith('http') 
        ? QRCode.forUrl(content, options)
        : QRCode.forText(content, options);
      
      // Validate
      const validation = qrCode.validate();
      
      // Get complexity analysis
      const complexity = qrCode.estimateComplexity();
      
      return {
        valid: validation.valid,
        errors: validation.errors,
        warnings: validation.warnings,
        complexity,
        config: qrCode.getGenerationConfig(),
        recommendations: this.getRecommendations(qrCode, complexity)
      };
    } catch (error) {
      return {
        valid: false,
        errors: [error.message],
        warnings: [],
        complexity: null
      };
    }
  }

  /**
   * Get recommendations for QR code optimization
   * @param {QRCode} qrCode - QR code entity
   * @param {Object} complexity - Complexity analysis
   * @returns {Array} Recommendations
   */
  getRecommendations(qrCode, complexity) {
    const recommendations = [];
    
    // Size recommendations
    if (complexity.version > 10 && qrCode.size < 512) {
      recommendations.push({
        type: 'warning',
        category: 'size',
        message: 'Consider increasing size for better readability',
        suggestion: `Increase size to at least 512px for complex QR codes`
      });
    }
    
    // Error correction recommendations
    if (complexity.version > 15 && qrCode.errorCorrectionLevel === 'H') {
      recommendations.push({
        type: 'info',
        category: 'error_correction',
        message: 'High error correction may not be necessary for simple scanning',
        suggestion: 'Consider using M or Q level for faster generation'
      });
    }
    
    // Data length recommendations
    if (complexity.dataLength > 1000) {
      recommendations.push({
        type: 'warning',
        category: 'data_length',
        message: 'Large data may result in complex QR code',
        suggestion: 'Consider shortening URL or using a URL shortener'
      });
    }
    
    // AR-specific recommendations
    if (qrCode.type === 'ar' || qrCode.metadata.arOptimized) {
      if (qrCode.size < 256) {
        recommendations.push({
          type: 'warning',
          category: 'ar_size',
          message: 'Small size may affect AR detection accuracy',
          suggestion: 'Use at least 256px for AR applications'
        });
      }
      
      if (qrCode.errorCorrectionLevel !== 'H') {
        recommendations.push({
          type: 'info',
          category: 'ar_error_correction',
          message: 'High error correction recommended for AR',
          suggestion: 'Use H level for better AR marker detection'
        });
      }
    }
    
    return recommendations;
  }

  /**
   * Validate QR code content before generation
   * @param {string} content - Content to validate
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  validateContent(content, options = {}) {
    try {
      const qrCode = content.startsWith('http') 
        ? QRCode.forUrl(content, options)
        : QRCode.forText(content, options);
      
      return qrCode.validate();
    } catch (error) {
      return {
        valid: false,
        errors: [error.message],
        warnings: []
      };
    }
  }

  /**
   * Generate cache key for QR code
   * @param {QRCode} qrCode - QR code entity
   * @returns {string} Cache key
   */
  getCacheKey(qrCode) {
    const config = qrCode.getGenerationConfig();
    const content = qrCode.getContent();
    
    // Create hash of content and config
    const data = JSON.stringify({ content, config });
    return this.simpleHash(data);
  }

  /**
   * Simple hash function for cache keys
   * @param {string} str - String to hash
   * @returns {string} Hash
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get item from cache
   * @param {string} key - Cache key
   * @returns {Object|null} Cached item or null
   */
  getFromCache(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    // Check expiration
    if (Date.now() - item.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  /**
   * Add item to cache
   * @param {string} key - Cache key
   * @param {Object} data - Data to cache
   */
  addToCache(key, data) {
    // Clean cache if too large
    if (this.cache.size >= this.cacheMaxSize) {
      this.cleanCache();
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Clean expired items from cache
   */
  cleanCache() {
    const now = Date.now();
    const expiredKeys = [];
    
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.cacheTimeout) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => this.cache.delete(key));
    
    // If still too large, remove oldest items
    if (this.cache.size >= this.cacheMaxSize) {
      const items = Array.from(this.cache.entries())
        .sort(([,a], [,b]) => a.timestamp - b.timestamp);
      
      const toRemove = items.slice(0, Math.floor(this.cacheMaxSize * 0.2));
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  /**
   * Get base URL for API requests
   * @returns {string} Base URL
   */
  getBaseUrl() {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    const now = Date.now();
    let expired = 0;
    
    for (const item of this.cache.values()) {
      if (now - item.timestamp > this.cacheTimeout) {
        expired++;
      }
    }
    
    return {
      size: this.cache.size,
      maxSize: this.cacheMaxSize,
      expired,
      active: this.cache.size - expired,
      timeout: this.cacheTimeout
    };
  }
}

// Create singleton instance
const qrService = new QRService();

/**
 * Convenience functions
 */

/**
 * Generate QR code for current page URL
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} QR code result
 */
export async function generateCurrentPageQR(options = {}) {
  if (typeof window === 'undefined') {
    throw new Error('Cannot generate current page QR on server side');
  }
  
  return await qrService.generateForUrl(window.location.href, options);
}

/**
 * Generate AR-optimized QR code for current page
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} QR code result
 */
export async function generateCurrentPageARQR(options = {}) {
  if (typeof window === 'undefined') {
    throw new Error('Cannot generate current page QR on server side');
  }
  
  return await qrService.generateForAR(window.location.href, options);
}

/**
 * Quick QR code generation
 * @param {string} content - Content to encode
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} QR code result
 */
export async function quickGenerate(content, options = {}) {
  if (content.startsWith('http')) {
    return await qrService.generateForUrl(content, options);
  } else {
    return await qrService.generateForText(content, options);
  }
}

// Export singleton and QRService class
export { qrService as default, QRService };