import { useState, useCallback } from 'react';
import { ToastType } from '../components/Toast/Toast';
import { ToastItem } from '../components/Toast/ToastContainer';

interface ToastOptions {
  actionLabel?: string;
  actionHref?: string;
  actionOnClick?: () => void;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
  secondaryActionOnClick?: () => void;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 4000, options?: ToastOptions) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastItem = {
      id,
      message,
      type,
      duration,
      actionLabel: options?.actionLabel,
      actionHref: options?.actionHref,
      actionOnClick: options?.actionOnClick,
      secondaryActionLabel: options?.secondaryActionLabel,
      secondaryActionHref: options?.secondaryActionHref,
      secondaryActionOnClick: options?.secondaryActionOnClick,
    };
    
    setToasts((prev) => [...prev, newToast]);
    
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback((message: string, duration?: number, options?: ToastOptions) => {
    return showToast(message, 'success', duration, options);
  }, [showToast]);

  const error = useCallback((message: string, duration?: number, options?: ToastOptions) => {
    return showToast(message, 'error', duration, options);
  }, [showToast]);

  const info = useCallback((message: string, duration?: number, options?: ToastOptions) => {
    return showToast(message, 'info', duration, options);
  }, [showToast]);

  const warning = useCallback((message: string, duration?: number, options?: ToastOptions) => {
    return showToast(message, 'warning', duration, options);
  }, [showToast]);

  return {
    toasts,
    showToast,
    removeToast,
    success,
    error,
    info,
    warning,
  };
}
