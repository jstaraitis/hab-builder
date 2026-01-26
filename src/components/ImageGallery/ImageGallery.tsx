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

  // Convert images to lightbox format
  const lightboxSlides = images.map(img => ({
    src: img.url,
    alt: img.caption || 'Gallery image',
    title: img.caption,
  }));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      )}
      
      {/* Image Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
        {images.map((image, index) => (
          <div
            key={index}
            className="relative overflow-hidden rounded-lg lg:rounded-xl bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 transition-all hover:shadow-lg cursor-pointer group"
            onClick={() => {
              setSelectedIndex(index);
              setIsLightboxOpen(true);
            }}
          >
            <div className="aspect-video w-full overflow-hidden">
              <img 
                src={image.url} 
                alt={image.caption || 'Gallery image'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </div>
            
            {/* Expand Icon Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity p-2 lg:p-2.5 rounded-full bg-purple-500 text-white shadow-lg">
                <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </div>
            </div>

            {/* Caption */}
            {image.caption && (
              <div className="p-2 lg:p-3 bg-white dark:bg-gray-700">
                <p className="text-xs lg:text-sm text-gray-700 dark:text-gray-300 text-center line-clamp-2">{image.caption}</p>
              </div>
            )}
          </div>
        ))}
      </div>

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
