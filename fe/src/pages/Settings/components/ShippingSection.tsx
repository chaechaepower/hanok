import { useState } from 'react';
import { FiX } from 'react-icons/fi';
import { FaMapMarkerAlt } from 'react-icons/fa';
import type { Address, AddressFormState, AddressModalMode } from '@/types';
import { useGetAddresses } from '@/api/hooks/useGetAddresses';
import { usePostAddress } from '@/api/hooks/usePostAddress';
import { usePatchAddress } from '@/api/hooks/usePatchAddress';
import { useDeleteAddress } from '@/api/hooks/useDeleteAddress';

const EMPTY_FORM: AddressFormState = {
  label: '',
  name: '',
  zipCode: '',
  address: '',
  addressDetail: '',
  phone: '',
};

export default function ShippingSection() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<AddressModalMode>('add');
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<AddressFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  const { data, isLoading } = useGetAddresses();
  const { mutate: createAddress } = usePostAddress();
  const { mutate: updateAddress } = usePatchAddress();
  const { mutate: removeAddress } = useDeleteAddress();

  const addresses = data?.addresses ?? [];

  const openAddModal = () => {
    setForm(EMPTY_FORM);
    setFormError('');
    setModalMode('add');
    setEditId(null);
    setModalOpen(true);
  };

  const openEditModal = (addr: Address) => {
    setForm({
      label: addr.label,
      name: addr.name,
      zipCode: addr.zipCode,
      address: addr.address,
      addressDetail: '',
      phone: addr.phone,
    });
    setFormError('');
    setModalMode('edit');
    setEditId(addr.id);
    setModalOpen(true);
  };

  const handleDelete = (id: number) => {
    removeAddress(id);
  };

  const handleSetDefault = (id: number) => {
    updateAddress({ id, isDefault: true });
  };

  const handleSubmit = () => {
    if (!form.name || !form.zipCode || !form.address || !form.phone || !form.label) {
      setFormError('모든 항목을 입력해주세요.');
      return;
    }
    const fullAddress = form.addressDetail ? `${form.address} ${form.addressDetail}` : form.address;

    if (modalMode === 'add') {
      createAddress(
        {
          label: form.label,
          name: form.name,
          zipCode: form.zipCode,
          address: fullAddress,
          phone: form.phone,
        },
        { onSuccess: () => setModalOpen(false) },
      );
    } else {
      updateAddress(
        {
          id: editId!,
          label: form.label,
          name: form.name,
          zipCode: form.zipCode,
          address: fullAddress,
          phone: form.phone,
        },
        { onSuccess: () => setModalOpen(false) },
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[#333] border-t-[#d9b36d] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="flex items-start justify-between mb-2">
        <div className="flex flex-col gap-1">
          <h2 className="m-0 text-2xl font-bold text-white">배송지 관리</h2>
          <p className="m-0 text-[15px] text-[#aaa]">기본 배송지 및 주소록을 설정합니다.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex-shrink-0 py-2 px-4 bg-[#1a1a28] border border-[#3a3a50] text-white text-sm font-semibold rounded-full cursor-pointer hover:bg-[#2a2a3a] transition-colors"
        >
          + 새 배송지 추가
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="w-full box-border border border-[#2e2e40] rounded-2xl p-12 bg-[#0c0c14] flex flex-col items-center gap-4">
          <FaMapMarkerAlt size={40} className="text-[#333]" />
          <p className="m-0 text-[#555] text-[15px]">등록된 배송지가 없습니다.</p>
        </div>
      ) : (
        <div className="w-full box-border border border-[#2e2e40] rounded-2xl bg-[#0c0c14] overflow-hidden">
          {[...addresses]
            .sort((a, b) => Number(b.isDefault) - Number(a.isDefault))
            .map((addr, idx) => (
              <div key={addr.id} className={`p-8 flex flex-col gap-2 ${idx !== 0 ? 'border-t border-[#2e2e40]' : ''}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-bold text-[16px]">{addr.label}</span>
                  {addr.isDefault && (
                    <span className="px-2.5 py-0.5 bg-white text-[#111] text-xs font-bold rounded-full">기본</span>
                  )}
                </div>

                <p className="m-0 text-[15px] text-[#ddd]">
                  {addr.name}&nbsp;&nbsp;{addr.zipCode}
                </p>
                <p className="m-0 text-[15px] text-[#ddd]">{addr.address}</p>
                <p className="m-0 text-[15px] text-[#ddd]">{addr.phone}</p>

                <div className="flex items-center gap-4 mt-2 justify-end">
                  {!addr.isDefault && (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      className="text-[14px] text-[#aaa] bg-transparent border-none cursor-pointer hover:text-white transition-colors"
                    >
                      기본으로 설정
                    </button>
                  )}
                  <button
                    onClick={() => openEditModal(addr)}
                    className="text-[14px] text-[#aaa] bg-transparent border-none cursor-pointer hover:text-white transition-colors"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    disabled={addr.isDefault && addresses.length > 1}
                    className="text-[14px] text-[#aaa] bg-transparent border-none cursor-pointer hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-[999] flex items-center justify-center"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-[#1a1a28] border border-[#2e2e40] rounded-2xl w-[500px] p-8 flex flex-col gap-5 shadow-[0_8px_30px_rgba(0,0,0,0.5)] max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="m-0 text-white text-xl font-bold">
                {modalMode === 'add' ? '새 배송지 추가' : '배송지 수정'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="bg-transparent border-none text-[#888] cursor-pointer hover:text-white transition-colors"
              >
                <FiX size={22} />
              </button>
            </div>

            {(
              [
                { label: '이름', key: 'name', placeholder: '받는 분 이름', type: 'text' },
                { label: '배송지 별칭', key: 'label', placeholder: '예: 집, 회사', type: 'text' },
                { label: '우편번호', key: 'zipCode', placeholder: '우편번호', type: 'text' },
                { label: '주소', key: 'address', placeholder: '도로명 또는 지번 주소', type: 'text' },
                { label: '상세 주소', key: 'addressDetail', placeholder: '동/호수 등 (선택)', type: 'text' },
                { label: '휴대폰 번호', key: 'phone', placeholder: '010-0000-0000', type: 'tel' },
              ] as const
            ).map(({ label, key, placeholder, type }) => (
              <div key={key} className="flex flex-col gap-2">
                <label className="text-[14px] text-[#aaa] font-medium">{label}</label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full box-border bg-[#0f0f16] text-white border border-[#2e2e40] rounded-lg px-4 py-3 text-[15px] outline-none focus:border-[#d9b36d] transition-colors"
                />
              </div>
            ))}

            {formError && <p className="m-0 text-[13px] text-red-400">{formError}</p>}

            <div className="flex justify-end gap-3 mt-2">
              <button
                onClick={() => setModalOpen(false)}
                className="py-3 px-6 bg-[#333] text-[#ddd] border-none rounded-lg cursor-pointer text-sm font-semibold hover:bg-[#444] transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                className="py-3 px-6 bg-[#d9b36d] text-[#111] font-bold border-none rounded-lg cursor-pointer text-sm hover:bg-[#c8a45c] transition-colors"
              >
                {modalMode === 'add' ? '추가' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
