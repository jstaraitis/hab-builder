import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  readonly message: string;
  readonly type?: ToastType;
  readonly duration?: number;
  readonly actionLabel?: string;
  readonly actionHref?: string;
  readonly actionOnClick?: () => void;
  readonly secondaryActionLabel?: string;
  readonly secondaryActionHref?: string;
  readonly secondaryActionOnClick?: () => void;
  readonly onClose: () => void;
}

export function Toast({
  message,
  type = 'info',
  duration = 4000,
  actionLabel,
  actionHref,
  actionOnClick,
  secondaryActionLabel,
  secondaryActionHref,
  secondaryActionOnClick,
  onClose,
}: ToastProps) {
  useEffect(() => {
    if (duration <= 0) {
      return;
    }

    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle,
  };

  const colors = {
    success: 'bg-emerald-600 dark:bg-emerald-700',
    error: 'bg-red-600 dark:bg-red-700',
    info: 'bg-blue-600 dark:bg-blue-700',
    warning: 'bg-amber-600 dark:bg-amber-700',
  };

  const Icon = icons[type];

  return (
    <div 
      className={`${colors[type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] max-w-md animate-slide-up`}
      role="alert"
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{message}</p>
        {(actionLabel || secondaryActionLabel) && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {actionLabel && actionHref && (
              <Link
                to={actionHref}
                onClick={onClose}
                className="text-xs font-semibold underline underline-offset-2 hover:opacity-90"
              >
                {actionLabel}
              </Link>
            )}
            {actionLabel && actionOnClick && !actionHref && (
              <button
                type="button"
                onClick={() => {
                  actionOnClick();
                  onClose();
                }}
                className="text-xs font-semibold underline underline-offset-2 hover:opacity-90"
              >
                {actionLabel}
              </button>
            )}
            {secondaryActionLabel && secondaryActionHref && (
              <Link
                to={secondaryActionHref}
                onClick={onClose}
                className="text-xs font-semibold underline underline-offset-2 hover:opacity-90"
              >
                {secondaryActionLabel}
              </Link>
            )}
            {secondaryActionLabel && secondaryActionOnClick && !secondaryActionHref && (
              <button
                type="button"
                onClick={() => {
                  secondaryActionOnClick();
                  onClose();
                }}
                className="text-xs font-semibold underline underline-offset-2 hover:opacity-90"
              >
                {secondaryActionLabel}
              </button>
            )}
          </div>
        )}
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 hover:bg-white/20 rounded p-1 transition-colors"
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
