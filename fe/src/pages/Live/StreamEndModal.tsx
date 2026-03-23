import { useEffect } from 'react';
import { MdOutlinePowerSettingsNew } from 'react-icons/md';

interface Props {
  open: boolean;
  isPending: boolean;
  hasRemainingItems: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function StreamEndModal({ open, isPending, hasRemainingItems, onClose, onConfirm }: Props) {
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const description = hasRemainingItems
    ? '아직 경매를 시작하지 않은 물품이 있습니다.\n그래도 종료하시겠습니까?'
    : '방송을 종료하시겠습니까?\n 종료 후에는 진행 중인 화면으로 다시 돌아갈 수 없습니다.';

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-(--modal-backdrop) px-4 backdrop-blur-(--modal-blur)"
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div
        className="flex w-full max-w-105 flex-col gap-6 rounded-(--radius-panel) border border-white/6 bg-surface p-8 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/15">
              <MdOutlinePowerSettingsNew size={32} className="text-accent-light" />
            </div>
            <h2 className="text-xl font-bold text-white">방송을 종료할까요?</h2>
            <p className="text-sm leading-relaxed whitespace-pre-line text-neutral-400">{description}</p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="flex-1 rounded-xl border border-neutral-700 bg-transparent py-3.5 text-sm font-bold text-neutral-300 transition hover:bg-warm/10 disabled:opacity-50"
            >
              닫기
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isPending}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent py-3.5 text-sm font-bold text-white transition hover:bg-accent-dark disabled:opacity-50"
            >
              <MdOutlinePowerSettingsNew size={18} />
              {isPending ? '종료 중...' : '종료'}
            </button>
          </div>
      </div>
    </div>
  );
}
