import { useState, useRef, useEffect } from 'react';

interface UseHeaderScrollOptions {
  threshold?: number; // Distance before header can hide (px)
  hideDelay?: number; // Milliseconds before hiding while scrolling
}

/**
 * Custom hook to manage header visibility based on scroll direction
 * Can attach to window or a specific ref element
 * 
 * @param options Configuration options
 * @returns { isVisible, scrollRef } - visibility state and ref to attach to scrollable container
 */
export function useHeaderScroll(options: UseHeaderScrollOptions = {}) {
  const { threshold = 50, hideDelay = 0 } = options;
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const hideTimeoutRef = useRef<NodeJS.Timeout>();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = (target: Element | Window) => {
      const currentScrollY = target instanceof Window 
        ? window.scrollY 
        : target.scrollTop;

      // Always show when near top
      if (currentScrollY < threshold) {
        setIsVisible(true);
        return;
      }

      // Clear any pending timeout
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }

      // Hide when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY.current) {
        // Scrolling down
        hideTimeoutRef.current = setTimeout(() => {
          setIsVisible(false);
        }, hideDelay);
      } else {
        // Scrolling up
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    // Attach to window or specific ref
    if (scrollRef.current) {
      scrollRef.current.addEventListener('scroll', () => handleScroll(scrollRef.current!));
    } else {
      window.addEventListener('scroll', () => handleScroll(window));
    }

    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      if (scrollRef.current) {
        scrollRef.current.removeEventListener('scroll', () => handleScroll(scrollRef.current!));
      } else {
        window.removeEventListener('scroll', () => handleScroll(window));
      }
    };
  }, [threshold, hideDelay]);

  return { isVisible, scrollRef };
}
