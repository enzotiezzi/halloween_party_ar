# Implementation Plan: QR Code AR Message Experience

**Branch**: `001-qr-ar-message` | **Date**: October 24, 2025 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-qr-ar-message/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Create a web application that serves a QR code which acts as both a website link and AR marker. When users scan the QR code, they access a website that uses their camera to display an AR message in Portuguese when the same QR code is detected. Technical approach combines Next.js for the web application framework with MindAR.js for marker-based augmented reality functionality.

## Technical Context

**Language/Version**: JavaScript/TypeScript with Node.js 18+  
**Primary Dependencies**: Next.js 14+, MindAR.js, Three.js, QR code generator library  
**Storage**: Static file serving for QR code and AR assets, no database required  
**Testing**: Jest for unit tests, Playwright for E2E AR testing  
**Target Platform**: Web browsers with WebAR support (mobile Safari, Chrome)  
**Project Type**: Web application with AR capabilities  
**Performance Goals**: AR message display within 2 seconds of QR detection, 60fps AR rendering  
**Constraints**: Works without app downloads, camera permission required, WebAR browser support  
**Scale/Scope**: Single-user AR experiences, minimal backend requirements

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: PASS - No constitution file found, proceeding with standard web application practices

**Post-Design Re-evaluation**: PASS - Implementation follows standard patterns:
- Single web application project (no unnecessary complexity)
- Standard Next.js API routes for backend functionality
- Client-side AR implementation using established libraries
- No custom frameworks or architectures introduced
- Clear separation of concerns between components
- Progressive enhancement for browser compatibility

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Web application structure
pages/
├── index.js             # QR code display and instructions
├── ar.js                # AR experience page
└── api/
    └── qr-code.js       # QR code generation endpoint

components/
├── QRDisplay.js         # QR code component
├── ARScene.js           # MindAR + Three.js AR scene
├── CameraHandler.js     # Camera permissions and setup
└── MessageOverlay.js    # Portuguese message display

public/
├── qr-codes/           # Generated QR code images
├── ar-assets/          # AR marker training data
└── fonts/              # Typography for AR message

styles/
├── globals.css
└── ar.module.css       # AR-specific styling

tests/
├── unit/               # Component unit tests
├── integration/        # API integration tests
└── e2e/               # Playwright AR testing
```

**Structure Decision**: Web application structure selected to support Next.js framework with AR capabilities. Pages directory for routing, components for reusable AR functionality, public directory for static assets including QR codes and AR marker data.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
