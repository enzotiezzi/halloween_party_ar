# Quick Start Guide: QR Code AR Message Experience

**Project**: Halloween Party AI - QR Code AR Message  
**Date**: October 24, 2025  
**Estimated Setup Time**: 30 minutes

## Prerequisites

### System Requirements
- **Node.js**: 18.0 or higher
- **npm**: 9.0 or higher (or yarn/pnpm equivalent)
- **Git**: Latest version
- **Modern Browser**: Chrome 88+, Safari 15+, or Firefox 90+

### Hardware Requirements
- **Development**: Any modern computer with camera (for testing)
- **Target Devices**: Mobile devices with rear camera and WebAR support
- **Network**: Internet connection for CDN dependencies

## Quick Setup (5 minutes)

```bash
# 1. Clone and enter project directory
git clone <repository-url>
cd halloween_party_ai

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Open browser and navigate to
# http://localhost:3000
```

## Project Structure Overview

```
halloween_party_ai/
├── pages/
│   ├── index.js           # QR code display page
│   ├── ar.js              # AR experience page
│   └── api/
│       ├── qr-code.js     # QR generation endpoint
│       └── ar/
│           ├── capabilities.js  # Device detection
│           └── message.js       # AR message config
├── components/
│   ├── QRDisplay.js       # QR code component
│   ├── ARScene.js         # Main AR experience
│   ├── CameraHandler.js   # Camera permissions
│   └── MessageOverlay.js  # Portuguese message display
├── public/
│   ├── qr-codes/         # Generated QR images
│   ├── ar-assets/        # AR marker training data
│   └── fonts/            # Custom fonts for AR text
└── styles/
    ├── globals.css
    └── ar.module.css     # AR-specific styles
```

## Development Workflow

### 1. Generate QR Code (First Run)
```bash
# Generate the QR code and AR marker data
npm run generate-qr

# This creates:
# - public/qr-codes/qr_001.png
# - public/ar-assets/markers/qr_001.mind
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Test QR Code Generation
Navigate to `http://localhost:3000/api/qr-code` to verify QR generation works.

### 4. Test AR Experience
1. Open `http://localhost:3000` on mobile device
2. Scan QR code or navigate to AR page directly
3. Grant camera permissions
4. Point camera at printed QR code to trigger AR

## Core Components

### QR Code Display (`pages/index.js`)
```javascript
import QRDisplay from '../components/QRDisplay';

export default function Home() {
  return (
    <div>
      <h1>Halloween Party AR Experience</h1>
      <QRDisplay />
      <p>Scan the QR code to begin your AR adventure!</p>
    </div>
  );
}
```

### AR Scene (`components/ARScene.js`)
```javascript
import { useEffect, useRef } from 'react';
import { MindARThree } from 'mind-ar/dist/mindar-image-three.prod.js';

export default function ARScene({ onMarkerFound }) {
  const containerRef = useRef();
  
  useEffect(() => {
    // Initialize MindAR with QR code marker
    const mindarThree = new MindARThree({
      container: containerRef.current,
      imageTargetSrc: '/ar-assets/markers/qr_001.mind',
    });
    
    // Add Portuguese message to scene
    // Implementation details...
  }, []);
  
  return <div ref={containerRef} className="ar-container" />;
}
```

## Key Configuration Files

### Next.js Configuration (`next.config.js`)
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    esmExternals: false, // Required for MindAR
  },
  webpack: (config) => {
    // Handle MindAR dependencies
    config.resolve.fallback = {
      fs: false,
      path: false,
    };
    return config;
  },
};

module.exports = nextConfig;
```

### Package Dependencies (`package.json`)
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "mind-ar": "^1.2.0",
    "three": "^0.158.0",
    "qrcode": "^1.5.3"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "jest": "^29.7.0",
    "playwright": "^1.40.0"
  }
}
```

## Testing Setup

### Unit Tests
```bash
# Run component tests
npm test

# Run with coverage
npm run test:coverage
```

### E2E Tests (AR Experience)
```bash
# Install Playwright browsers
npx playwright install

# Run AR tests (requires camera simulation)
npm run test:e2e
```

### Manual Testing Checklist
- [ ] QR code generates and displays correctly
- [ ] QR code scanning redirects to AR page
- [ ] Camera permissions are requested properly
- [ ] AR marker detection works with printed QR code
- [ ] Portuguese message displays in AR overlay
- [ ] Message remains anchored to QR code position
- [ ] Graceful fallback on unsupported devices

## Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel

# Production deployment
vercel --prod
```

### Environment Variables
```bash
# .env.local
NEXT_PUBLIC_AR_DEBUG=false
NEXT_PUBLIC_QR_BASE_URL=https://your-domain.com
```

## Troubleshooting

### Common Issues

**QR Code Not Generating**
```bash
# Check API endpoint
curl http://localhost:3000/api/qr-code

# Verify dependencies
npm ls qrcode
```

**AR Not Working**
- Ensure HTTPS in production (required for camera access)
- Check browser WebAR support: https://caniuse.com/webxr
- Verify marker training file exists in `/public/ar-assets/`

**Camera Permissions Denied**
- Test on different browsers/devices
- Ensure HTTPS connection
- Check browser security settings

**Poor AR Tracking**
- Improve QR code print quality
- Ensure good lighting conditions
- Verify QR code error correction level (should be 'M')

### Debug Mode
```javascript
// Enable AR debug logging
localStorage.setItem('ar-debug', 'true');

// Monitor performance
console.log('AR Performance:', window.arPerformanceMetrics);
```

## Next Steps

1. **Customize Message**: Edit AR message content in `/components/MessageOverlay.js`
2. **Styling**: Modify AR text appearance in `/styles/ar.module.css`
3. **Analytics**: Add session tracking to monitor user engagement
4. **Performance**: Optimize for lower-end mobile devices
5. **Features**: Add multiple messages or interactive elements

## Support Resources

- **MindAR Documentation**: https://hiukim.github.io/mind-ar-js-doc/
- **Three.js Documentation**: https://threejs.org/docs/
- **Next.js Documentation**: https://nextjs.org/docs
- **WebAR Browser Support**: https://immersiveweb.dev/

For questions or issues, please check the project README or create an issue in the repository.