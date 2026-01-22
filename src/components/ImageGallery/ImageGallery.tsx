import { useState } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

interface Image {
  url: string;
  caption?: string;
}

interface ImageGalleryProps {
  images: Image[];
  title?: string;
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  if (!images || images.length === 0) {
    return null;
  }

  const current = images[selectedIndex];
  const hasPrev = selectedIndex > 0;
  const hasNext = selectedIndex < images.length - 1;

  // Convert images to lightbox format
  const lightboxSlides = images.map(img => ({
    src: img.url,
    alt: img.caption || 'Gallery image',
    title: img.caption,
  }));

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      )}
      
      {/* Main Image Container */}
      <div className="relative bg-black rounded-xl overflow-hidden shadow-lg">
        <div 
          className="w-full flex items-center justify-center cursor-pointer"
          onClick={() => setIsLightboxOpen(true)}
        >
          <img 
            src={current.url} 
            alt={current.caption || 'Gallery image'}
            className="w-full h-auto hover:opacity-90 transition-opacity"
            loading="eager"
          />
        </div>

        {/* Expand Icon */}
        <button
          onClick={() => setIsLightboxOpen(true)}
          className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70 transition"
          aria-label="Open fullscreen"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>

        {/* Navigation Overlay */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIndex(Math.max(0, selectedIndex - 1));
              }}
              disabled={!hasPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              aria-label="Previous image"
            >
              <span className="text-2xl font-light">‹</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIndex(Math.min(images.length - 1, selectedIndex + 1));
              }}
              disabled={!hasNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              aria-label="Next image"
            >
              <span className="text-2xl font-light">›</span>
            </button>

            {/* Counter */}
            <div className="absolute bottom-4 left-4 px-3 py-1 rounded-full bg-black/50 text-white text-sm font-medium">
              {selectedIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {/* Caption */}
      {current.caption && (
        <p className="mt-3 text-gray-700 dark:text-gray-300 text-center">{current.caption}</p>
      )}

      {/* Lightbox */}
      <Lightbox
        open={isLightboxOpen}
        close={() => setIsLightboxOpen(false)}
        slides={lightboxSlides}
        index={selectedIndex}
        on={{
          view: ({ index }) => setSelectedIndex(index),
        }}
      />
    </div>
  );
}
