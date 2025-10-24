# QR Codes Directory

This directory contains generated QR codes for the Halloween AR Experience.

## Structure

- `/generated/` - Dynamically generated QR codes
- `/templates/` - Template QR codes for different purposes
- `/archive/` - Historical QR codes for tracking

## QR Code Types

1. **AR Experience QR Codes**
   - Purpose: Link to the main AR experience
   - Format: PNG, 512x512px, High error correction
   - Naming: `ar-experience-{timestamp}.png`

2. **Session QR Codes**
   - Purpose: Track specific user sessions
   - Format: PNG, 256x256px, Medium error correction
   - Naming: `session-{sessionId}.png`

3. **Template QR Codes**
   - Purpose: Pre-generated codes for common uses
   - Format: Various sizes and formats
   - Naming: `template-{type}-{size}.{format}`

## Usage Guidelines

- All QR codes should use high contrast (black on white)
- Minimum size: 64x64px for basic scanning
- Recommended size: 256x256px for mobile scanning
- AR optimized size: 512x512px for AR marker detection
- Include adequate quiet zone (margin) around QR code
- Use error correction level H for AR applications

## File Management

- Generated QR codes are temporary and may be cleaned up
- Template QR codes are permanent
- Archive contains historical data for analytics

## Security Notes

- QR codes linking to the application should use HTTPS
- Validate all QR code content before generation
- Monitor for malicious QR code requests
- Implement rate limiting for QR generation

## Performance

- Cache frequently used QR codes
- Use appropriate image compression
- Consider CDN for static QR codes
- Implement lazy loading for QR code galleries