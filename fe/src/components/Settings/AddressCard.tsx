import EditDeleteActions from '@/components/common/EditDeleteActions';
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
    <div className="flex flex-col gap-2 rounded-2xl bg-surface-elevated p-6">
      <div className="mb-1 flex items-center gap-2">
        <span className="text-[16px] font-bold text-white">{address.addressName}</span>
        {address.isDefault ? <span className="badge badge-gold">기본 배송지</span> : null}
      </div>

      <p className="m-0 text-[15px] text-neutral-200">
        {address.recipientName}&nbsp;&nbsp;({address.postalCode})
      </p>
      <p className="m-0 text-[15px] text-neutral-200">
        {address.address}
        {address.addressDetail ? ` ${address.addressDetail}` : ''}
      </p>
      <p className="m-0 text-[15px] text-neutral-200">{address.phone}</p>

      <div className="mt-3 flex items-center justify-end gap-2">
        {!address.isDefault ? (
          <button
            type="button"
            onClick={() => onSetDefault(address)}
            className="btn btn-primary-outline !px-3 !py-1.5 !text-[12px]"
          >
            기본 배송지로 설정
          </button>
        ) : null}

        <EditDeleteActions
          onEdit={() => onEdit(address)}
          onDelete={() => onDelete(address.id)}
          isDeleteDisabled={isDeleteDisabled}
          containerClassName="flex items-center gap-2"
          editClassName="btn btn-primary-outline !px-3 !py-1.5 !text-[12px]"
          deleteClassName="btn btn-accent-outline !px-3 !py-1.5 !text-[12px] disabled:cursor-not-allowed disabled:opacity-30"
        />
      </div>
    </div>
  );
}
