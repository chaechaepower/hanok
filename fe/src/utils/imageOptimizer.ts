import imageCompression from 'browser-image-compression';

const SIZE_THRESHOLD_MB = 10;
const MAX_WIDTH_OR_HEIGHT = 1920;
const WEBP_QUALITY = 0.8;

export async function optimizeImage(file: File): Promise<File> {
  try {
    const needsResize = file.size >= SIZE_THRESHOLD_MB * 1024 * 1024;

    const options = {
      fileType: 'image/webp' as const,
      initialQuality: WEBP_QUALITY,
      useWebWorker: true,
      maxSizeMB: SIZE_THRESHOLD_MB,
      ...(needsResize && {
        maxWidthOrHeight: MAX_WIDTH_OR_HEIGHT,
      }),
    };

    const compressed = await imageCompression(file, options);

    if (compressed.size > file.size) {
      return file;
    }

    const baseName = file.name.replace(/\.[^.]+$/, '') || file.name;
    return new File([compressed], `${baseName}.webp`, { type: 'image/webp' });
  } catch {
    return file;
  }
}

export async function optimizeImages(files: File[]): Promise<File[]> {
  return Promise.all(files.map(optimizeImage));
}
