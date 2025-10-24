# AR Component Contracts

This document defines the contracts for AR-specific components and their interactions.

## ARScene Component Contract

### Props Interface
```typescript
interface ARSceneProps {
  qrCodeUrl: string;           // URL of the QR code image to use as marker
  message: ARMessage;          // Message configuration to display
  onMarkerFound: () => void;   // Callback when marker is detected
  onMarkerLost: () => void;    // Callback when marker is lost
  onError: (error: ARError) => void; // Error handling callback
  isActive: boolean;           // Whether AR should be active
}
```

### Events Emitted
```typescript
// Marker tracking events
interface MarkerEvents {
  'marker:found': { confidence: number; position: Vector3 };
  'marker:lost': { lastPosition: Vector3 };
  'marker:updated': { position: Vector3; rotation: Euler };
}

// AR lifecycle events
interface ARLifecycleEvents {
  'ar:initialized': { capabilities: WebARCapabilities };
  'ar:started': { timestamp: Date };
  'ar:stopped': { duration: number };
  'ar:error': { error: ARError };
}
```

## MindAR Integration Contract

### Initialization Parameters
```typescript
interface MindARConfig {
  container: HTMLElement;      // DOM container for AR canvas
  imageTargetSrc: string;      // Path to marker training file
  maxTrack: number;           // Maximum simultaneous markers (1)
  uiLoading: 'yes' | 'no';    // Show loading indicator
  uiScanning: 'yes' | 'no';   // Show scanning indicator
  uiError: 'yes' | 'no';      // Show error messages
}
```

### State Management
```typescript
interface ARState {
  isInitialized: boolean;
  isStarted: boolean;
  isTracking: boolean;
  currentMarker: {
    id: number;
    confidence: number;
    position: Matrix4;
  } | null;
  error: ARError | null;
}
```

## Camera Handler Contract

### Permission Management
```typescript
interface CameraPermissions {
  status: 'prompt' | 'granted' | 'denied';
  requestPermission(): Promise<boolean>;
  checkPermission(): Promise<PermissionStatus>;
}
```

### Stream Configuration
```typescript
interface CameraConfig {
  video: {
    facingMode: 'environment';  // Rear camera for AR
    width: { ideal: 1280 };
    height: { ideal: 720 };
  };
  audio: false;
}
```

## Message Overlay Contract

### Text Rendering Interface
```typescript
interface TextRenderer {
  content: string;
  language: string;
  styling: TextStyling;
  position: Vector3;
  rotation: Euler;
  
  // Methods
  updateContent(newContent: string): void;
  updatePosition(position: Vector3): void;
  show(): void;
  hide(): void;
  dispose(): void;
}
```

### Three.js Text Configuration
```typescript
interface TextGeometryConfig {
  font: Font;                 // Loaded font object
  size: number;              // Text size
  height: number;            // Text depth/extrusion
  curveSegments: number;     // Curve smoothness
  bevelEnabled: boolean;     // Bevel effects
}
```

## Error Handling Contracts

### AR Error Types
```typescript
type ARError = 
  | CameraError
  | PermissionError
  | TrackingError
  | InitializationError
  | BrowserCompatibilityError;

interface CameraError {
  type: 'camera';
  code: 'CAMERA_NOT_FOUND' | 'CAMERA_ACCESS_DENIED' | 'CAMERA_IN_USE';
  message: string;
  retryable: boolean;
}

interface PermissionError {
  type: 'permission';
  code: 'PERMISSION_DENIED' | 'PERMISSION_DISMISSED';
  message: string;
  retryable: boolean;
}

interface TrackingError {
  type: 'tracking';
  code: 'MARKER_NOT_FOUND' | 'TRACKING_LOST' | 'POOR_LIGHTING';
  message: string;
  retryable: boolean;
}
```

## Performance Contracts

### Frame Rate Monitoring
```typescript
interface PerformanceMonitor {
  targetFPS: number;          // Desired frame rate (30-60)
  currentFPS: number;         // Current measured FPS
  frameDrops: number;         // Dropped frames count
  
  // Quality adjustment
  adjustQuality(fps: number): QualitySettings;
  getRecommendedSettings(): QualitySettings;
}

interface QualitySettings {
  textureResolution: number;  // Texture size reduction factor
  renderScale: number;        // Render resolution scale
  particleCount: number;      // Particle effects count
  shadowQuality: 'high' | 'medium' | 'low' | 'off';
}
```

### Memory Management
```typescript
interface MemoryManager {
  maxMemoryUsage: number;     // MB limit
  currentUsage: number;       // Current memory usage
  
  // Cleanup methods
  disposeUnusedTextures(): void;
  clearGeometryCache(): void;
  optimizeScene(): void;
}
```

## Browser Compatibility Contracts

### WebAR Feature Detection
```typescript
interface WebARCapabilities {
  hasWebXR: boolean;
  hasGetUserMedia: boolean;
  hasWebGL: boolean;
  hasWebGL2: boolean;
  hasWebAssembly: boolean;
  supportedFormats: string[];  // Image formats for markers
}
```

### Progressive Enhancement
```typescript
interface FeatureFallbacks {
  // Full AR support
  fullAR(): ARScene;
  
  // Limited AR (no tracking)
  staticAR(): StaticOverlay;
  
  // No AR (message only)
  messageOnly(): TextDisplay;
  
  // Complete fallback
  unsupported(): UnsupportedMessage;
}
```

## Testing Contracts

### Mock Interfaces for Testing
```typescript
interface MockARScene {
  simulateMarkerDetection(): void;
  simulateMarkerLoss(): void;
  simulateError(error: ARError): void;
  setMockPosition(position: Vector3): void;
}

interface MockCamera {
  grantPermission(): void;
  denyPermission(): void;
  simulateStream(config: MediaStreamConfig): void;
}
```

### E2E Testing Contracts
```typescript
interface ARTestHelpers {
  waitForARInitialization(): Promise<void>;
  simulateQRCodeScan(): Promise<void>;
  verifyMessageDisplay(): Promise<boolean>;
  measurePerformance(): Promise<PerformanceMetrics>;
}