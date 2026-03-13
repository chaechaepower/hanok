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
    <>
      <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="flex w-full max-w-105 flex-col gap-6 rounded-2xl border border-white/10 bg-[#0f0f13] p-8 shadow-2xl">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e74c3c]/15">
              <MdLiveTv size={32} className="text-[#e74c3c]" />
            </div>
            <h2 className="text-xl font-bold text-white">방송을 시작할까요?</h2>
            <p className="text-sm leading-relaxed text-[#888]">
              준비가 끝났다면 시작 버튼을 눌러 주세요.
              <br />이 순간부터 방송이 노출됩니다.
            </p>
          </div>

          <div className="rounded-xl bg-white/5 px-4 py-3">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="shrink-0 text-[#888]">방송 제목</span>
              <span className="truncate font-medium text-white">{streamTitle}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onConfirm}
              disabled={isPending}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#e74c3c] py-3.5 font-bold text-white transition-colors hover:bg-[#c0392b] disabled:opacity-50"
            >
              <MdLiveTv size={18} />
              {isPending ? '시작 중...' : '방송 시작'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
