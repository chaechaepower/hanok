import { useLiveBidSync } from '@/hooks/useLiveHotState';

interface Props {
  visible: boolean;
}

export default function LiveBidPriceBadge({ visible }: Props) {
  const bidSync = useLiveBidSync();

  if (!visible || !bidSync) {
    return null;
  }

  return (
    <div className="absolute bottom-4 left-3 z-10 rounded-xl border border-gold/30 bg-background/85 px-3 py-2 backdrop-blur-md">
      <p className="text-[10px] font-medium text-neutral-400">현재 입찰가</p>
      <p className="text-base font-black tabular-nums text-gold">
        {bidSync.item.currentPrice.toLocaleString()}
        <span className="text-xs font-bold text-gold/70">원</span>
      </p>
    </div>
  );
}
