import { supabase } from '../lib/supabase';

const ANIMAL_PHOTO_BUCKET = 'animal-photos';
const MAX_FILE_SIZE_KB = 300;
const MAX_DIMENSION = 2048;

async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
    };

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { alpha: false });

        if (!ctx) {
          cleanup();
          reject(new Error('Failed to get canvas context'));
          return;
        }

        let width = img.width;
        let height = img.height;

        const maxDim = width > 1920 || height > 1920 ? 1600 : MAX_DIMENSION;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = (height / width) * maxDim;
            width = maxDim;
          } else {
            width = (width / height) * maxDim;
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'medium';
        ctx.drawImage(img, 0, 0, width, height);

        let minQuality = 0.3;
        let maxQuality = 0.85;
        let attempts = 0;
        const maxAttempts = 4;

        const tryCompress = (quality: number) => {
          attempts++;

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                cleanup();
                reject(new Error('Failed to compress image'));
                return;
              }

              const sizeKB = blob.size / 1024;

              if (sizeKB <= MAX_FILE_SIZE_KB || attempts >= maxAttempts || maxQuality - minQuality < 0.05) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                cleanup();
                resolve(compressedFile);
                return;
              }

              if (sizeKB > MAX_FILE_SIZE_KB) {
                maxQuality = quality;
                tryCompress((minQuality + maxQuality) / 2);
              } else {
                minQuality = quality;
                tryCompress((minQuality + maxQuality) / 2);
              }
            },
            'image/jpeg',
            quality,
          );
        };

        tryCompress(0.65);
      } catch (error) {
        cleanup();
        reject(error instanceof Error ? error : new Error('Failed to process image'));
      }
    };

    img.onerror = () => {
      cleanup();
      reject(new Error('Failed to load image'));
    };

    img.src = objectUrl;
  });
}

export async function uploadEnclosurePhoto(userId: string, file: File): Promise<string> {
  let uploadFile: File;
  try {
    uploadFile = await compressImage(file);
  } catch (error) {
    console.warn('Image compression failed, uploading original file:', error);
    uploadFile = file;
  }

  const filename = `enclosures/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;

  const { error } = await supabase.storage
    .from(ANIMAL_PHOTO_BUCKET)
    .upload(filename, uploadFile, {
      cacheControl: '3600',
      upsert: false,
      contentType: 'image/jpeg',
    });

  if (error) {
    console.error('Failed to upload enclosure photo:', error);
    throw error;
  }

  const { data } = supabase.storage.from(ANIMAL_PHOTO_BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}

export async function deleteEnclosurePhoto(imageUrl: string): Promise<void> {
  try {
    const urlParts = imageUrl.split(`${ANIMAL_PHOTO_BUCKET}/`);

    if (urlParts.length < 2) {
      console.error('Invalid image URL format:', imageUrl);
      throw new Error(`Invalid image URL format: ${imageUrl}`);
    }

    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from(ANIMAL_PHOTO_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error('Failed to delete enclosure photo:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error deleting photo:', error);
    throw error;
  }
}
