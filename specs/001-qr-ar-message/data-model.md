# Data Model: QR Code AR Message Experience

**Feature**: QR Code AR Message Experience  
**Date**: October 24, 2025  
**Phase**: 1 - Data Design

## Entities

### QRCode
Represents the generated QR code that serves as both website link and AR marker.

**Attributes**:
- `id`: string - Unique identifier for the QR code
- `url`: string - The website URL encoded in the QR code
- `imageData`: Buffer/string - Base64 or binary image data
- `markerData`: object - MindAR training data for AR tracking
- `size`: number - QR code size in pixels (default: 256)
- `errorCorrectionLevel`: string - QR error correction level (M for AR tracking)
- `createdAt`: Date - Generation timestamp
- `isActive`: boolean - Whether QR code is currently active

**Validation Rules**:
- `url` must be valid HTTP/HTTPS URL
- `size` must be between 128 and 512 pixels
- `errorCorrectionLevel` must be one of: L, M, Q, H
- `imageData` must be valid PNG/SVG format

**State Transitions**:
- GENERATING → ACTIVE → INACTIVE
- Only one QR code can be ACTIVE at a time

### ARMessage
Represents the message content displayed in AR overlay.

**Attributes**:
- `id`: string - Unique identifier for the message
- `content`: string - The Portuguese text content
- `language`: string - Language code (default: 'pt-BR')
- `styling`: object - Text appearance configuration
- `position`: object - 3D position relative to marker
- `duration`: number - Display duration in milliseconds (optional)
- `isVisible`: boolean - Current visibility state

**Styling Object**:
```javascript
{
  fontSize: number,          // Text size in AR units
  color: string,            // Hex color code
  fontFamily: string,       // Font name
  backgroundColor: string,   // Background color (optional)
  opacity: number,          // Transparency (0-1)
  alignment: string         // 'left', 'center', 'right'
}
```

**Position Object**:
```javascript
{
  x: number,               // X coordinate relative to marker
  y: number,               // Y coordinate relative to marker
  z: number,               // Z coordinate (distance from marker)
  rotation: {
    x: number,             // X-axis rotation in radians
    y: number,             // Y-axis rotation in radians
    z: number              // Z-axis rotation in radians
  }
}
```

**Validation Rules**:
- `content` must not exceed 500 characters
- `language` must be valid ISO 639-1 code
- `styling.fontSize` must be between 0.1 and 5.0
- `styling.color` must be valid hex color
- `position` coordinates must be within reasonable bounds

### WebSession
Represents a user's interaction session from QR scan to AR completion.

**Attributes**:
- `sessionId`: string - Unique session identifier
- `userAgent`: string - Browser user agent string
- `startTime`: Date - Session start timestamp
- `endTime`: Date - Session end timestamp (optional)
- `hasCamera`: boolean - Camera access granted
- `hasWebAR`: boolean - WebAR capabilities detected
- `qrScanned`: boolean - QR code successfully scanned
- `arTriggered`: boolean - AR experience activated
- `messageViewed`: boolean - Message successfully displayed
- `errors`: array - List of error events during session

**Error Event Object**:
```javascript
{
  timestamp: Date,
  type: string,            // 'camera', 'ar', 'tracking', 'permission'
  message: string,         // Error description
  code: string            // Error code for debugging
}
```

**State Transitions**:
- STARTED → QR_SCANNED → AR_ACTIVE → MESSAGE_VIEWED → COMPLETED
- Any state can transition to ERROR

## Relationships

### QRCode ↔ ARMessage
- **Type**: One-to-One
- **Description**: Each QR code has exactly one associated AR message
- **Implementation**: ARMessage contains reference to QRCode ID

### WebSession ↔ QRCode
- **Type**: Many-to-One
- **Description**: Multiple sessions can use the same QR code
- **Implementation**: WebSession tracks which QRCode was used

### WebSession ↔ ARMessage
- **Type**: Many-to-One (through QRCode)
- **Description**: Sessions view messages through QR code association
- **Implementation**: Derived relationship through QRCode

## Data Storage Strategy

### Client-Side Storage
```javascript
// LocalStorage for session persistence
sessionStorage: {
  currentSession: WebSession,
  deviceCapabilities: {
    hasCamera: boolean,
    hasWebAR: boolean,
    browserType: string
  }
}

// Memory storage for AR runtime
memoryStore: {
  activeQRCode: QRCode,
  currentMessage: ARMessage,
  trackingState: object
}
```

### Static Assets
```
public/qr-codes/
├── qr-[id].png          # Generated QR code images
└── markers/
    └── qr-[id].mind     # MindAR training data

public/ar-assets/
├── fonts/               # Typography for AR text
└── textures/           # Background textures (optional)
```

### No Database Required
This application operates entirely client-side with static file serving. No persistent database storage is needed as:
- QR codes are generated once and served statically
- AR messages are embedded in the application
- Session data is temporary and stored client-side only

## Validation and Constraints

### Input Validation
- All user inputs sanitized for XSS prevention
- Camera permissions validated before AR initialization
- Browser capability detection before feature activation

### Performance Constraints
- QR code generation: < 100ms
- AR initialization: < 2 seconds
- Message display: < 500ms after marker detection
- Memory usage: < 50MB for AR assets

### Error Handling
- Graceful fallbacks for unsupported browsers
- Clear error messages for permission denials
- Automatic retry logic for tracking failures
- Session recovery for temporary interruptions