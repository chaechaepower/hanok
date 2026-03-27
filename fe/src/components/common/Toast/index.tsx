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

const toastStyles: Record<ToastType, { border: string; dot: string; title: string; icon: string }> = {
  success: {
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]',
    title: 'text-emerald-400',
    icon: '✓',
  },
  error: {
    border: 'border-red-500/30',
    dot: 'bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.5)]',
    title: 'text-red-400',
    icon: '✕',
  },
  warning: {
    border: 'border-amber-500/30',
    dot: 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]',
    title: 'text-amber-400',
    icon: '!',
  },
  info: {
    border: 'border-accent/20',
    dot: 'bg-accent shadow-[0_0_10px_rgba(166,61,46,0.4)]',
    title: 'text-gold-light',
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
        border ${style.border} bg-background/95 px-[18px] py-[14px]
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
      <p className="m-0 text-body-sm font-bold leading-[1.5] text-neutral-200">
        {title && <span className={`font-extrabold ${style.title}`}>{title}</span>}
        {title ? ' ' : ''}
        {message}
      </p>
    </div>
  );
}
