# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AR (Augmented Reality) web application built with A-Frame and MindAR for image tracking. The application creates a horror-themed AR experience titled "O Espelho Sussurra..." (The Mirror Whispers...) that triggers when a specific image target is detected by the camera.

## Technology Stack

- **A-Frame 1.4.2**: WebVR framework for building 3D/AR experiences
- **MindAR 1.2.5**: Image tracking library for AR experiences
- CDN-based dependencies (no build system required)

## Project Structure

The project is minimal and consists of:
- `index.html`: Main application file containing all HTML, CSS, and JavaScript
- `espelho.mind`: MindAR compiled image target data (binary file generated from training image)
- `espelho.png`: Source image used to create the image target

## Development

### Running the Application

This is a static web application that requires an HTTPS server to access the camera:

```bash
# Option 1: Using Python 3
python3 -m http.server 8000

# Option 2: Using Node.js http-server (if installed)
npx http-server -p 8000

# Option 3: Using PHP
php -S localhost:8000
```

Then open `https://localhost:8000` in a browser. Note: You'll need to accept the self-signed certificate warning, or use a tool that provides HTTPS.

### Testing AR Functionality

1. Point your device camera at the `espelho.png` image
2. The AR content should appear overlaid on the image target
3. Audio and animations will trigger on target detection

## Architecture

### Single-File Application

All code exists in `index.html` with three sections:

1. **Head Section**:
   - External library imports (A-Frame, MindAR)
   - CSS animations (fade, shake, blood-drip keyframes)

2. **A-Frame Scene**:
   - `mindar-image-target`: Image tracking configuration pointing to `espelho.mind`
   - AR content entities (text, geometry, animations, audio)
   - Positioned using A-Frame's coordinate system (0, 0, 0 = center of detected image)

3. **Script Section**:
   - Event listeners for `targetFound` and `targetLost` events
   - Progressive message reveals with timeouts
   - Audio playback control

### Image Target System

The `.mind` file is a compiled image target created by MindAR's compiler. To regenerate or create new targets:
- Use the MindAR Image Target Compiler (https://hiukim.github.io/mind-ar-js-doc/tools/compile)
- Upload your target image and download the resulting `.mind` file
- Update the `imageTargetSrc` path in the `mindar-image` attribute

### A-Frame Entity Structure

All AR content must be nested inside `<a-entity mindar-image-target="targetIndex: 0">` to appear when the image is detected. The `targetIndex` corresponds to the image in the `.mind` file (0 for first/only image).

## Key Implementation Details

- **3D Positioning**: Z-axis values determine depth (higher = closer to camera)
- **Animations**: Use A-Frame's animation component with properties like `dur`, `loop`, `easing`, `dir`
- **Audio**: Controlled via A-Frame sound component API (`playSound()`, `stopSound()`)
- **Event-Driven**: All interactions tied to MindAR's `targetFound`/`targetLost` events
- **Mobile-First**: Designed for mobile devices with camera access

## Common Modifications

### Changing AR Content
Edit entities within `<a-entity mindar-image-target="targetIndex: 0">` in index.html:87-142

### Updating Text
Modify the `text` component's `value` attribute on relevant entities

### Adjusting Animations
Change animation parameters in the `animation` attributes (duration, easing, loop behavior)

### Replacing Audio
Update the `<audio>` source URL in the `<a-assets>` section at index.html:80-82
