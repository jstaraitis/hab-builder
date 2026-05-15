import { useEffect, useState } from 'react';
import { X, AlertTriangle, AlertCircle, Info, Wrench } from 'lucide-react';
import { SystemNotification, systemNotificationService } from '../../services/systemNotificationService';

export function SystemNotificationBanner() {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const notifications = await systemNotificationService.getActiveNotifications();
      setNotifications(notifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set([...prev, id]));
  };

  const visibleNotifications = notifications.filter(n => !dismissedIds.has(n.id));

  if (loading || visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {visibleNotifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onDismiss={() => handleDismiss(notification.id)}
        />
      ))}
    </div>
  );
}

interface NotificationItemProps {
  notification: SystemNotification;
  onDismiss: () => void;
}

function NotificationItem({ notification, onDismiss }: NotificationItemProps) {
  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200';
      case 'high':
        return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-900 dark:text-orange-200';
      case 'medium':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-200';
    }
  };

  const getIcon = (type: string) => {
    const iconClass = 'w-5 h-5 flex-shrink-0';
    switch (type) {
      case 'outage':
        return <AlertTriangle className={iconClass} />;
      case 'maintenance':
        return <Wrench className={iconClass} />;
      case 'warning':
        return <AlertCircle className={iconClass} />;
      case 'info':
      default:
        return <Info className={iconClass} />;
    }
  };

  return (
    <div className={`border rounded-lg p-4 flex items-start gap-3 ${getSeverityStyles(notification.severity)}`}>
      <div className="flex-shrink-0 mt-0.5">
        {getIcon(notification.type)}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm mb-1">{notification.title}</h3>
        <p className="text-sm opacity-90">{notification.message}</p>
        {notification.endsAt && (
          <p className="text-xs opacity-75 mt-2">
            Expected resolution: {new Date(notification.endsAt).toLocaleString()}
          </p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="flex-shrink-0 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
