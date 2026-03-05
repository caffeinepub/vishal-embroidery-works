/**
 * Compress an image file using Canvas API before uploading.
 * - Resizes images where longest side > 1500px to 1500px
 * - Re-encodes as JPEG at quality 0.82 (unless PNG with transparency)
 * - Skips compression for files already < 300KB
 * Returns a new File with the compressed content.
 */
export async function compressImage(file: File): Promise<File> {
  // Skip small files
  if (file.size < 300 * 1024) return file;

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const MAX_DIM = 1500;
      let { width, height } = img;

      // Resize if needed
      if (width > MAX_DIM || height > MAX_DIM) {
        if (width >= height) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file); // fallback
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      // Use PNG for transparency-capable PNGs, JPEG for everything else
      const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
      const quality = outputType === "image/jpeg" ? 0.82 : undefined;

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            resolve(file); // compression made it larger, use original
            return;
          }
          const ext = outputType === "image/jpeg" ? "jpg" : "png";
          const baseName = file.name.replace(/\.[^.]+$/, "");
          const compressed = new File([blob], `${baseName}.${ext}`, {
            type: outputType,
            lastModified: Date.now(),
          });
          resolve(compressed);
        },
        outputType,
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file); // fallback to original on error
    };

    img.src = objectUrl;
  });
}
