import { useState, useEffect, useCallback, useRef } from 'react';

export interface ToastData {
  id: string;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastProps extends ToastData {
  onClose: (id: string) => void;
}

export default function Toast({ id, title, message, duration = 4000, onClose }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);
  const closeTimerRef = useRef<number | null>(null);
  const isDismissingRef = useRef(false);

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
      className={`flex cursor-pointer select-none items-center gap-3 rounded-[14px]
        border border-accent/20 bg-background/95 px-[18px] py-[14px]
        shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-[20px]
        ${isExiting ? 'animate-toast-out' : 'animate-toast-in'}
        min-w-[280px] max-w-[380px]`}
    >
      {/* dot */}
      <div className="size-2 shrink-0 rounded-full bg-accent shadow-[0_0_10px_rgba(166,61,46,0.4)]" />

      {/* text */}
      <p className="m-0 text-body-sm font-bold leading-[1.5] text-neutral-200">
        {title && <span className="font-extrabold text-gold-light">{title}</span>}
        {title ? ' ' : ''}
        {message}
      </p>
    </div>
  );
}
