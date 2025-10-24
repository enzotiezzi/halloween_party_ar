# Research: QR Code AR Message Experience

**Feature**: QR Code AR Message Experience  
**Date**: October 24, 2025  
**Phase**: 0 - Research & Technology Decisions

## Research Questions Addressed

### 1. MindAR.js Integration with Next.js

**Decision**: Use MindAR.js as a client-side library with dynamic imports in Next.js

**Rationale**: 
- MindAR.js is a browser-based AR library that works well with React/Next.js
- Supports image tracking which is perfect for QR code markers
- No server-side dependencies required
- Built on Three.js which provides robust 3D rendering
- WebAR approach eliminates app store requirements

**Alternatives Considered**:
- AR.js: Less maintained, limited marker tracking capabilities
- 8th Wall: Commercial solution, unnecessary complexity for simple message display
- Native AR apps: Would require app store distribution, violates web-only requirement

### 2. QR Code Generation and Dual Purpose Usage

**Decision**: Generate QR codes containing website URL, use the same image as AR marker

**Rationale**:
- QR codes are high-contrast images that work well as AR markers
- MindAR.js can be trained on QR code patterns for reliable tracking
- Single QR code serves both navigation and AR trigger purposes
- Standard QR libraries (qrcode.js) can generate suitable marker images

**Alternatives Considered**:
- Separate QR code and AR marker: Would confuse users and require two images
- Custom AR markers: Would lose QR code scanning functionality
- Dynamic QR generation: Static QR codes provide better AR tracking consistency

### 3. Camera Permissions and WebAR Browser Support

**Decision**: Progressive enhancement with clear fallbacks for unsupported devices

**Rationale**:
- WebAR support varies across browsers and devices
- Camera permissions are required for both QR scanning and AR display
- Graceful degradation ensures basic functionality on all devices
- Modern mobile browsers (Safari 15+, Chrome 88+) have good WebAR support

**Alternatives Considered**:
- App-only approach: Violates web-only requirement
- Desktop AR: Limited camera availability and user context
- WebRTC without AR: Would lose immersive message display

### 4. AR Message Display and Portuguese Text Rendering

**Decision**: Use Three.js text geometry with custom fonts for AR message display

**Rationale**:
- Three.js provides reliable 3D text rendering in AR space
- Custom fonts ensure Portuguese characters render correctly
- Text can be anchored to QR code position with proper perspective
- CSS 3D transforms as fallback for unsupported WebAR devices

**Alternatives Considered**:
- HTML overlay: Positioning challenges with AR tracking
- Canvas-based text: More complex implementation for 3D perspective
- Image-based text: Inflexible for potential future message changes

### 5. Performance Optimization for Mobile AR

**Decision**: Implement lazy loading, texture optimization, and frame rate monitoring

**Rationale**:
- Mobile devices have limited processing power for AR
- Large AR libraries can impact initial page load
- Texture optimization reduces memory usage
- Frame rate monitoring allows dynamic quality adjustment

**Alternatives Considered**:
- No optimization: Would result in poor user experience on lower-end devices
- Pre-loading everything: Would slow initial page load significantly
- Server-side rendering: Not applicable for AR content

## Technology Stack Finalized

### Core Framework
- **Next.js 14+**: React-based framework with excellent developer experience
- **TypeScript**: Type safety for complex AR interactions
- **Node.js 18+**: Runtime for development and build processes

### AR and 3D Libraries
- **MindAR.js**: Image tracking AR library
- **Three.js**: 3D rendering engine (MindAR dependency)
- **@react-three/fiber**: React integration for Three.js (optional enhancement)

### QR Code and Utilities
- **qrcode**: QR code generation
- **qr-scanner**: Client-side QR code reading fallback
- **canvas**: Server-side image manipulation if needed

### Development and Testing
- **Jest**: Unit testing framework
- **Playwright**: E2E testing with camera simulation
- **ESLint + Prettier**: Code quality and formatting

## Implementation Approach

### AR Marker Training
1. Generate QR code with specific error correction level for AR tracking
2. Create MindAR marker training data from QR code image
3. Optimize marker detection parameters for various lighting conditions

### Progressive Enhancement Strategy
1. Basic QR code scanning functionality for all devices
2. AR enhancement for WebAR-capable browsers
3. Clear messaging for unsupported devices with graceful fallbacks

### Performance Considerations
1. Dynamic imports for AR libraries (code splitting)
2. Texture compression for 3D text rendering
3. Frame rate monitoring and quality adjustment
4. Memory management for continuous AR sessions

## Risk Mitigation

### Browser Compatibility
- **Risk**: Limited WebAR support on older devices
- **Mitigation**: Progressive enhancement with clear capability detection

### Camera Permissions
- **Risk**: Users deny camera access
- **Mitigation**: Clear permission prompts and fallback messaging

### AR Tracking Accuracy
- **Risk**: QR code detection fails in poor lighting
- **Mitigation**: Lighting guidance and marker optimization

### Performance on Low-End Devices
- **Risk**: AR experience is slow or unusable
- **Mitigation**: Dynamic quality adjustment and graceful degradation