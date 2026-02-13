import { supabase } from '../lib/supabase';

const ANIMAL_PHOTO_BUCKET = 'animal-photos';
const MAX_FILE_SIZE_KB = 300;
const MAX_DIMENSION = 2048; // Max width or height in pixels

/**
 * Compress an image file to be under 300KB - Optimized for mobile performance
 */
async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { alpha: false }); // Disable alpha for faster processing
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Calculate new dimensions (max 2048px on longest side)
        let width = img.width;
        let height = img.height;
        
        // More aggressive resize for very large images (phone cameras)
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
        
        // Use faster image smoothing for mobile
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'medium';
        ctx.drawImage(img, 0, 0, width, height);

        // Binary search for optimal quality (much faster than linear)
        let minQuality = 0.3;
        let maxQuality = 0.85;
        let attempts = 0;
        const maxAttempts = 4; // Limit attempts for speed

        const tryCompress = (quality: number) => {
          attempts++;
          
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }

              const sizeKB = blob.size / 1024;

              // If under target or we've tried enough, accept it
              if (sizeKB <= MAX_FILE_SIZE_KB || attempts >= maxAttempts || maxQuality - minQuality < 0.05) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else if (sizeKB > MAX_FILE_SIZE_KB) {
                // Too large, try lower quality (binary search)
                maxQuality = quality;
                tryCompress((minQuality + maxQuality) / 2);
              } else {
                // Under target but try to get closer (binary search)
                minQuality = quality;
                tryCompress((minQuality + maxQuality) / 2);
              }
            },
            'image/jpeg',
            quality
          );
        };

        // Start with moderate quality
        tryCompress(0.65);
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

export async function uploadAnimalPhoto(userId: string, file: File): Promise<string> {
  // Compress image before uploading
  const compressedFile = await compressImage(file);
  
  const filename = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;

  const { error } = await supabase.storage
    .from(ANIMAL_PHOTO_BUCKET)
    .upload(filename, compressedFile, {
      cacheControl: '3600',
      upsert: false,
      contentType: 'image/jpeg'
    });

  if (error) {
    console.error('Failed to upload animal photo:', error);
    throw error;
  }

  const { data } = supabase.storage.from(ANIMAL_PHOTO_BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}

/**
 * Delete an animal photo from storage
 */
export async function deleteAnimalPhoto(imageUrl: string): Promise<void> {
  try {
    // Extract the file path from the public URL
    // URL format: https://{project}.supabase.co/storage/v1/object/public/animal-photos/{userId}/{filename}
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
      console.error('Failed to delete animal photo:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error deleting photo:', error);
    throw error;
  }
}
