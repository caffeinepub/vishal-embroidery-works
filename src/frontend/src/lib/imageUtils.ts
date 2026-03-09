const CLOUDINARY_CLOUD_NAME = "doxbxqcef";
const CLOUDINARY_UPLOAD_PRESET = "Embroidery_works";

/**
 * Upload a single File to Cloudinary unsigned upload endpoint.
 * Returns the secure HTTPS URL of the uploaded image.
 */
export async function uploadToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Cloudinary upload failed: ${response.status} ${err}`);
  }

  const data = (await response.json()) as { secure_url: string };
  return data.secure_url;
}

/**
 * Legacy base64 helper — kept for reading existing base64 images stored
 * before the Cloudinary migration. NOT used for new uploads.
 */
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
