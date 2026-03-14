import { uploadToCloudinary } from "./imageUtils";

// Template images stored in public/assets/generated/
const TEMPLATES = {
  front: "/assets/generated/blouse_front_model.dim_600x800.jpg",
  back: "/assets/generated/blouse_back_model.dim_600x800.jpg",
  side: "/assets/generated/blouse_side_model.dim_600x800.jpg",
};

// Embroidery overlay positions as % of canvas (x, y, width, height)
const OVERLAY_ZONES = {
  front: { x: 0.1, y: 0.08, w: 0.8, h: 0.25 },
  back: { x: 0.1, y: 0.08, w: 0.8, h: 0.25 },
  side: { x: 0.05, y: 0.3, w: 0.55, h: 0.18 },
};

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function compositeImage(
  templateSrc: string,
  embroiderySrc: string,
  zone: { x: number; y: number; w: number; h: number },
): Promise<Blob> {
  const [template, embroidery] = await Promise.all([
    loadImage(templateSrc),
    loadImage(embroiderySrc),
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = template.naturalWidth;
  canvas.height = template.naturalHeight;
  const ctx = canvas.getContext("2d")!;

  // Draw template
  ctx.drawImage(template, 0, 0);

  const ex = zone.x * canvas.width;
  const ey = zone.y * canvas.height;
  const ew = zone.w * canvas.width;
  const eh = zone.h * canvas.height;

  ctx.save();

  // Light emboss: draw embroidery slightly offset with low opacity for depth
  ctx.globalAlpha = 0.12;
  ctx.globalCompositeOperation = "source-over";
  ctx.drawImage(embroidery, ex + 1, ey + 1, ew, eh);

  // Draw shadow
  ctx.globalAlpha = 0.18;
  ctx.shadowColor = "rgba(0,0,0,0.4)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  ctx.drawImage(embroidery, ex, ey, ew, eh);

  // Draw embroidery with multiply blend
  ctx.globalAlpha = 0.95;
  ctx.globalCompositeOperation = "multiply";
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.drawImage(embroidery, ex, ey, ew, eh);

  ctx.restore();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas to blob failed"));
      },
      "image/jpeg",
      0.92,
    );
  });
}

export interface GeneratedBlouseImages {
  frontImage: string;
  backImage: string;
  sideImage: string;
}

export async function generateBlousePreviews(
  frontEmbroideryUrl: string,
  backEmbroideryUrl: string,
  sleeveEmbroideryUrl: string,
  onProgress?: (step: number, total: number) => void,
): Promise<GeneratedBlouseImages> {
  onProgress?.(0, 3);

  const frontBlob = await compositeImage(
    TEMPLATES.front,
    frontEmbroideryUrl,
    OVERLAY_ZONES.front,
  );
  onProgress?.(1, 3);

  const backBlob = await compositeImage(
    TEMPLATES.back,
    backEmbroideryUrl,
    OVERLAY_ZONES.back,
  );
  onProgress?.(2, 3);

  const sideBlob = await compositeImage(
    TEMPLATES.side,
    sleeveEmbroideryUrl,
    OVERLAY_ZONES.side,
  );
  onProgress?.(3, 3);

  // Upload all 3 to Cloudinary in parallel
  const [frontImage, backImage, sideImage] = await Promise.all([
    uploadToCloudinary(
      new File([frontBlob], "front_result.jpg", { type: "image/jpeg" }),
    ),
    uploadToCloudinary(
      new File([backBlob], "back_result.jpg", { type: "image/jpeg" }),
    ),
    uploadToCloudinary(
      new File([sideBlob], "side_result.jpg", { type: "image/jpeg" }),
    ),
  ]);

  return { frontImage, backImage, sideImage };
}
