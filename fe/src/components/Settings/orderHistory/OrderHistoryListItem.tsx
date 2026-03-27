import { FiGift } from 'react-icons/fi';

import type { EscrowItem } from '@/types';
import { formatDateTime } from '@/utils/formatDateTime';
import { formatPrice } from '@/utils/formatPrice';
import { getEscrowStateUI } from '@/utils/getEscrowStateUI';

type Props = {
  item: EscrowItem;
  onSelect: (escrowId: string) => void;
};

export default function OrderHistoryListItem({ item, onSelect }: Props) {
  const ui = getEscrowStateUI(item.escrowStatus);

  return (
    <button
      type="button"
      onClick={() => item.escrowId && onSelect(String(item.escrowId))}
      className="flex cursor-pointer items-center justify-between rounded-2xl border-none bg-surface-elevated px-6 py-5 text-left transition-colors hover:bg-surface"
    >
      <div className="flex flex-1 items-center gap-6">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-[1.5px] border-neutral-700 bg-surface">
          {item.image ? (
            <img
              src={item.image}
              alt={item.itemName}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          ) : (
            <FiGift size={32} className="text-gold-light" />
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <span className={ui.badgeClass}>{ui.label}</span>
          <h4 className="m-0 mt-0.5 text-base font-bold text-white">{item.itemName}</h4>
          <p className="m-0 text-[13px] text-neutral-600">{formatDateTime(item.createdAt)}</p>
        </div>
      </div>

      <div className="flex w-35 flex-col items-end gap-1.5">
        <span className="text-base font-bold text-white">- {formatPrice(item.amount)}</span>
        <span className="text-[13px] text-neutral-600">{ui.label}</span>
      </div>
    </button>
  );
}
