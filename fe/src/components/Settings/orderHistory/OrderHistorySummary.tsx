import { formatPrice } from '@/utils/formatPrice';

type Props = {
  totalCount: number;
  totalAmount: number;
};

export default function OrderHistorySummary({ totalCount, totalAmount }: Props) {
  return (
    <div className="flex items-center gap-6 rounded-2xl bg-surface-elevated px-8 py-6">
      <div className="flex flex-col gap-1">
        <span className="text-[13px] text-neutral-500">총 주문</span>
        <span className="text-[20px] font-bold text-white">{totalCount}건</span>
      </div>
      <div className="h-8 w-px bg-white/5" />
      <div className="flex flex-col gap-1">
        <span className="text-[13px] text-neutral-500">총 결제 금액</span>
        <span className="text-[20px] font-bold text-gold-light">{formatPrice(totalAmount)}</span>
      </div>
    </div>
  );
}
