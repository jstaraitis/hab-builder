import { useEffect } from 'react';

export function useTheme() {
  useEffect(() => {
    // Always apply dark mode
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }, []);

  return { theme: 'dark' as const };
}
