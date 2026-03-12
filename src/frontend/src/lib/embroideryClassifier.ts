export type EmbroideryType =
  | "frontEmbroidery"
  | "backEmbroidery"
  | "sleeveEmbroidery";

/**
 * Classify an embroidery image based on aspect ratio and pixel symmetry.
 * - ratio > 2.6 → sleeveEmbroidery (long horizontal border)
 * - ratio between 1.5–2.6 → neck embroidery; check symmetry:
 *   - symmetric → backEmbroidery (full U)
 *   - asymmetric → frontEmbroidery (single side curve)
 * - Default fallback: frontEmbroidery
 */
export function classifyEmbroideryImage(file: File): Promise<EmbroideryType> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const ratio = img.naturalWidth / img.naturalHeight;
      URL.revokeObjectURL(url);

      if (ratio > 2.6) {
        resolve("sleeveEmbroidery");
        return;
      }

      // For neck embroidery, check pixel symmetry using canvas
      try {
        const canvas = document.createElement("canvas");
        const scale = 100 / img.naturalWidth;
        canvas.width = Math.round(img.naturalWidth * scale);
        canvas.height = Math.round(img.naturalHeight * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve("frontEmbroidery");
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const w = canvas.width;
        const h = canvas.height;

        // Count dark pixels in left vs right half
        let leftDark = 0;
        let rightDark = 0;
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4;
            const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const alpha = data[i + 3];
            if (alpha > 30 && brightness < 180) {
              if (x < w / 2) leftDark++;
              else rightDark++;
            }
          }
        }
        const total = leftDark + rightDark;
        if (total === 0) {
          resolve("backEmbroidery");
          return;
        }
        const leftRatio = leftDark / total;
        // If both halves have significant pixels (symmetric) → back neck
        const symmetry = Math.min(leftRatio, 1 - leftRatio);
        if (symmetry > 0.3) {
          resolve("backEmbroidery");
        } else {
          resolve("frontEmbroidery");
        }
      } catch {
        resolve("frontEmbroidery");
      }
    };
    img.onerror = () => resolve("frontEmbroidery");
    img.src = url;
  });
}
