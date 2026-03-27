import { FiMapPin, FiPhone, FiUser } from 'react-icons/fi';
import type { Address } from '@/types';

interface AddressCardProps {
  address: Address;
  isDeleteDisabled: boolean;
  onSetDefault: (address: Address) => void;
  onEdit: (address: Address) => void;
  onDelete: (id: number) => void;
}

export default function AddressCard({
  address,
  isDeleteDisabled,
  onSetDefault,
  onEdit,
  onDelete,
}: AddressCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-6 transition-colors ${
        address.isDefault
          ? 'border-transparent bg-surface-elevated'
          : 'border-white/[0.06] bg-surface-elevated hover:border-white/[0.1]'
      }`}
    >
      {address.isDefault && (
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(232,179,106,0.18)_0%,transparent_50%)]" />
      )}
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="flex flex-col gap-3 min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <span className="text-[16px] font-bold text-white truncate">{address.addressName}</span>
            {address.isDefault && (
              <span className="shrink-0 rounded-full bg-gold-light/15 px-2.5 py-0.5 text-[11px] font-bold text-gold-light">
                기본
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <FiUser size={13} className="shrink-0 text-neutral-600" />
              <span className="text-[14px] text-neutral-300">{address.recipientName}</span>
            </div>
            <div className="flex items-start gap-2">
              <FiMapPin size={13} className="shrink-0 text-neutral-600 mt-0.5" />
              <span className="text-[14px] text-neutral-300 leading-relaxed">
                <span className="text-neutral-500 mr-1.5">({address.postalCode})</span>
                {address.address}
                {address.addressDetail ? ` ${address.addressDetail}` : ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FiPhone size={13} className="shrink-0 text-neutral-600" />
              <span className="text-[14px] text-neutral-300">{address.phone}</span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {!address.isDefault && (
            <button
              type="button"
              onClick={() => onSetDefault(address)}
              className="rounded-lg border border-white/[0.06] bg-transparent px-3 py-1.5 text-[12px] font-medium text-neutral-400 cursor-pointer hover:border-gold-light/30 hover:text-gold-light transition-colors"
            >
              기본으로 설정
            </button>
          )}
          <button
            type="button"
            onClick={() => onEdit(address)}
            className={`rounded-lg border px-3 py-1.5 text-[12px] font-medium cursor-pointer transition-colors ${
              address.isDefault
                ? 'border-white/[0.12] bg-white/[0.06] text-neutral-200 hover:bg-white/[0.1] hover:text-white'
                : 'border-white/[0.06] bg-transparent text-neutral-400 hover:border-white/[0.15] hover:text-neutral-200'
            }`}
          >
            수정
          </button>
          <button
            type="button"
            onClick={() => onDelete(address.id)}
            disabled={isDeleteDisabled}
            className={`rounded-lg border px-3 py-1.5 text-[12px] font-medium cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
              address.isDefault
                ? 'border-white/[0.12] bg-white/[0.06] text-accent-light hover:bg-accent/10'
                : 'border-white/[0.06] bg-transparent text-accent-light/70 hover:border-accent-light/30 hover:text-accent-light'
            }`}
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}
