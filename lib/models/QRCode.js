/**
 * QR Code Entity Model
 * Represents QR code data and provides methods for QR code operations
 */

/**
 * QR Code Entity Class
 * Manages QR code data, generation parameters, and validation
 */
export class QRCode {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.data = data.data || '';
    this.url = data.url || '';
    this.type = data.type || 'url';
    this.size = data.size || 256;
    this.errorCorrectionLevel = data.errorCorrectionLevel || 'H';
    this.margin = data.margin || 2;
    this.format = data.format || 'png';
    this.color = data.color || { dark: '#000000', light: '#FFFFFF' };
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.metadata = data.metadata || {};
    this.usage = data.usage || {
      scanCount: 0,
      lastScanned: null,
      arActivations: 0,
      uniqueUsers: new Set()
    };
  }

  /**
   * Generate unique QR code ID
   * @returns {string} Unique identifier
   */
  generateId() {
    return `qr_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  /**
   * Validate QR code data
   * @returns {Object} Validation result
   */
  validate() {
    const errors = [];
    const warnings = [];

    // Check data/URL
    if (!this.data && !this.url) {
      errors.push('Either data or url must be provided');
    }

    if (this.url && !this.isValidUrl(this.url)) {
      errors.push('Invalid URL format');
    }

    // Check data length
    const contentLength = (this.data || this.url || '').length;
    if (contentLength > 2048) {
      errors.push('Data/URL too long (max 2048 characters)');
    } else if (contentLength > 1000) {
      warnings.push('Large data/URL may result in complex QR code');
    }

    // Check size
    if (this.size < 64 || this.size > 2048) {
      errors.push('Size must be between 64 and 2048 pixels');
    }

    // Check error correction level
    if (!['L', 'M', 'Q', 'H'].includes(this.errorCorrectionLevel)) {
      errors.push('Error correction level must be L, M, Q, or H');
    }

    // Check format
    if (!['png', 'svg', 'jpg', 'webp'].includes(this.format)) {
      errors.push('Format must be png, svg, jpg, or webp');
    }

    // Check colors
    if (this.color.dark && !this.isValidColor(this.color.dark)) {
      errors.push('Invalid dark color format');
    }
    if (this.color.light && !this.isValidColor(this.color.light)) {
      errors.push('Invalid light color format');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Check if URL is valid
   * @param {string} url - URL to validate
   * @returns {boolean} True if valid
   */
  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if color is valid hex format
   * @param {string} color - Color to validate
   * @returns {boolean} True if valid
   */
  isValidColor(color) {
    return /^#[0-9A-F]{6}$/i.test(color);
  }

  /**
   * Get content for QR code generation
   * @returns {string} Content to encode
   */
  getContent() {
    return this.data || this.url || '';
  }

  /**
   * Get QR code generation configuration
   * @returns {Object} Configuration for QR generation
   */
  getGenerationConfig() {
    return {
      errorCorrectionLevel: this.errorCorrectionLevel,
      type: this.format === 'svg' ? 'svg' : `image/${this.format}`,
      quality: 0.92,
      margin: this.margin,
      color: this.color,
      width: this.size,
      scale: Math.max(1, Math.floor(this.size / 64))
    };
  }

  /**
   * Estimate QR code complexity
   * @returns {Object} Complexity information
   */
  estimateComplexity() {
    const content = this.getContent();
    const contentLength = content.length;
    
    // Estimate QR version (simplified)
    let version = 1;
    let maxCapacity = this.getVersionCapacity(version, this.errorCorrectionLevel);
    
    while (contentLength > maxCapacity && version < 40) {
      version++;
      maxCapacity = this.getVersionCapacity(version, this.errorCorrectionLevel);
    }

    const moduleCount = 17 + 4 * version;
    const totalModules = moduleCount * moduleCount;

    return {
      version: Math.min(version, 40),
      moduleCount,
      totalModules,
      dataLength: contentLength,
      capacity: maxCapacity,
      utilizationPercent: Math.round((contentLength / maxCapacity) * 100),
      canGenerate: version <= 40,
      complexity: version <= 10 ? 'simple' : version <= 25 ? 'medium' : 'complex'
    };
  }

  /**
   * Get approximate capacity for QR version and error level
   * @param {number} version - QR version
   * @param {string} errorLevel - Error correction level
   * @returns {number} Approximate capacity
   */
  getVersionCapacity(version, errorLevel) {
    // Simplified capacity calculation for alphanumeric mode
    const baseCapacity = version * version * 0.6;
    const errorReduction = {
      'L': 0.9, // ~7% error correction
      'M': 0.8, // ~15% error correction
      'Q': 0.7, // ~25% error correction
      'H': 0.6  // ~30% error correction
    };
    
    return Math.floor(baseCapacity * (errorReduction[errorLevel] || 0.6));
  }

  /**
   * Record scan event
   * @param {Object} scanData - Information about the scan
   */
  recordScan(scanData = {}) {
    this.usage.scanCount++;
    this.usage.lastScanned = new Date().toISOString();
    
    if (scanData.userId) {
      this.usage.uniqueUsers.add(scanData.userId);
    }
    
    if (scanData.arActivated) {
      this.usage.arActivations++;
    }
    
    this.updatedAt = new Date().toISOString();
    
    // Add to metadata
    if (!this.metadata.scans) {
      this.metadata.scans = [];
    }
    
    this.metadata.scans.push({
      timestamp: new Date().toISOString(),
      ...scanData
    });
    
    // Keep only last 100 scans
    if (this.metadata.scans.length > 100) {
      this.metadata.scans = this.metadata.scans.slice(-100);
    }
  }

  /**
   * Get usage statistics
   * @returns {Object} Usage statistics
   */
  getUsageStats() {
    const now = new Date();
    const created = new Date(this.createdAt);
    const age = now - created;
    
    const stats = {
      totalScans: this.usage.scanCount,
      uniqueUsers: this.usage.uniqueUsers.size,
      arActivations: this.usage.arActivations,
      lastScanned: this.usage.lastScanned,
      ageInDays: Math.floor(age / (1000 * 60 * 60 * 24)),
      averageScansPerDay: age > 0 ? (this.usage.scanCount / (age / (1000 * 60 * 60 * 24))) : 0
    };
    
    // Calculate scan to AR conversion rate
    stats.arConversionRate = this.usage.scanCount > 0 ? 
      (this.usage.arActivations / this.usage.scanCount) * 100 : 0;
    
    return stats;
  }

  /**
   * Update QR code data
   * @param {Object} updates - Updates to apply
   * @returns {QRCode} Updated QR code instance
   */
  update(updates) {
    const allowedUpdates = [
      'data', 'url', 'size', 'errorCorrectionLevel', 
      'margin', 'format', 'color', 'metadata'
    ];
    
    allowedUpdates.forEach(key => {
      if (updates.hasOwnProperty(key)) {
        this[key] = updates[key];
      }
    });
    
    this.updatedAt = new Date().toISOString();
    return this;
  }

  /**
   * Clone QR code with new ID
   * @returns {QRCode} Cloned QR code
   */
  clone() {
    const data = this.toJSON();
    delete data.id;
    delete data.usage;
    return new QRCode(data);
  }

  /**
   * Convert to JSON representation
   * @returns {Object} JSON representation
   */
  toJSON() {
    return {
      id: this.id,
      data: this.data,
      url: this.url,
      type: this.type,
      size: this.size,
      errorCorrectionLevel: this.errorCorrectionLevel,
      margin: this.margin,
      format: this.format,
      color: this.color,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      metadata: this.metadata,
      usage: {
        ...this.usage,
        uniqueUsers: Array.from(this.usage.uniqueUsers) // Convert Set to Array
      }
    };
  }

  /**
   * Create QR code from JSON
   * @param {Object} json - JSON representation
   * @returns {QRCode} QR code instance
   */
  static fromJSON(json) {
    const data = { ...json };
    
    // Convert uniqueUsers array back to Set
    if (data.usage && data.usage.uniqueUsers) {
      data.usage.uniqueUsers = new Set(data.usage.uniqueUsers);
    }
    
    return new QRCode(data);
  }

  /**
   * Create QR code for URL
   * @param {string} url - URL to encode
   * @param {Object} options - Additional options
   * @returns {QRCode} QR code instance
   */
  static forUrl(url, options = {}) {
    return new QRCode({
      url,
      type: 'url',
      ...options
    });
  }

  /**
   * Create QR code for text
   * @param {string} text - Text to encode
   * @param {Object} options - Additional options
   * @returns {QRCode} QR code instance
   */
  static forText(text, options = {}) {
    return new QRCode({
      data: text,
      type: 'text',
      ...options
    });
  }

  /**
   * Create QR code optimized for AR
   * @param {string} content - Content to encode
   * @param {Object} options - Additional options
   * @returns {QRCode} AR-optimized QR code instance
   */
  static forAR(content, options = {}) {
    return new QRCode({
      [content.startsWith('http') ? 'url' : 'data']: content,
      type: 'ar',
      size: 512,
      errorCorrectionLevel: 'H', // High error correction for AR
      margin: 3, // Extra margin for better detection
      color: { dark: '#000000', light: '#FFFFFF' }, // High contrast
      metadata: {
        arOptimized: true,
        purpose: 'ar_marker'
      },
      ...options
    });
  }
}

/**
 * QR Code Collection Manager
 * Manages multiple QR codes
 */
export class QRCodeCollection {
  constructor() {
    this.qrCodes = new Map();
  }

  /**
   * Add QR code to collection
   * @param {QRCode} qrCode - QR code to add
   * @returns {string} QR code ID
   */
  add(qrCode) {
    this.qrCodes.set(qrCode.id, qrCode);
    return qrCode.id;
  }

  /**
   * Get QR code by ID
   * @param {string} id - QR code ID
   * @returns {QRCode|null} QR code or null if not found
   */
  get(id) {
    return this.qrCodes.get(id) || null;
  }

  /**
   * Remove QR code from collection
   * @param {string} id - QR code ID
   * @returns {boolean} True if removed
   */
  remove(id) {
    return this.qrCodes.delete(id);
  }

  /**
   * Get all QR codes
   * @returns {Array<QRCode>} Array of QR codes
   */
  getAll() {
    return Array.from(this.qrCodes.values());
  }

  /**
   * Find QR codes by criteria
   * @param {Function} predicate - Filter function
   * @returns {Array<QRCode>} Matching QR codes
   */
  find(predicate) {
    return this.getAll().filter(predicate);
  }

  /**
   * Get collection statistics
   * @returns {Object} Collection statistics
   */
  getStats() {
    const qrCodes = this.getAll();
    
    return {
      total: qrCodes.length,
      totalScans: qrCodes.reduce((sum, qr) => sum + qr.usage.scanCount, 0),
      totalArActivations: qrCodes.reduce((sum, qr) => sum + qr.usage.arActivations, 0),
      uniqueUsers: new Set(qrCodes.flatMap(qr => Array.from(qr.usage.uniqueUsers))).size,
      formats: this.groupBy(qrCodes, 'format'),
      sizes: this.groupBy(qrCodes, 'size'),
      errorLevels: this.groupBy(qrCodes, 'errorCorrectionLevel')
    };
  }

  /**
   * Group QR codes by property
   * @param {Array} qrCodes - QR codes to group
   * @param {string} property - Property to group by
   * @returns {Object} Grouped results
   */
  groupBy(qrCodes, property) {
    return qrCodes.reduce((groups, qr) => {
      const key = qr[property];
      groups[key] = (groups[key] || 0) + 1;
      return groups;
    }, {});
  }
}

// Export default QRCode class and utilities
export default QRCode;