export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function filesToBase64Batch(
  files: File[],
  batchSize = 10,
): Promise<string[]> {
  const results: string[] = [];
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fileToBase64));
    results.push(...batchResults);
  }
  return results;
}

export function getImageSrc(images: string[]): string {
  if (!images || images.length === 0) return "";
  return images[0];
}
