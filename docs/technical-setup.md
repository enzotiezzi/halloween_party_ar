# 🔧 Technical Setup Guide

This guide provides detailed technical instructions for developers and system administrators setting up the Halloween AR Vampire Hunt.

## 🚀 Quick Start

```bash
# Clone and setup
git clone <repository-url>
cd halloween_party_ai
npm install
npm run dev

# Visit http://localhost:3000
```

## 📋 Prerequisites

### System Requirements
- **Node.js**: Version 18.0 or higher
- **npm**: Version 8.0 or higher  
- **Operating System**: macOS, Windows, or Linux
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 500MB free space

### Browser Requirements (Development)
- **Chrome**: 90+ (recommended for development)
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

### Browser Requirements (Production/AR)
- **Mobile Safari**: 14+ (iOS devices)
- **Chrome Mobile**: 81+ (Android devices)
- **WebRTC Support**: Required for camera access
- **WebGL Support**: Required for 3D rendering

## 🛠️ Installation Steps

### Step 1: Environment Setup
```bash
# Verify Node.js version
node --version  # Should be 18.0+

# Verify npm version  
npm --version   # Should be 8.0+

# Create project directory (if cloning)
mkdir halloween_party_ai
cd halloween_party_ai
```

### Step 2: Dependency Installation
```bash
# Install all dependencies
npm install

# Install additional development tools (optional)
npm install -g @next/codemod
```

### Step 3: Environment Configuration
```bash
# Create environment file (if needed)
cp .env.example .env.local

# No environment variables required for basic setup
# All configuration is handled in code
```

### Step 4: Start Development Server
```bash
# Start Next.js development server
npm run dev

# Server will start on http://localhost:3000
# Hot reloading enabled for development
```

## 📁 Project Structure Deep Dive

### Core Application Files
```
halloween_party_ai/
├── pages/                  # Next.js pages (routing)
│   ├── index.js           # Homepage with QR code
│   ├── ar.js              # AR experience page
│   ├── test.js            # Component testing page
│   └── api/               # API endpoints
│       ├── ar/
│       │   ├── message.js     # Vampire message API
│       │   └── capabilities.js # Device detection API
│       ├── qr-code.js         # QR generation API
│       └── session.js         # Session management API
├── components/            # React components
│   ├── ARScene.js         # Main AR experience
│   ├── ARSessionManager.js # AR lifecycle management
│   ├── CameraHandler.js   # Camera permissions & stream
│   └── MessageOverlay.js  # Vampire message display
├── lib/                   # Utility libraries
│   ├── session.js         # Session state management
│   ├── cameraUtils.js     # Camera utility functions
│   └── deviceCapabilities.js # Device detection logic
├── public/                # Static assets
│   ├── fonts/             # Portuguese typography
│   └── favicon.ico        # Site icon
├── specs/                 # Feature specifications
│   └── 001-qr-ar-message/ # AR project specifications
└── docs/                  # Documentation
    └── user-guide.md      # User instructions
```

### Key Configuration Files
```
halloween_party_ai/
├── package.json           # Dependencies and scripts
├── next.config.js         # Next.js configuration
├── .gitignore            # Git ignore rules
└── README.md             # Project overview
```

## 🔌 API Endpoints

### 1. AR Message API
**Endpoint**: `GET /api/ar/message`
```bash
curl http://localhost:3000/api/ar/message
```
**Response**:
```json
{
  "message": "O vampiro se esconde no reflexo, mas Rupert percebeu a verdade… Siga-o para a próxima pista antes que ele desapareça também.",
  "language": "pt",
  "theme": "vampire",
  "style": {
    "color": "#8B0000",
    "fontSize": "24px",
    "fontFamily": "Portuguese AR"
  }
}
```

### 2. Device Capabilities API
**Endpoint**: `GET /api/ar/capabilities`
```bash
curl http://localhost:3000/api/ar/capabilities
```
**Response**:
```json
{
  "webAR": true,
  "camera": true,
  "webgl": true,
  "performance": "high",
  "recommendedSettings": {
    "quality": "high",
    "frameRate": 30
  }
}
```

### 3. QR Code Generation API
**Endpoint**: `GET /api/qr-code?url=<url>`
```bash
curl "http://localhost:3000/api/qr-code?url=http://localhost:3000/ar"
```
**Response**: Base64 encoded QR code image

### 4. Session Management API
**Endpoint**: `POST /api/session`
```bash
curl -X POST http://localhost:3000/api/session \
  -H "Content-Type: application/json" \
  -d '{"event":"ar_start","deviceInfo":"iOS Safari"}'
```

## 🧪 Testing Setup

### Unit Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### E2E Tests
```bash
# Install Playwright (if not installed)
npx playwright install

# Run E2E tests
npm run test:e2e

# Run E2E tests in headed mode
npm run test:e2e:headed
```

### Manual Testing Checklist
- [ ] Homepage loads correctly
- [ ] QR code displays properly
- [ ] AR page loads without errors
- [ ] Camera permissions work
- [ ] AR message appears when QR detected
- [ ] All API endpoints respond correctly
- [ ] Cross-browser compatibility verified

## 🐛 Troubleshooting

### Common Development Issues

#### 1. MindAR Installation Fails
**Problem**: `npm install mind-ar` fails with compilation errors
**Solution**: Project uses CDN approach instead of npm package
```javascript
// In components, MindAR is loaded via CDN in browser
// No npm installation needed
```

#### 2. Module Import Errors
**Problem**: ES6 import/export conflicts
**Solution**: Check file extensions and Next.js configuration
```javascript
// Ensure proper import syntax
import { ARScene } from '../components/ARScene.js'
```

#### 3. Camera Access Issues
**Problem**: Camera permissions denied or not working
**Solution**: 
```bash
# Serve over HTTPS for camera access
npm install -g local-ssl-proxy
local-ssl-proxy --source 3001 --target 3000
# Visit https://localhost:3001
```

#### 4. AR Not Working in Development
**Problem**: AR features don't work in development mode
**Solution**: 
- Use mobile device, not desktop browser
- Ensure good lighting conditions
- Check browser developer console for errors

### Performance Optimization

#### 1. Memory Management
```javascript
// In AR components, ensure cleanup
useEffect(() => {
  return () => {
    // Cleanup AR resources
    if (arSession) {
      arSession.destroy();
    }
  };
}, []);
```

#### 2. Network Optimization
```javascript
// Preload critical resources
useEffect(() => {
  // Preload MindAR library
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image.prod.js';
  document.head.appendChild(script);
}, []);
```

## 🚀 Production Deployment

### Build Configuration
```bash
# Create production build
npm run build

# Start production server
npm start

# Or export static files
npm run export
```

### Environment Variables
```bash
# .env.production
NEXT_PUBLIC_BASE_URL=https://your-domain.com
NEXT_PUBLIC_AR_QUALITY=high
```

### Deployment Platforms
- **Vercel** (recommended for Next.js)
- **Netlify** 
- **AWS Amplify**
- **Heroku**
- **DigitalOcean App Platform**

### HTTPS Requirements
AR features require HTTPS in production:
```bash
# Ensure SSL certificate is configured
# Camera access requires secure context
```

## 🔐 Security Considerations

### Camera Access
- Camera permissions handled securely
- No video data transmitted to server
- All processing done locally on device

### API Security
```javascript
// Rate limiting (recommended for production)
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
```

### Content Security Policy
```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "camera 'self'; microphone 'none';"
          }
        ]
      }
    ];
  }
};
```

## 📊 Monitoring and Analytics

### Performance Monitoring
```javascript
// Add to pages/_app.js
export function reportWebVitals(metric) {
  console.log(metric);
  // Send to analytics service
}
```

### Error Tracking
```javascript
// Error boundary for AR components
class ARErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('AR Error:', error, errorInfo);
    // Send to error tracking service
  }
}
```

## 🔄 Updates and Maintenance

### Keeping Dependencies Updated
```bash
# Check for outdated packages
npm outdated

# Update packages
npm update

# Update Next.js specifically
npm install next@latest react@latest react-dom@latest
```

### MindAR Version Management
```javascript
// Update CDN version in components
const MINDAR_VERSION = '1.2.5'; // Update as needed
```

### Browser Compatibility Updates
- Monitor WebAR support across browsers
- Test new iOS/Android versions
- Update compatibility documentation

---

## 🆘 Getting Help

### Documentation
- **Next.js**: https://nextjs.org/docs
- **MindAR**: https://hiukim.github.io/mind-ar-js-doc/
- **Three.js**: https://threejs.org/docs/

### Community Resources
- **Next.js Discord**: https://discord.gg/nextjs
- **WebAR Community**: https://discord.gg/webar
- **Stack Overflow**: Tag questions with `next.js`, `webxr`, `ar`

### Project-Specific Support
- Check GitHub issues for common problems
- Review test page at `/test` for diagnostics
- Use browser developer tools for debugging

Remember: This is a Halloween party application - prioritize user experience and atmosphere over technical complexity! 🎃