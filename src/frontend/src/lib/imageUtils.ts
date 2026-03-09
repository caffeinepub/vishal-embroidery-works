const CLOUDINARY_CLOUD_NAME = "doxbxqcef";
const CLOUDINARY_UPLOAD_PRESET = "Embroidery_works";

export async function uploadToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData },
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Cloudinary upload failed: ${response.status} ${err}`);
  }

  const data = (await response.json()) as { secure_url: string };
  return data.secure_url;
}

/**
 * Convert a Cloudinary URL to an optimized version with auto format/quality.
 * Falls back to original URL if not a Cloudinary URL.
 */
export function getOptimizedImageUrl(url: string, width = 800): string {
  if (!url || !url.includes("cloudinary.com")) return url;
  // Insert transformation segment after /upload/
  return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width}/`);
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function getImageSrc(images: string[]): string {
  if (!images || images.length === 0) return "";
  return images[0];
}
