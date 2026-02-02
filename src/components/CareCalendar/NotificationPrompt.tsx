import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { notificationService } from '../../services/notificationService';

export function NotificationPrompt() {
  const [show, setShow] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if notifications are supported
    if (!notificationService.isSupported()) return;

    const currentPermission = notificationService.getPermissionStatus();
    setPermission(currentPermission);

    // Show prompt if permission is default (not yet asked)
    const hasSeenPrompt = localStorage.getItem('notification-prompt-seen');
    if (currentPermission === 'default' && !hasSeenPrompt) {
      // Delay showing prompt to not overwhelm user immediately
      setTimeout(() => setShow(true), 5000);
    }
  }, []);

  const handleEnable = async () => {
    setLoading(true);
    try {
      await notificationService.subscribe();
      setPermission('granted');
      setShow(false);
      localStorage.setItem('notification-prompt-seen', 'true');
    } catch (error) {
      console.error('Failed to enable notifications:', error);
      alert('Failed to enable notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('notification-prompt-seen', 'true');
  };

  if (!show || permission !== 'default') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border-2 border-emerald-500 dark:border-emerald-600 p-4 w-full max-w-md relative animate-scale-up">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          aria-label="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
            <Bell className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              Enable Task Reminders
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Get notified when your care tasks are due so you never miss feeding, misting, or health checks.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleEnable}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors text-sm"
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
