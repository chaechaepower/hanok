import { createContext, useContext } from 'react';

import type { ToastData } from './Toast';

export interface ToastContextValue {
  showToast: (toast: Omit<ToastData, 'id'>) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);

  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }

  return ctx;
}
