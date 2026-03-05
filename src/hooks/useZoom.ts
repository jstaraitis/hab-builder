import { useState, useEffect, useCallback } from 'react';

interface UseZoomReturn {
  zoom: number;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleResetZoom: () => void;
}

/**
 * Hook to manage zoom level with localStorage persistence
 * and cross-component synchronization via CustomEvents.
 */
export function useZoom(): UseZoomReturn {
  const [zoom, setZoom] = useState<number>(() => {
    const savedZoom = localStorage.getItem('zoom-level');
    return savedZoom ? Number.parseFloat(savedZoom) : 100;
  });

  // Persist zoom to localStorage and dispatch event
  useEffect(() => {
    localStorage.setItem('zoom-level', zoom.toString());
    globalThis.dispatchEvent(new CustomEvent('zoom-change', { detail: zoom }));
  }, [zoom]);

  // Listen for zoom changes from other components (e.g., MobileNav)
  useEffect(() => {
    const handleZoomChange = (e: Event) => {
      const customEvent = e as CustomEvent<number>;
      setZoom(customEvent.detail);
    };
    globalThis.addEventListener('zoom-change', handleZoomChange);
    return () => globalThis.removeEventListener('zoom-change', handleZoomChange);
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 10, 150));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 10, 75));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoom(100);
  }, []);

  return { zoom, handleZoomIn, handleZoomOut, handleResetZoom };
}
