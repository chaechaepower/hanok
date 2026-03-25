import type { ReactNode } from 'react';

type Props = {
  isOpen: boolean;
  title: string;
  description?: ReactNode;
  error?: string;
  confirmLabel: string;
  isPending?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  children: ReactNode;
};

export default function AccountActionModal({
  isOpen,
  title,
  description,
  error,
  confirmLabel,
  isPending = false,
  onClose,
  onConfirm,
  children,
}: Props) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className="flex w-[460px] flex-col gap-6 rounded-2xl border border-white/5 bg-background p-8 shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="m-0 text-xl font-bold text-white">{title}</h2>
        </div>

        {description ? (
          <div className="rounded-lg border border-accent/30 bg-accent/10 p-4 text-[14px] leading-relaxed text-neutral-400">
            {description}
          </div>
        ) : null}

        {children}

        {error ? <p className="m-0 text-[13px] text-accent-light">{error}</p> : null}

        <div className="mt-2 flex justify-end gap-3">
          <button onClick={onClose} className="btn btn-primary-outline">
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="btn btn-gold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? '처리 중...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
