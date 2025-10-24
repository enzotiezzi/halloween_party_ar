# 🧛‍♂️ Halloween AR Vampire Hunt - Complete User Guide

Welcome to the Halloween AR Vampire Hunt! This guide will walk you through every step of experiencing this spooky augmented reality adventure.

## 📱 What You'll Need

### For Party Host (Setup)
- Computer with web browser (Chrome, Firefox, Safari, Edge)
- Internet connection
- Node.js 18+ installed

### For Party Guests (AR Experience)
- **Mobile device** with camera (iPhone or Android)
- **Modern mobile browser**:
  - iOS: Safari 14+ (recommended)
  - Android: Chrome 81+ (recommended)
- Good lighting conditions
- Camera permissions enabled

## 🎃 Part 1: Setting Up the Experience (Host Guide)

### Step 1: Start the Application
```bash
# Navigate to project folder
cd halloween_party_ai

# Install dependencies (if not done already)
npm install

# Start the server
npm run dev
```

### Step 2: Verify Setup
1. Open your browser and go to `http://localhost:3000`
2. You should see the Halloween-themed homepage with a QR code
3. If you see any errors, check the terminal for error messages

### Step 3: Test the System
1. Visit `http://localhost:3000/test` to run diagnostics
2. All green checkmarks = system ready! ✅
3. Any red X marks = troubleshoot using the error messages

### Step 4: Display the QR Code
1. Keep the homepage (`http://localhost:3000`) open on a large screen
2. Ensure the QR code is clearly visible to party guests
3. The QR code contains the link to start the AR experience

## 🔍 Part 2: The Guest Experience (Step-by-Step)

### Step 1: Scan the QR Code
**Using iPhone:**
1. Open the **Camera app**
2. Point camera at the QR code on screen
3. Tap the notification that appears
4. This opens the Halloween AR website

**Using Android:**
1. Open **Google Lens** or **Camera app**
2. Point at the QR code
3. Tap the link that appears
4. This opens the Halloween AR website

**Alternative Method:**
- Manually visit the website address shown below the QR code

### Step 2: Prepare for AR
1. Once on the website, you'll see the vampire-themed homepage
2. Read the atmospheric introduction text
3. Look for the big **"Start AR Experience"** button
4. Make sure you're in a **well-lit area**

### Step 3: Enable Camera Access
1. Tap **"Start AR Experience"**
2. Your browser will ask for camera permission
3. **Tap "Allow"** when prompted
4. If denied, go to browser settings to enable camera access

**Troubleshooting Camera Issues:**
- **iOS Safari**: Settings → Safari → Camera → Allow
- **Android Chrome**: Settings → Site Settings → Camera → Allow

### Step 4: Experience the AR Magic! 🎯
1. You'll see your camera view with AR interface
2. **Point your camera at the original QR code** (on the big screen)
3. Move closer or farther to get a good view
4. Keep the QR code centered in your camera view
5. **The vampire's secret message will appear in AR!**

### Step 5: Read the Vampire's Message
When the AR activates, you'll see:

> *"O vampiro se esconde no reflexo, mas Rupert percebeu a verdade… Siga-o para a próxima pista antes que ele desapareça também."*

Translation: *"The vampire hides in the reflection, but Rupert realized the truth... Follow him to the next clue before he disappears too."*

## 🎮 How the AR Works

### Detection Process
1. **Camera Initialization**: App accesses your device camera
2. **Marker Recognition**: AI scans for the QR code pattern
3. **3D Tracking**: System tracks QR code position and orientation
4. **Message Overlay**: Vampire text appears anchored to the QR code
5. **Real-time Updates**: Message follows QR code movement

### Best Practices for AR
- **Lighting**: Ensure good, even lighting (avoid shadows)
- **Distance**: Stay 1-3 feet away from the QR code
- **Stability**: Hold device steady for best tracking
- **Angle**: Point camera directly at QR code (avoid extreme angles)
- **Focus**: Ensure QR code is sharp and clear in camera view

## 🛠️ Troubleshooting Guide

### Common Issues and Solutions

#### "Camera Not Working" / Black Screen
**Problem**: Camera access denied or not available
**Solution**:
1. Check browser permissions for camera
2. Close other apps using camera
3. Restart browser and try again
4. Try a different browser (Safari on iOS, Chrome on Android)

#### "QR Code Not Detected"
**Problem**: AR system can't find the QR code
**Solution**:
1. **Improve lighting** - move to brighter area
2. **Clean camera lens** - wipe with soft cloth
3. **Adjust distance** - try moving closer/farther
4. **Check QR code** - ensure it's clearly displayed and not blurry
5. **Steady hands** - avoid shaking the device

#### "AR Message Not Appearing"
**Problem**: QR detected but no vampire message
**Solution**:
1. Wait 2-3 seconds for processing
2. Keep QR code in center of camera view
3. Ensure QR code is fully visible (all corners)
4. Try refreshing the page and starting over

#### "Website Won't Load"
**Problem**: Can't access the Halloween site
**Solution**:
1. Check internet connection
2. Verify the server is running (`npm run dev`)
3. Try accessing `http://localhost:3000` directly
4. Check if firewall is blocking the connection

#### "Poor Performance" / Laggy Experience
**Problem**: AR is slow or choppy
**Solution**:
1. Close other browser tabs and apps
2. Restart the browser
3. Try a newer/more powerful device
4. Ensure good lighting for better tracking

### Browser Compatibility
| Browser | iOS Version | Android Version | Support Level |
|---------|-------------|-----------------|---------------|
| Safari | 14+ | N/A | ✅ Excellent |
| Chrome | N/A | 81+ | ✅ Excellent |
| Firefox | 14+ | 81+ | ⚠️ Limited |
| Edge | N/A | 81+ | ⚠️ Limited |

## 🎪 Party Host Tips

### Setting Up the Perfect AR Experience

#### Environment Setup
1. **Lighting**: Ensure even, bright lighting around QR code display
2. **Display**: Use largest screen available for QR code
3. **Space**: Provide 4-6 feet of space in front of QR display
4. **Queue Management**: Allow one person at a time for best experience

#### Managing Multiple Guests
1. **Demo First**: Show one guest, let them demonstrate to others
2. **Assist with Setup**: Help guests with camera permissions
3. **Troubleshoot Together**: Use common issues guide above
4. **Create Atmosphere**: Dim other lights to enhance spooky mood

#### Enhancement Ideas
1. **Sound Effects**: Play vampire/Halloween sounds during AR
2. **Follow-up Clues**: Use the vampire message as start of treasure hunt
3. **Photo Opportunities**: Let guests screenshot the AR message
4. **Group Experience**: Have multiple people view AR simultaneously

## 📖 Understanding the Story

### The Vampire Mystery
The AR experience is part of a larger Halloween mystery:

- **Rupert**: The detective who discovered the vampire's secret
- **The Vampire**: Hiding in reflections and mirrors
- **The Message**: A clue leading to the next part of the mystery
- **QR Code as Mirror**: The digital "reflection" where truth is revealed

### Portuguese Element
The message is in Portuguese to add international mystery:
- Creates authentic vampire lore atmosphere
- Adds puzzle element for English speakers
- Connects to classic vampire literature traditions

## 🔧 Technical Details (Advanced)

### System Requirements
- **Network**: HTTP server running on port 3000
- **Device RAM**: 2GB+ recommended for smooth AR
- **Camera**: Rear-facing camera with autofocus
- **Browser**: WebRTC and WebGL support required

### Performance Optimization
The system automatically adjusts based on device capabilities:
- **High-end devices**: Full quality AR with smooth tracking
- **Mid-range devices**: Balanced quality and performance
- **Low-end devices**: Reduced quality for better frame rate

### Data Usage
- **Initial Load**: ~2MB (includes AR libraries)
- **Runtime**: Minimal data usage (camera processing is local)
- **No Data Required**: Works offline after initial load

## 🎭 Extending the Experience

### Creating Follow-up Clues
Use the vampire message as inspiration for additional Halloween activities:

1. **Mirror Hunt**: Hide clues near mirrors around the party space
2. **Rupert's Investigation**: Create detective game following Rupert
3. **Vampire Escape**: Time-limited challenges before vampire "disappears"
4. **Reflection Puzzles**: Use mirrors and reflective surfaces for more clues

### Customization Options
For developers wanting to modify the experience:
- Message text: Edit `/api/ar/message.js`
- Vampire styling: Modify CSS in AR components
- Additional languages: Add translations to message API
- Sound effects: Integrate Web Audio API

---

## 🎃 Final Notes

This Halloween AR experience combines cutting-edge web technology with classic vampire lore to create a memorable interactive adventure. The magic happens when digital and physical worlds merge through your camera, revealing secrets hidden in plain sight.

**Remember**: The vampire's message is just the beginning of the mystery... what will you discover next? 🧛‍♂️

Happy Halloween, and may you uncover the truth that Rupert discovered! 👻🎪