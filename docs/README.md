# 📚 Documentation Index

Welcome to the Halloween AR Vampire Hunt documentation! This folder contains comprehensive guides for both users and developers.

## 📖 Available Guides

### 🎃 For Party Hosts & Guests
- **[User Guide](./user-guide.md)** - Complete step-by-step instructions for experiencing the AR vampire hunt
  - Setting up the experience for your Halloween party
  - Guest instructions for scanning QR codes and accessing AR
  - Troubleshooting common issues
  - Tips for creating the perfect spooky atmosphere

### 🔧 For Developers & System Administrators  
- **[Technical Setup Guide](./technical-setup.md)** - Detailed technical documentation for developers
  - Installation and configuration instructions
  - API documentation and endpoints
  - Testing procedures and debugging
  - Production deployment guidelines
  - Security considerations and best practices

## 🚀 Quick Navigation

### I want to...
- **Use the AR experience at my party** → [User Guide](./user-guide.md)
- **Set up the technical infrastructure** → [Technical Setup Guide](./technical-setup.md)
- **Understand the project overview** → [Main README](../README.md)
- **See the feature specifications** → [Project Specs](../specs/001-qr-ar-message/)

## 🎯 Getting Started

### First Time Setup
1. **Developers**: Start with [Technical Setup Guide](./technical-setup.md)
2. **Party Hosts**: Start with [User Guide](./user-guide.md) Part 1
3. **Guests**: Jump to [User Guide](./user-guide.md) Part 2

### Quick Reference
- **Homepage**: `http://localhost:3000`
- **AR Experience**: `http://localhost:3000/ar`  
- **Test Page**: `http://localhost:3000/test`
- **Start Command**: `npm run dev`

## 🧛‍♂️ The Experience

This Halloween AR application creates an immersive vampire mystery where:
1. Guests scan a QR code to access a spooky website
2. The same QR code becomes an AR marker when viewed through their phone camera
3. A Portuguese vampire message appears in augmented reality: 
   > *"O vampiro se esconde no reflexo, mas Rupert percebeu a verdade… Siga-o para a próxima pista antes que ele desapareça também."*

## 🆘 Need Help?

### Quick Troubleshooting
| Issue | Quick Fix |
|-------|-----------|
| Can't scan QR code | Check camera permissions |
| AR not working | Ensure good lighting |
| Website won't load | Verify `npm run dev` is running |
| Camera black screen | Allow camera access in browser |

### Detailed Help
- **User Issues**: See [User Guide Troubleshooting](./user-guide.md#🛠️-troubleshooting-guide)
- **Technical Issues**: See [Technical Setup Troubleshooting](./technical-setup.md#🐛-troubleshooting)
- **API Problems**: Check [Technical Setup API Documentation](./technical-setup.md#🔌-api-endpoints)

## 📱 Browser Compatibility

| Device | Browser | AR Support | Recommended |
|--------|---------|------------|-------------|
| iPhone | Safari 14+ | ✅ Excellent | ⭐ Best Choice |
| Android | Chrome 81+ | ✅ Excellent | ⭐ Best Choice |
| iPhone | Chrome | ❌ Limited | Use Safari instead |
| Android | Firefox | ⚠️ Basic | Use Chrome instead |

## 🔄 Document Updates

This documentation is maintained alongside the codebase. Last updated: **October 24, 2025**

### Version History
- **v1.0** - Initial complete documentation with user and technical guides
- **v1.1** - Added troubleshooting sections and browser compatibility details
- **v1.2** - Enhanced party hosting tips and atmosphere creation guidance

---

**Happy Halloween! 🎃 May these guides help you create a magically spooky AR experience! 👻**