import { Toast, ToastType } from './Toast';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  actionLabel?: string;
  actionHref?: string;
  actionOnClick?: () => void;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
  secondaryActionOnClick?: () => void;
}

interface ToastContainerProps {
  readonly toasts: ToastItem[];
  readonly onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          actionLabel={toast.actionLabel}
          actionHref={toast.actionHref}
          actionOnClick={toast.actionOnClick}
          secondaryActionLabel={toast.secondaryActionLabel}
          secondaryActionHref={toast.secondaryActionHref}
          secondaryActionOnClick={toast.secondaryActionOnClick}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
}
