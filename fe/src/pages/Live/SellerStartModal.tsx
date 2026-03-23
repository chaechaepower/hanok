import { MdLiveTv } from 'react-icons/md';

interface Props {
  open: boolean;
  streamTitle: string;
  isPending: boolean;
  onConfirm: () => void;
}

export default function SellerStartModal({ open, streamTitle, isPending, onConfirm }: Props) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-(--modal-backdrop) px-4 backdrop-blur-(--modal-blur)">
      <div className="flex w-full max-w-105 flex-col gap-6 rounded-(--radius-panel) border border-white/6 bg-surface p-8 shadow-2xl">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/15">
            <MdLiveTv size={32} className="text-accent" />
          </div>
          <h2 className="text-xl font-bold text-white">방송을 시작할까요?</h2>
          <p className="text-sm leading-relaxed text-neutral-500">
            준비가 끝났다면 시작 버튼을 눌러 주세요
            <br />이 순간부터 방송이 노출됩니다
          </p>
        </div>

        <div className="rounded-xl bg-white/5 px-4 py-3">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="shrink-0 text-neutral-500">방송 제목</span>
            <span className="truncate font-medium text-white">{streamTitle}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent py-3.5 font-bold text-white transition-colors hover:bg-accent-dark disabled:opacity-50"
          >
            <MdLiveTv size={18} />
            {isPending ? '시작 중...' : '방송 시작'}
          </button>
        </div>
      </div>
    </div>
  );
}
