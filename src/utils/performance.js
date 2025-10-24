/**
 * AR Performance Utilities
 * Optimizations for AR experience based on device capabilities
 */

/**
 * Performance optimization settings based on device class
 */
export const PERFORMANCE_PROFILES = {
  high_end: {
    maxFPS: 60,
    renderScale: 1.0,
    textureResolution: 'high',
    enableEffects: true,
    enableAntialiasing: true,
    shadowQuality: 'high',
    markerTracking: {
      maxMarkers: 3,
      trackingQuality: 'high',
      stabilization: true
    },
    camera: {
      width: 1280,
      height: 720,
      frameRate: 30
    }
  },
  mid_range: {
    maxFPS: 30,
    renderScale: 0.8,
    textureResolution: 'medium',
    enableEffects: true,
    enableAntialiasing: false,
    shadowQuality: 'medium',
    markerTracking: {
      maxMarkers: 2,
      trackingQuality: 'medium',
      stabilization: true
    },
    camera: {
      width: 1024,
      height: 576,
      frameRate: 30
    }
  },
  low_end: {
    maxFPS: 24,
    renderScale: 0.6,
    textureResolution: 'low',
    enableEffects: false,
    enableAntialiasing: false,
    shadowQuality: 'off',
    markerTracking: {
      maxMarkers: 1,
      trackingQuality: 'low',
      stabilization: false
    },
    camera: {
      width: 640,
      height: 480,
      frameRate: 24
    }
  }
};

/**
 * Performance monitor class for tracking AR performance metrics
 */
export class ARPerformanceMonitor {
  constructor() {
    this.reset();
  }

  reset() {
    this.metrics = {
      fps: 0,
      frameTime: 0,
      droppedFrames: 0,
      memoryUsage: 0,
      renderTime: 0,
      trackingTime: 0,
      startTime: Date.now(),
      frameCount: 0,
      lastFrameTime: 0
    };
    
    this.history = {
      fps: [],
      frameTime: [],
      memory: []
    };
    
    this.callbacks = {
      onPerformanceIssue: null,
      onFrameDrop: null,
      onMemoryWarning: null
    };
    
    this.thresholds = {
      minFPS: 20,
      maxFrameTime: 50, // ms
      maxMemoryMB: 512,
      maxConsecutiveDrops: 5
    };
    
    this.state = {
      consecutiveDrops: 0,
      lastOptimization: 0,
      adaptiveQuality: true
    };
  }

  /**
   * Start performance monitoring
   */
  start() {
    this.isRunning = true;
    this.monitorLoop();
  }

  /**
   * Stop performance monitoring
   */
  stop() {
    this.isRunning = false;
  }

  /**
   * Main monitoring loop
   */
  monitorLoop() {
    if (!this.isRunning) return;

    const now = performance.now();
    
    // Calculate frame metrics
    if (this.metrics.lastFrameTime > 0) {
      const frameTime = now - this.metrics.lastFrameTime;
      this.updateFrameMetrics(frameTime);
    }
    
    this.metrics.lastFrameTime = now;
    this.metrics.frameCount++;
    
    // Update memory metrics
    this.updateMemoryMetrics();
    
    // Check for performance issues
    this.checkPerformanceThresholds();
    
    // Continue monitoring
    requestAnimationFrame(() => this.monitorLoop());
  }

  /**
   * Update frame-related metrics
   */
  updateFrameMetrics(frameTime) {
    this.metrics.frameTime = frameTime;
    
    // Calculate FPS
    const fps = 1000 / frameTime;
    this.metrics.fps = this.smoothValue(this.metrics.fps, fps, 0.9);
    
    // Track dropped frames
    if (frameTime > this.thresholds.maxFrameTime) {
      this.metrics.droppedFrames++;
      this.state.consecutiveDrops++;
      
      if (this.callbacks.onFrameDrop) {
        this.callbacks.onFrameDrop(frameTime, this.state.consecutiveDrops);
      }
    } else {
      this.state.consecutiveDrops = 0;
    }
    
    // Update history
    this.addToHistory('fps', fps);
    this.addToHistory('frameTime', frameTime);
  }

  /**
   * Update memory usage metrics
   */
  updateMemoryMetrics() {
    if (performance.memory) {
      const memoryMB = performance.memory.usedJSHeapSize / (1024 * 1024);
      this.metrics.memoryUsage = memoryMB;
      this.addToHistory('memory', memoryMB);
      
      if (memoryMB > this.thresholds.maxMemoryMB && this.callbacks.onMemoryWarning) {
        this.callbacks.onMemoryWarning(memoryMB);
      }
    }
  }

  /**
   * Check performance thresholds and trigger optimizations
   */
  checkPerformanceThresholds() {
    const now = Date.now();
    const timeSinceLastOptimization = now - this.state.lastOptimization;
    
    // Only check every 2 seconds to avoid over-optimization
    if (timeSinceLastOptimization < 2000) return;
    
    let issueDetected = false;
    const issues = [];
    
    // Check FPS
    if (this.metrics.fps < this.thresholds.minFPS) {
      issues.push('low_fps');
      issueDetected = true;
    }
    
    // Check consecutive dropped frames
    if (this.state.consecutiveDrops >= this.thresholds.maxConsecutiveDrops) {
      issues.push('frame_drops');
      issueDetected = true;
    }
    
    // Check memory usage
    if (this.metrics.memoryUsage > this.thresholds.maxMemoryMB) {
      issues.push('high_memory');
      issueDetected = true;
    }
    
    if (issueDetected && this.callbacks.onPerformanceIssue) {
      this.callbacks.onPerformanceIssue(issues, this.getMetrics());
      this.state.lastOptimization = now;
    }
  }

  /**
   * Add value to history with size limit
   */
  addToHistory(metric, value) {
    if (!this.history[metric]) {
      this.history[metric] = [];
    }
    
    this.history[metric].push(value);
    
    // Keep only last 100 values
    if (this.history[metric].length > 100) {
      this.history[metric].shift();
    }
  }

  /**
   * Smooth value using exponential moving average
   */
  smoothValue(current, new_value, alpha) {
    return current === 0 ? new_value : (alpha * current) + ((1 - alpha) * new_value);
  }

  /**
   * Get current performance metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      uptime: Date.now() - this.metrics.startTime,
      averageFPS: this.getAverageFPS(),
      memoryTrend: this.getMemoryTrend()
    };
  }

  /**
   * Get average FPS over last 30 frames
   */
  getAverageFPS() {
    const recent = this.history.fps.slice(-30);
    return recent.length > 0 ? recent.reduce((a, b) => a + b, 0) / recent.length : 0;
  }

  /**
   * Get memory usage trend
   */
  getMemoryTrend() {
    const recent = this.history.memory.slice(-10);
    if (recent.length < 2) return 'stable';
    
    const trend = recent[recent.length - 1] - recent[0];
    if (trend > 10) return 'increasing';
    if (trend < -10) return 'decreasing';
    return 'stable';
  }

  /**
   * Set performance callbacks
   */
  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Update performance thresholds
   */
  setThresholds(thresholds) {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }
}

/**
 * Performance optimizer for AR scenes
 */
export class ARPerformanceOptimizer {
  constructor(deviceCapabilities) {
    this.capabilities = deviceCapabilities;
    this.currentProfile = this.getOptimalProfile();
    this.monitor = new ARPerformanceMonitor();
    this.optimizations = new Set();
    
    this.setupMonitorCallbacks();
  }

  /**
   * Get optimal performance profile based on device capabilities
   */
  getOptimalProfile() {
    const deviceClass = this.capabilities?.device?.class || 'low_end';
    return PERFORMANCE_PROFILES[deviceClass] || PERFORMANCE_PROFILES.low_end;
  }

  /**
   * Setup performance monitor callbacks
   */
  setupMonitorCallbacks() {
    this.monitor.setCallbacks({
      onPerformanceIssue: (issues, metrics) => {
        this.handlePerformanceIssues(issues, metrics);
      },
      onFrameDrop: (frameTime, consecutiveDrops) => {
        if (consecutiveDrops >= 3) {
          this.applyOptimization('reduce_quality');
        }
      },
      onMemoryWarning: (memoryMB) => {
        this.applyOptimization('memory_cleanup');
      }
    });
  }

  /**
   * Handle detected performance issues
   */
  handlePerformanceIssues(issues, metrics) {
    console.log('Performance issues detected:', issues, metrics);
    
    if (issues.includes('low_fps')) {
      this.applyOptimization('reduce_render_scale');
      this.applyOptimization('disable_effects');
    }
    
    if (issues.includes('frame_drops')) {
      this.applyOptimization('reduce_fps_target');
    }
    
    if (issues.includes('high_memory')) {
      this.applyOptimization('memory_cleanup');
      this.applyOptimization('reduce_texture_quality');
    }
  }

  /**
   * Apply specific optimization
   */
  applyOptimization(type) {
    if (this.optimizations.has(type)) {
      return; // Already applied
    }
    
    console.log(`Applying optimization: ${type}`);
    this.optimizations.add(type);
    
    switch (type) {
      case 'reduce_render_scale':
        this.currentProfile.renderScale = Math.max(0.4, this.currentProfile.renderScale - 0.1);
        break;
        
      case 'disable_effects':
        this.currentProfile.enableEffects = false;
        this.currentProfile.enableAntialiasing = false;
        break;
        
      case 'reduce_fps_target':
        this.currentProfile.maxFPS = Math.max(15, this.currentProfile.maxFPS - 5);
        break;
        
      case 'reduce_texture_quality':
        if (this.currentProfile.textureResolution === 'high') {
          this.currentProfile.textureResolution = 'medium';
        } else if (this.currentProfile.textureResolution === 'medium') {
          this.currentProfile.textureResolution = 'low';
        }
        break;
        
      case 'reduce_quality':
        this.applyOptimization('reduce_render_scale');
        this.applyOptimization('disable_effects');
        break;
        
      case 'memory_cleanup':
        // Trigger garbage collection if available
        if (window.gc) {
          window.gc();
        }
        break;
    }
    
    // Emit optimization event
    this.emitOptimizationEvent(type);
  }

  /**
   * Emit optimization event for external handlers
   */
  emitOptimizationEvent(type) {
    const event = new CustomEvent('ar-optimization', {
      detail: {
        type,
        profile: this.currentProfile,
        optimizations: Array.from(this.optimizations)
      }
    });
    
    window.dispatchEvent(event);
  }

  /**
   * Get camera constraints based on current profile
   */
  getCameraConstraints() {
    return {
      video: {
        width: { ideal: this.currentProfile.camera.width },
        height: { ideal: this.currentProfile.camera.height },
        frameRate: { ideal: this.currentProfile.camera.frameRate },
        facingMode: { ideal: 'environment' }
      }
    };
  }

  /**
   * Get Three.js renderer settings
   */
  getRendererSettings() {
    return {
      antialias: this.currentProfile.enableAntialiasing,
      alpha: true,
      powerPreference: this.capabilities?.device?.class === 'high_end' ? 'high-performance' : 'low-power',
      stencil: false,
      depth: true,
      preserveDrawingBuffer: false
    };
  }

  /**
   * Get MindAR settings
   */
  getMindARSettings() {
    return {
      maxTrack: this.currentProfile.markerTracking.maxMarkers,
      warmupTolerance: this.currentProfile.markerTracking.trackingQuality === 'high' ? 2 : 5,
      missTolerance: this.currentProfile.markerTracking.trackingQuality === 'high' ? 2 : 5,
      uiLoading: 'no',
      uiScanning: 'no',
      uiError: 'no'
    };
  }

  /**
   * Start performance monitoring
   */
  startMonitoring() {
    this.monitor.start();
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring() {
    this.monitor.stop();
  }

  /**
   * Get current performance metrics
   */
  getMetrics() {
    return this.monitor.getMetrics();
  }

  /**
   * Get current performance profile
   */
  getProfile() {
    return { ...this.currentProfile };
  }

  /**
   * Check if optimization is applied
   */
  hasOptimization(type) {
    return this.optimizations.has(type);
  }

  /**
   * Reset optimizations
   */
  resetOptimizations() {
    this.optimizations.clear();
    this.currentProfile = this.getOptimalProfile();
  }
}

/**
 * Utility functions for performance optimization
 */

/**
 * Debounce function for performance-sensitive operations
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for limiting function calls
 */
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Memory usage checker
 */
export function checkMemoryUsage() {
  if (performance.memory) {
    return {
      used: Math.round(performance.memory.usedJSHeapSize / (1024 * 1024)),
      total: Math.round(performance.memory.totalJSHeapSize / (1024 * 1024)),
      limit: Math.round(performance.memory.jsHeapSizeLimit / (1024 * 1024))
    };
  }
  return null;
}

/**
 * Frame rate calculator
 */
export class FrameRateCalculator {
  constructor(sampleSize = 60) {
    this.sampleSize = sampleSize;
    this.frames = [];
    this.lastTime = 0;
  }

  update() {
    const now = performance.now();
    
    if (this.lastTime > 0) {
      const delta = now - this.lastTime;
      this.frames.push(1000 / delta);
      
      if (this.frames.length > this.sampleSize) {
        this.frames.shift();
      }
    }
    
    this.lastTime = now;
  }

  getFPS() {
    if (this.frames.length === 0) return 0;
    
    const sum = this.frames.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.frames.length);
  }

  getMinFPS() {
    return this.frames.length > 0 ? Math.min(...this.frames) : 0;
  }

  getMaxFPS() {
    return this.frames.length > 0 ? Math.max(...this.frames) : 0;
  }
}

export default {
  PERFORMANCE_PROFILES,
  ARPerformanceMonitor,
  ARPerformanceOptimizer,
  debounce,
  throttle,
  checkMemoryUsage,
  FrameRateCalculator
};