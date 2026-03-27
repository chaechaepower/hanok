import { useState, useEffect, useCallback, useRef } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  id: string;
  type?: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastProps extends ToastData {
  onClose: (id: string) => void;
}

const toastStyles: Record<ToastType, { bg: string; border: string; dot: string; text: string; icon: string }> = {
  success: {
    bg: 'bg-emerald-900/80',
    border: 'border-emerald-500/40',
    dot: 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]',
    text: 'text-emerald-100',
    icon: '✓',
  },
  error: {
    bg: 'bg-red-900/80',
    border: 'border-red-500/40',
    dot: 'bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.5)]',
    text: 'text-red-100',
    icon: '✕',
  },
  warning: {
    bg: 'bg-amber-900/80',
    border: 'border-amber-500/40',
    dot: 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]',
    text: 'text-amber-100',
    icon: '!',
  },
  info: {
    bg: 'bg-background/95',
    border: 'border-accent/20',
    dot: 'bg-accent shadow-[0_0_10px_rgba(166,61,46,0.4)]',
    text: 'text-neutral-200',
    icon: '',
  },
};

export default function Toast({ id, type = 'info', title, message, duration = 4000, onClose }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);
  const closeTimerRef = useRef<number | null>(null);
  const isDismissingRef = useRef(false);
  const style = toastStyles[type];

  const dismiss = useCallback(() => {
    if (isDismissingRef.current) {
      return;
    }

    isDismissingRef.current = true;
    setIsExiting(true);
    closeTimerRef.current = window.setTimeout(() => onClose(id), 300);
  }, [id, onClose]);

  useEffect(() => {
    const timer = window.setTimeout(dismiss, duration);

    return () => {
      window.clearTimeout(timer);

      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, [duration, dismiss]);

  return (
    <div
      onClick={dismiss}
      role="alert"
      aria-live="polite"
      className={`flex cursor-pointer select-none items-center gap-3 rounded-(--radius-control)
        border ${style.border} ${style.bg} px-[18px] py-[14px]
        shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-[20px]
        ${isExiting ? 'animate-toast-out' : 'animate-toast-in'}
        min-w-[280px] max-w-[380px]`}
    >
      {/* indicator */}
      {type !== 'info' ? (
        <div className={`flex size-6 shrink-0 items-center justify-center rounded-full ${style.dot} text-xs font-black text-background`}>
          {style.icon}
        </div>
      ) : (
        <div className={`size-2 shrink-0 rounded-full ${style.dot}`} />
      )}

      {/* text */}
      <p className={`m-0 text-body-sm font-bold leading-[1.5] ${style.text}`}>
        {title && <span className="font-extrabold">{title}</span>}
        {title ? ' ' : ''}
        {message}
      </p>
    </div>
  );
}
