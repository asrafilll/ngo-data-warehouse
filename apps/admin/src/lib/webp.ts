// Client-side image compression + WebP conversion (PRD §6): every photo is downscaled
// and re-encoded to WebP in the browser before the presigned S3 upload.
const MAX_DIMENSION = 1600;
const QUALITY = 0.8;

export async function toWebp(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak tersedia di browser ini.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Konversi WebP gagal."))),
      "image/webp",
      QUALITY,
    );
  });
}
