type BidAccessModalVariant = 'login' | 'shipping';

type BidAccessModalProps = {
  isOpen: boolean;
  variant: BidAccessModalVariant | null;
  onClose: () => void;
  onAction: () => void;
};

const MODAL_COPY: Record<
  BidAccessModalVariant,
  {
    badge: string;
    title: string;
    description: string;
    actionLabel: string;
  }
> = {
  login: {
    badge: '입찰 안내',
    title: '로그인이 필요한 기능입니다.',
    description: '입찰에 참여하려면 먼저 로그인해주세요.',
    actionLabel: '로그인하러 가기',
  },
  shipping: {
    badge: '배송지 안내',
    title: '배송지 등록이 필요합니다.',
    description: '입찰 전에 배송지 정보를 먼저 등록해주세요.',
    actionLabel: '설정으로 이동',
  },
};

export default function BidAccessModal({ isOpen, variant, onClose, onAction }: BidAccessModalProps) {
  if (!isOpen || !variant) {
    return null;
  }

  const copy = MODAL_COPY[variant];

  return (
    <div
      className="fixed inset-0 z-120 flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-[28px] border border-white/12 bg-background/92 p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,.45)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 inline-flex rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[11px] font-bold text-white/75">
          {copy.badge}
        </div>
        <div className="space-y-2">
          <h2 className="text-[22px] font-black leading-snug">{copy.title}</h2>
          <p className="text-[14px] leading-6 text-white/68">{copy.description}</p>
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
            {copy.actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
