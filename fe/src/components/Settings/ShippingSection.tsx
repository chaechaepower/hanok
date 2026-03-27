import { useState } from 'react';
import { FiMapPin, FiPlus } from 'react-icons/fi';

import { useDeleteAddress } from '@/api/hooks/useDeleteAddress';
import { useGetAddresses } from '@/api/hooks/useGetAddresses';
import { usePatchAddress } from '@/api/hooks/usePatchAddress';
import type { Address, AddressModalMode } from '@/types';

import AddressCard from './AddressCard';
import AddressFormModal from '@/components/common/modal/AddressFormModal';

export default function ShippingSection({ autoOpenModal = false }: { autoOpenModal?: boolean }) {
  const [modalOpen, setModalOpen] = useState(autoOpenModal);
  const [modalMode, setModalMode] = useState<AddressModalMode>('add');
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const { data, isLoading } = useGetAddresses();
  const { mutate: updateAddress } = usePatchAddress();
  const { mutate: removeAddress } = useDeleteAddress();

  const addresses = data ?? [];

  const openAddModal = () => {
    setModalMode('add');
    setEditingAddress(null);
    setModalOpen(true);
  };

  const openEditModal = (address: Address) => {
    setModalMode('edit');
    setEditingAddress(address);
    setModalOpen(true);
  };

  const handleDelete = (id: number) => {
    removeAddress(id);
  };

  const handleSetDefault = (address: Address) => {
    updateAddress({
      id: address.id,
      addressName: address.addressName,
      postalCode: address.postalCode,
      address: address.address,
      addressDetail: address.addressDetail,
      phone: address.phone,
      recipientName: address.recipientName,
      isDefault: true,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-700 border-t-gold-light" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <h2 className="m-0 text-[22px] font-bold text-white">배송지 관리</h2>
          {addresses.length > 0 && (
            <span className="text-[14px] text-neutral-500">
              총 <span className="font-bold text-gold-light">{addresses.length}</span>개
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="flex items-center gap-1.5 rounded-lg bg-gold-light/10 border border-gold-light/20 px-4 py-2 text-[13px] font-bold text-gold-light cursor-pointer hover:bg-gold-light/15 hover:border-gold-light/30 transition-colors"
        >
          <FiPlus size={15} />
          새 배송지
        </button>
      </div>

      {addresses.length === 0 ? (
        <button
          type="button"
          onClick={openAddModal}
          className="flex w-full flex-col items-center gap-3 rounded-2xl border border-dashed border-gold-light/20 bg-white/[0.02] py-16 cursor-pointer hover:border-gold-light/40 hover:bg-white/[0.04] transition-colors"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold-light/10">
            <FiMapPin size={24} className="text-gold-light" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="m-0 text-[15px] font-bold text-neutral-300">배송지를 등록해보세요</p>
            <p className="m-0 text-[13px] text-neutral-500">경매 낙찰 시 빠르게 배송 정보를 입력할 수 있어요</p>
          </div>
        </button>
      ) : (
        <div className="flex flex-col gap-3">
          {[...addresses]
            .sort((a, b) => Number(b.isDefault) - Number(a.isDefault))
            .map((address) => (
              <AddressCard
                key={address.id}
                address={address}
                isDeleteDisabled={address.isDefault && addresses.length > 1}
                onSetDefault={handleSetDefault}
                onEdit={openEditModal}
                onDelete={handleDelete}
              />
            ))}
        </div>
      )}

      <AddressFormModal
        isOpen={modalOpen}
        mode={modalMode}
        initialAddress={editingAddress}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
