import { useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';

let updateToastShown = false;

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

    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SKIP_WAITING_SUCCESS') {
        globalThis.location.reload();
      }
    };

    const showUpdateToast = (worker: ServiceWorker) => {
      if (updateToastShown) {
        return;
      }

      updateToastShown = true;
      toast.info('A new version is available.', 0, {
        actionLabel: 'Reload now',
        actionOnClick: () => {
          worker.postMessage({ type: 'SKIP_WAITING' });
        },
        secondaryActionLabel: "See What's New",
        secondaryActionHref: '/whats-new',
      });
    };

    const handleWorkerStateChange = (worker: ServiceWorker) => {
      if (worker.state !== 'installed') {
        return;
      }

      if (!navigator.serviceWorker.controller) {
        return;
      }

      showUpdateToast(worker);
    };

    const handleUpdateFound = (registration: ServiceWorkerRegistration) => {
      const newWorker = registration.installing;
      if (!newWorker) {
        return;
      }

      newWorker.addEventListener('statechange', () => handleWorkerStateChange(newWorker));
    };

    const checkForUpdate = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        
        // Check for updates
        await registration.update();
      } catch (error) {
        console.error('Failed to check for PWA updates:', error);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

    // Listen for a new service worker being installed
    navigator.serviceWorker.ready.then((registration) => {
      registration.addEventListener('updatefound', () => handleUpdateFound(registration));

      // Check for updates immediately
      registration.update().catch(() => {
        // Silent fail - update check failed, user will get update on next visit
      });
    });

    // Check for updates every 30 minutes
    updateCheckInterval = setInterval(checkForUpdate, 30 * 60 * 1000);

    return () => {
      clearInterval(updateCheckInterval);
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, [toast]);
}
