# Vishal Embroidery Works

## Current State

The Virtual Trial Room (VirtualTrialRoomPage.tsx) exists but uses a cartoon SVG mannequin (BlouseMannequin.tsx) with drag/resize/rotate embroidery overlays, tap zones, manual adjustment handles, and rectangle-based embroidery cropping. This system is too complex for customers and must be completely replaced.

The TrialRoomPage.tsx (simple list view) remains unchanged.

## Requested Changes (Diff)

### Add
- New VirtualTrialRoomPage.tsx rebuilt from scratch
- 4 realistic mannequin images (front, back, left, right views) generated as assets
- View switcher buttons: Front | Back | Left | Right
- Blouse color picker — color applied via CSS mix-blend-mode overlay constrained to the blouse area
- Embroidery overlay: uses design's first image as transparent PNG over the mannequin, auto-positioned based on active view
- Embroidery Color 1 and Color 2 pickers (CSS hue-rotate tint on embroidery layer)
- Horizontal design slider below preview showing designs from Firestore
- Upload My Fabric Photo button (opens file picker with camera/gallery option)
- Uploaded fabric replaces blouse color layer as texture, embroidery stays on top
- Cancel button (goBack) and Add to Stitching button (saves to orders and goBack)

### Modify
- BlouseMannequin.tsx — no longer used by VirtualTrialRoomPage; kept in codebase for safety but not imported
- App.tsx — no changes needed, existing handleOpenVirtualTrial and handleAddToVirtualTrialRoom remain

### Remove
- All drag / resize / rotate embroidery overlay logic from VirtualTrialRoomPage
- Cartoon avatar SVG rendering from trial room
- Rectangle embroidery cropper / zone editor
- Manual adjustment tap zones
- AI preview modal (remove to simplify; can be re-added later)
- Mirror mode

## Implementation Plan

1. Generate 4 realistic mannequin images using generate_image tool (front, back, left, right)
2. Rebuild VirtualTrialRoomPage.tsx:
   - State: activeView (front|back|left|right), blouseColor, fabricPhoto, selectedDesign, embColor1, embColor2
   - Mannequin area: show the correct mannequin image per activeView; apply blouseColor as a semi-transparent multiply overlay; if fabricPhoto show it as texture overlay; show embroidery image on top positioned for the view
   - View switcher: 4 buttons at top of preview
   - Design slider: horizontal scroll list of Firestore designs, tap to select
   - Color controls: blouseColor swatch picker + embColor1 + embColor2
   - Fabric upload: input[type=file accept=image/*] with capture attribute for camera option
   - Bottom: Cancel + Add to Stitching
3. Validate frontend build
