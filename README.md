# 🧛‍♂️ Halloween AR Vampire Hunt

An immersive augmented reality experience where users scan a QR code to reveal a vampire's secret message in Portuguese, combining WebAR technology with spooky Halloween theming.

## 🎃 Live Demo

1. **Visit Homepage**: Open `http://localhost:3000` 
2. **Scan QR Code**: Use your mobile device to scan the displayed QR code
3. **Start AR Experience**: Click "Start AR Experience" on your mobile device
4. **Point at QR Code**: Aim your camera at the same QR code to reveal the vampire's message

## ✨ Features

### 🎯 Core Experience
- **QR Code Portal**: Dynamic QR code generation for website access
- **WebAR Integration**: Camera-based AR using MindAR.js and Three.js
- **Vampire Message**: Portuguese vampire message overlay in AR
- **Cross-Device Support**: Optimized for iOS Safari 14+ and Android Chrome 81+

### 🔧 Technical Features  
- **Device Capability Detection**: Automatic AR compatibility assessment
- **Performance Optimization**: Adaptive quality based on device capabilities
- **Session Management**: Complete user journey tracking
- **Progressive Enhancement**: Graceful fallbacks for unsupported devices
- **Portuguese Typography**: Optimized fonts for vampire-themed AR text

### 📱 User Stories Implemented

#### ✅ User Story 1: QR Code Website Access
- Users can scan QR code to access the Halloween AR website
- Responsive design works across mobile and desktop devices
- Device compatibility detection and recommendations

#### ✅ User Story 2: AR Message Display  
- Camera-based AR marker detection using the QR code
- Portuguese vampire message appears when QR code is detected
- Immersive AR experience with vampire-themed styling

#### 🚧 User Story 3: Cross-Device Compatibility (Optional)
- Enhanced browser compatibility features
- Performance optimizations for low-end devices
- Advanced error handling and user guidance

## 🚀 Technology Stack

- **Framework**: Next.js 14+ with TypeScript
- **AR Libraries**: MindAR.js (WebAR), Three.js (3D rendering)
- **QR Libraries**: qrcode (generation), qr-scanner (detection)
- **Styling**: CSS-in-JS with vampire theming
- **Testing**: Jest (unit tests), Playwright (E2E)

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+
- Modern web browser with camera support
- Mobile device for optimal AR experience

### Quick Start
```bash
# Clone the repository
git clone <repository-url>
cd halloween_party_ai

# Install dependencies
npm install

# Start development server
npm run dev

# Visit http://localhost:3000
```

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run test         # Run tests
npm run lint         # Run linting
```

## 🎮 Usage Guide

### For Users
1. **Desktop Experience**: 
   - Visit the homepage to see the QR code
   - Read device compatibility information
   - Share the QR code with mobile users

2. **Mobile AR Experience**:
   - Scan the QR code or visit the site directly
   - Click "Start AR Experience" 
   - Allow camera permissions when prompted
   - Point camera at the QR code to see the vampire message

### For Developers
1. **Test Page**: Visit `/test` for component validation
2. **API Endpoints**:
   - `/api/ar/message` - Vampire message configuration
   - `/api/ar/capabilities` - Device capability assessment
   - `/api/qr-code` - QR code generation
   - `/api/session` - Session tracking

## 🧛‍♂️ The Vampire's Message

*"O vampiro se esconde no reflexo, mas Rupert percebeu a verdade… Siga-o para a próxima pista antes que ele desapareça também."*

This Portuguese message appears in AR when users point their camera at the QR code, creating an immersive Halloween experience.

## 🔧 Architecture

### Component Structure
```
src/
├── components/
│   ├── ARScene.js              # Core AR experience with MindAR
│   ├── ARSessionManager.js     # AR session lifecycle management
│   ├── CameraHandler.js        # Camera permissions and stream handling
│   └── MessageOverlay.js       # Vampire message display
├── hooks/
│   └── useDeviceCapabilities.js # Device capability detection
├── utils/
│   └── performance.js          # AR performance optimization
└── lib/
    ├── session.js             # Session state management
    ├── cameraUtils.js         # Camera utility functions
    └── deviceCapabilities.js  # Device detection logic
```

### API Structure
```
pages/api/
├── ar/
│   ├── message.js            # Vampire message configuration
│   └── capabilities.js       # Device capability assessment
├── qr-code.js               # QR code generation
└── session.js               # Session tracking
```

## 🛠️ Development

### Key Implementation Details

1. **WebAR Strategy**: Using MindAR.js with CDN loading due to npm package compilation issues
2. **Performance**: Adaptive quality settings based on device capabilities
3. **Session Management**: Client-side session tracking with localStorage persistence
4. **Cross-Browser**: Progressive enhancement with fallbacks

### Testing Strategy
- **Unit Tests**: Core utility functions and components
- **E2E Tests**: Complete user journey from QR scan to AR experience
- **Device Testing**: Multiple mobile browsers and capabilities
- **Performance Testing**: Frame rate monitoring and optimization

## 📊 Current Status

### ✅ Completed (35/53 tasks)
- **Phase 1**: Project setup and foundation ✅
- **Phase 2**: Core infrastructure ✅  
- **Phase 3**: User Story 1 - QR Code Access ✅
- **Phase 4**: User Story 2 - AR Message Display ✅

### 🚧 Optional Enhancements
- **Phase 5**: User Story 3 - Cross-device compatibility
- **Phase 6**: Polish and advanced features

### 🎯 Checkpoint Achievement
**"User Stories 1 AND 2 should both work independently - full AR experience functional"** ✅

## 🐛 Known Issues & Limitations

1. **WebAR Support**: Limited to modern mobile browsers
2. **MindAR Package**: Using CDN instead of npm due to compilation issues
3. **Device Performance**: Lower-end devices may have reduced quality
4. **Lighting Conditions**: AR works best in good lighting

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎃 Halloween Features

- Vampire-themed Portuguese messaging
- Dark, spooky UI design
- Halloween color scheme (orange, purple, dark red)
- Atmospheric text effects and animations
- Spooky sound effects (future enhancement)

---

**Happy Halloween! 🎃👻 May you find what the vampire is hiding...**