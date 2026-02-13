/**
 * AnimalGallery Component
 * 
 * Displays and manages up to 10 images per animal
 */

import { useState } from 'react';
import { Image as ImageIcon, Plus, X, Loader2 } from 'lucide-react';
import { uploadAnimalPhoto, deleteAnimalPhoto } from '../../services/animalPhotoService';
import type { EnclosureAnimal } from '../../types/careCalendar';

interface AnimalGalleryProps {
  animal: EnclosureAnimal;
  onUpdate: (images: string[]) => Promise<void>;
}

const MAX_IMAGES = 10;

export function AnimalGallery({ animal, onUpdate }: AnimalGalleryProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [deleteMode, setDeleteMode] = useState(false);

  const images = animal.images || [];
  const canAddMore = images.length < MAX_IMAGES;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !animal.userId) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }

    // Validate file size (max 10MB before compression)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image must be less than 10MB');
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);

      // Upload to Supabase Storage (images are automatically compressed to <300KB)
      const imageUrl = await uploadAnimalPhoto(animal.userId, file);

      // Update animal with new image URL
      const updatedImages = [...images, imageUrl];
      await onUpdate(updatedImages);

    } catch (error) {
      console.error('Failed to upload image:', error);
      setUploadError('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleRemoveImage = async (imageUrl: string) => {
    try {
      // Delete from storage first
      await deleteAnimalPhoto(imageUrl);
      
      // Then remove from database
      const updatedImages = images.filter(url => url !== imageUrl);
      await onUpdate(updatedImages);
      
      if (selectedImage === imageUrl) {
        setSelectedImage(null);
      }
    } catch (error) {
      console.error('Failed to remove image:', error);
      setUploadError('Failed to remove image. Please try again.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Gallery
        </h3>
        <div className="flex items-center gap-3">
          {images.length > 0 && (
            <button
              onClick={() => setDeleteMode(!deleteMode)}
              className={`text-sm font-medium transition-colors ${
                deleteMode
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {deleteMode ? 'Done' : 'Delete'}
            </button>
          )}
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {images.length} / {MAX_IMAGES}
          </span>
        </div>
      </div>

      {/* Error message */}
      {uploadError && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
          {uploadError}
        </div>
      )}

      {/* Image grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {/* Existing images */}
        {images.map((imageUrl, index) => (
          <div
            key={imageUrl}
            className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 group cursor-pointer"
            onClick={() => !deleteMode && setSelectedImage(imageUrl)}
          >
            <img
              src={imageUrl}
              alt={`${animal.name || 'Animal'} photo ${index + 1}`}
              className="w-full h-full object-cover"
            />
            {/* Remove button - only visible in delete mode */}
            {deleteMode && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage(imageUrl);
                }}
                className="absolute top-1 right-1 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors shadow-lg"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}

        {/* Add new image button */}
        {canAddMore && (
          <label className="relative aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-emerald-500 dark:hover:border-emerald-500 cursor-pointer flex flex-col items-center justify-center gap-2 transition-colors group">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
            />
            {uploading ? (
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            ) : (
              <>
                <Plus className="w-8 h-8 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                <span className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Add Photo
                </span>
              </>
            )}
          </label>
        )}
      </div>

      {/* Empty state */}
      {images.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No images yet</p>
          <p className="text-xs mt-1">Add photos to document growth and memories</p>
        </div>
      )}

      {/* Fullscreen image modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <img
            src={selectedImage}
            alt={animal.name || 'Animal'}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
