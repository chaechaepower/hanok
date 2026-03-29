type ConfirmModalProps = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  badgeLabel?: string;
  isPending?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel = '확인',
  cancelLabel = '취소',
  badgeLabel = 'Confirm',
  isPending = false,
  onClose,
  onConfirm,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/70 px-4"
      onClick={() => {
        if (!isPending) {
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-[420px] rounded-3xl border border-neutral-800 bg-surface-elevated p-7 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-2 text-md font-semibold uppercase tracking-[0.24em] text-accent">{badgeLabel}</div>
        <h3 className="mb-3 text-xl font-semibold text-warm">{title}</h3>
        <p className="mb-7 text-md leading-6 text-neutral-300">{description}</p>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-xl border border-neutral-700 bg-transparent px-5 py-2.5 text-sm font-medium text-neutral-300 transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? '처리 중...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
