import { useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';

/**
 * Hook to detect and prompt users when a new PWA version is available
 * Integrates with the Toast context to show update notifications
 */
export function usePWAUpdate() {
  const toast = useToast();

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    let updateCheckInterval: NodeJS.Timeout;

    const checkForUpdate = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        
        // Check for updates
        await registration.update();
      } catch (error) {
        console.error('Failed to check for PWA updates:', error);
      }
    };

    // Listen for a new service worker being installed
    navigator.serviceWorker.ready.then((registration) => {
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          // New service worker installed and waiting to activate
          if (
            newWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            // Show update prompt to user
            toast.info(
              'A new version is available! Refresh to update.',
              0 // No auto-dismiss, user must dismiss or refresh
            );

            // Listen for messages from service worker
            navigator.serviceWorker.addEventListener('message', (event) => {
              if (event.data.type === 'SKIP_WAITING_SUCCESS') {
                // Clear the toast and refresh
                window.location.reload();
              }
            });

            // Add click handler to refresh button if needed
            // (This would be in your Toast component to handle custom actions)
          }
        });
      });

      // Check for updates immediately
      registration.update().catch(() => {
        // Silent fail - update check failed, user will get update on next visit
      });
    });

    // Check for updates every 30 minutes
    updateCheckInterval = setInterval(checkForUpdate, 30 * 60 * 1000);

    return () => {
      clearInterval(updateCheckInterval);
    };
  }, [toast]);
}
