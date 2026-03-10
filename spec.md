# Vishal Embroidery Works – AI Virtual Trial Room

## Current State
The app has a VirtualTrialRoomPage with: 4-view mannequin (front/back/left/right), embroidery zone overlays, manual drag/resize/rotate per zone, fabric photo upload with dominant color detection, blouse color presets, embroidery color pickers, design slider with Firestore designs, and Add to Stitching action.

Mannequin images are SVG-based placeholder generated images. The embroidery zone splitting uses a naive 3-part horizontal split of the design image.

## Requested Changes (Diff)

### Add
- **Neck shape selector**: U Neck, Boat Neck, Deep Back, Princess Cut — each renders a different SVG neckline shape on the mannequin
- **Sleeve length selector**: Short Sleeve, Elbow Sleeve, Full Sleeve — updates the SVG mannequin sleeve length
- **Mannequin SVG component**: Draw a realistic boutique mannequin (waist mannequin, Indian blouse style, short sleeves, clear neckline) using SVG inline — color driven by blouseColor state, neckShape, sleeveLength props
- **Design image auto-crop**: When a design is selected, split the image into 3 parts using CSS clip regions: top-left = front neck design, top-right = back neck design, bottom = sleeve border
- **Sleeve border mirror logic**: Render left sleeve and mirror it horizontally for right sleeve
- **AI Realistic Preview button**: "Generate AI Preview" button that opens a modal showing model selection (4 models with skin tone/body shape options) and a simulated loading state, then displays a composite preview (canvas-based composite of mannequin + design image + selected model tone overlay)
- **Model selector**: 4 model cards (light skin, medium skin, dark skin, different body shape) shown in the AI preview modal
- **Design browser at bottom**: Horizontal swipeable slider at the very bottom showing current subcategory designs (already exists, keep and improve)
- **Neck shape updates embroidery placement**: When neck shape changes, adjust the frontNeck/backNeck zone default positions to match the selected neckline

### Modify
- **VirtualTrialRoomPage**: Replace generated image mannequin with inline SVG mannequin component; add neck shape selector and sleeve length selector UI sections; add AI Preview button and modal; improve the design image zone splitting to use CSS `objectPosition` to show the correct third of the image
- **Mannequin images**: Replace file-based mannequin images with an inline SVG `<BlouseMannequin>` component that accepts `blouseColor`, `neckShape`, `sleeveLength`, `view` props and renders accordingly
- **Bottom design slider**: Make it always visible and fixed at the bottom of the preview section

### Remove
- References to external mannequin image files (will use inline SVG instead)

## Implementation Plan
1. Create `BlouseMannequin.tsx` — inline SVG component that draws a boutique waist mannequin with Indian blouse, accepts color/neckShape/sleeveLength/view, renders 4 different body orientations (front, back, left, right) using SVG path transforms
2. Update `VirtualTrialRoomPage.tsx`:
   - Import and use `BlouseMannequin` instead of `<img src=MANNEQUIN_IMAGES>`
   - Add `neckShape` and `sleeveLength` state with selector UI (pill buttons)
   - Add neck shape → zone position mapping so embroidery auto-repositions
   - Improve zone image part splitting: use `objectPosition` to show the 1/3 slice cleanly
   - Add right sleeve mirror using CSS `scaleX(-1)` on the rightSleeve zone
   - Add `showAIPreviewModal` state and `selectedModel` state
   - Add "Generate AI Preview" button in the controls area
   - Add `AIPreviewModal` inline component: shows 4 model options, loading state, then composite preview
3. Keep all existing functionality: search, tabs, subcategories, blouse color, embroidery colors, fabric photo, Add to Stitching, Cancel
