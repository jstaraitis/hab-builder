import { createContext, useContext, ReactNode } from 'react';
import { useToast as useToastHook } from '../hooks/useToast';
import { ToastType } from '../components/Toast/Toast';
import { ToastContainer } from '../components/Toast/ToastContainer';

interface ToastOptions {
  actionLabel?: string;
  actionHref?: string;
  actionOnClick?: () => void;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
  secondaryActionOnClick?: () => void;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number, options?: ToastOptions) => string;
  success: (message: string, duration?: number, options?: ToastOptions) => string;
  error: (message: string, duration?: number, options?: ToastOptions) => string;
  info: (message: string, duration?: number, options?: ToastOptions) => string;
  warning: (message: string, duration?: number, options?: ToastOptions) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { readonly children: ReactNode }) {
  const toast = useToastHook();

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
