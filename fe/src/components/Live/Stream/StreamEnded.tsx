import { MdOutlineVideocamOff } from 'react-icons/md';

interface Props {
  onClose?: () => void;
}

export default function StreamEnded({ onClose }: Props) {
  return (
    <div className="animate-[fadeIn_.3s_ease] fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-[20px]">
      <div className="mx-4 flex aspect-square w-full max-w-[550px] flex-col items-center justify-center gap-8 overflow-hidden rounded-3xl border border-white/7 bg-surface shadow-[0_24px_60px_rgba(0,0,0,.6)]">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-gold/20 bg-gold/[0.08]">
          <MdOutlineVideocamOff size={36} className="text-gold/80" />
        </div>

        <div className="flex flex-col items-center gap-2 text-center">
          <div className="text-xl font-bold tracking-wide text-gold">방송이 종료되었습니다.</div>
          <div className="text-sm text-neutral-500">경매 참여가 마감되었습니다. 판매자의 다음 경매를 기다려보세요!</div>
        </div>

        <button
          onClick={onClose}
          className="rounded-xl border border-gold/30 bg-gold/10 px-8 py-3 text-base font-semibold text-gold transition-colors hover:bg-gold/20"
        >
          나가기
        </button>
      </div>
    </div>
  );
}
