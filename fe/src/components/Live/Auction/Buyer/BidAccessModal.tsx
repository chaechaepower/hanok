import { useEffect } from 'react';

type BidAccessModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAction: () => void;
};

export default function BidAccessModal({ isOpen, onClose, onAction }: BidAccessModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-(--modal-backdrop) px-4 backdrop-blur-(--modal-blur)"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-(--radius-panel) border border-white/6 bg-background/92 px-6 py-10 text-white shadow-[0_24px_80px_rgba(0,0,0,.45)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="space-y-2">
          <h2 className="text-[22px] font-black leading-snug">로그인 후 입찰할 수 있습니다</h2>
          <p className="text-[14px] leading-6 text-white/68">입찰과 결제 기능을 이용하려면 먼저 로그인해주세요.</p>
        </div>
        <div className="mt-7 flex gap-3">
          <button
            type="button"
            className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[14px] font-bold text-white/72 transition hover:bg-white/10"
            onClick={onClose}
          >
            닫기
          </button>
          <button
            type="button"
            className="flex-1 rounded-2xl bg-gold px-4 py-3 text-[14px] font-black text-white transition hover:bg-gold-dark"
            onClick={onAction}
          >
            로그인하러 가기
          </button>
        </div>
      </div>
    </div>
  );
}
