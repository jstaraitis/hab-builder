import { useState, useEffect } from 'react';
import { X, Lightbulb } from 'lucide-react';
import { notificationService } from '../../services/notificationService';
import { useToast } from '../../contexts/ToastContext';

interface NotificationPromptProps {
  show: boolean;
  onClose: () => void;
}

export function NotificationPrompt({ show, onClose }: NotificationPromptProps) {
  const { success, error } = useToast();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!notificationService.isSupported()) return;
    
    const checkStatus = async () => {
      const currentPermission = notificationService.getPermissionStatus();
      const subscribed = await notificationService.isSubscribed();
      console.log('[NotificationPrompt] Status:', {
        permission: currentPermission,
        isSubscribed: subscribed,
        show
      });
      setPermission(currentPermission);
      setIsSubscribed(subscribed);
    };
    
    checkStatus();
  }, [show]);

  const handleEnable = async () => {
    setLoading(true);
    try {
      await notificationService.subscribe();
      setPermission('granted');
      setIsSubscribed(true);
      onClose();
      localStorage.setItem('notification-prompt-seen', 'true');
      success('🔔 Notifications enabled! You\'ll receive reminders for your care tasks.', 5000);
    } catch (err) {
      console.error('Failed to enable notifications:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to enable notifications';
      error(errorMessage, 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    onClose();
    sessionStorage.setItem('notification-prompt-dismissed', 'true');
  };

  // Show if permission not granted OR if granted but not subscribed (e.g., after PWA reinstall)
  if (!show || (permission === 'granted' && isSubscribed)) {
    console.log('[NotificationPrompt] Not showing:', { show, permission, isSubscribed });
    return null;
  }

  console.log('[NotificationPrompt] Showing prompt');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border-2 border-blue-500 dark:border-blue-600 p-4 w-full max-w-md relative animate-scale-up">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          aria-label="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Lightbulb className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              {permission === 'granted' ? 'Reconnect notifications' : 'Enable notifications to get reminders'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {permission === 'granted' 
                ? 'Your notifications need to be reconnected. This may happen after reinstalling the app or updating your browser.'
                : 'You enabled a notification for this task, but push notifications aren\'t set up yet. Enable now to receive reminders when your care tasks are due.'}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleEnable}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors text-sm"
          >
            {loading ? 'Enabling...' : 'Enable Notifications'}
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors text-sm"
          >
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
}
