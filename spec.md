# Vishal Embroidery Works

## Current State
- BridalPage.tsx has broken emoji rendering — raw unicode escape sequences (`\ud83d\udc51`) appear as literal text in JSX
- VirtualTrialRoomPage.tsx references `/assets/generated/mannequin-*.png` image files that do not exist, so the mannequin preview is broken
- BlouseMannequin.tsx is a working SVG component (supports front/back/left/right views, blouse color, neck shapes, sleeve lengths) but is NOT used in VirtualTrialRoomPage
- DesignCard.tsx has "View Design" and "Add to Trial Room" action buttons

## Requested Changes (Diff)

### Add
- Nothing new

### Modify
1. **BridalPage.tsx** — Replace all raw unicode escape sequences (`\ud83d\udc51`, `\ud83d\udca1`, `\u2728`) with actual emoji literals (👑, 💡, ✨) or remove emojis and use text/icons instead
2. **VirtualTrialRoomPage.tsx** — Replace broken `<img>` mannequin images with the `BlouseMannequin` SVG component. Import and use `BlouseMannequin` for the preview section. Keep blouseColor state wired to the component. Wire view switcher (front/back/left/right) to the component's `view` prop. Use default neckShape="u-neck" and sleeveLength="short".
3. **DesignCard.tsx** — Replace "Add to Trial Room" button label with "Add to Stitching" and wire it to the stitching order action (keep the same `onAddToTrialRoom` prop for now, just update the label). Actually — change the button to show "Add to Stitching Order" and keep the existing callback.

### Remove
- Nothing to remove

## Implementation Plan
1. Fix BridalPage.tsx emoji encoding — replace escaped sequences with literal emoji characters
2. Update VirtualTrialRoomPage.tsx to import and render BlouseMannequin instead of mannequin img tags, keeping all existing state and controls
3. Update DesignCard action button label from "Add to Trial Room" to "Add to Stitching Order"
4. Validate build
