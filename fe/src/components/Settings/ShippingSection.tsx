import { useState } from 'react';
import { FaMapMarkerAlt } from 'react-icons/fa';

import { useDeleteAddress } from '@/api/hooks/useDeleteAddress';
import { useGetAddresses } from '@/api/hooks/useGetAddresses';
import { usePatchAddress } from '@/api/hooks/usePatchAddress';
import type { Address, AddressModalMode } from '@/types';

import AddressCard from './AddressCard';
import AddressFormModal from './AddressFormModal';

export default function ShippingSection() {
  const [modalOpen, setModalOpen] = useState(false);
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
      <div className="mb-2 flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="m-0 text-2xl font-bold text-white">배송지 관리</h2>
          <p className="m-0 text-[15px] text-neutral-400">
            주문에 사용할 배송지를 관리할 수 있습니다.
            {addresses.length > 0 ? (
              <span className="ml-2 font-semibold text-gold-light">등록된 배송지 {addresses.length}개</span>
            ) : null}
          </p>
        </div>
        <button type="button" onClick={openAddModal} className="btn btn-gold flex-shrink-0">
          + 새 배송지 추가
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="flex w-full flex-col items-center gap-4 rounded-2xl bg-surface-elevated p-12">
          <FaMapMarkerAlt size={40} className="text-neutral-700" />
          <p className="m-0 text-[15px] text-neutral-500">등록된 배송지가 없습니다.</p>
        </div>
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
