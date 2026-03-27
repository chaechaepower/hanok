import { useState } from 'react';
import { FiSearch } from 'react-icons/fi';

import { useGetAddresses } from '@/api/hooks/useGetAddresses';
import { usePatchAddress } from '@/api/hooks/usePatchAddress';
import { usePostAddress } from '@/api/hooks/usePostAddress';
import { EMPTY_FORM } from '@/constants/addressForm';
import useAddressSearch from '@/hooks/useAddressSearch';
import { useToast } from '@/hooks/useToast';
import type { Address, AddressFormState, AddressModalMode, JusoResult } from '@/types';
import { formatPhoneNumber, isValidPhoneNumber } from '@/utils/addressForm';
import AddressSearchModal from './AddressSearchModal';

type AddressFormModalProps = {
  isOpen: boolean;
  mode: AddressModalMode;
  initialAddress?: Address | null;
  defaultOnCreate?: boolean;
  description?: string;
  onClose: () => void;
  onSuccess?: () => void;
};

type AddressFormModalContentProps = Omit<AddressFormModalProps, 'isOpen'>;

const getInitialFormState = (mode: AddressModalMode, initialAddress?: Address | null): AddressFormState => {
  if (mode === 'edit' && initialAddress) {
    return {
      addressName: initialAddress.addressName,
      recipientName: initialAddress.recipientName,
      postalCode: String(initialAddress.postalCode),
      address: initialAddress.address,
      addressDetail: initialAddress.addressDetail || '',
      phone: initialAddress.phone,
    };
  }

  return EMPTY_FORM;
};

function AddressFormModalContent({
  mode,
  initialAddress = null,
  defaultOnCreate = false,
  description,
  onClose,
  onSuccess,
}: AddressFormModalContentProps) {
  const [form, setForm] = useState<AddressFormState>(() => getInitialFormState(mode, initialAddress));
  const [formError, setFormError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const { data: addresses } = useGetAddresses(true);
  const { mutate: createAddress, isPending: isCreatePending } = usePostAddress();
  const { mutate: updateAddress, isPending: isUpdatePending } = usePatchAddress();
  const {
    addressSearchOpen,
    searchKeyword,
    searchResults,
    searchLoading,
    searchError,
    currentPage,
    totalCount,
    countPerPage,
    setSearchKeyword,
    openAddressSearch,
    closeAddressSearch,
    searchAddress,
  } = useAddressSearch();
  const { showToast } = useToast();

  const setField = <K extends keyof AddressFormState>(key: K, value: AddressFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));

    if (formError) {
      setFormError('');
    }
  };

  const clearErrors = () => {
    if (formError) {
      setFormError('');
    }

    if (phoneError) {
      setPhoneError('');
    }
  };

  const selectAddress = (juso: JusoResult) => {
    setForm((prev) => ({
      ...prev,
      postalCode: juso.zipNo,
      address: juso.roadAddr,
      addressDetail: '',
    }));
    clearErrors();
    closeAddressSearch();
  };

  const handleSubmit = () => {
    if (!form.recipientName || !form.postalCode || !form.address || !form.phone || !form.addressName) {
      setPhoneError('');
      setFormError('필수 입력값을 모두 입력해 주세요.');
      return;
    }

    if (!isValidPhoneNumber(form.phone)) {
      setFormError('');
      setPhoneError('전화번호 형식이 올바르지 않습니다.');
      return;
    }

    clearErrors();

    if (mode === 'add') {
      createAddress(
        {
          addressName: form.addressName,
          postalCode: Number(form.postalCode),
          address: form.address,
          addressDetail: form.addressDetail,
          phone: form.phone,
          recipientName: form.recipientName,
          isDefault: defaultOnCreate || (addresses?.length ?? 0) === 0,
        },
        {
          onSuccess: () => {
            showToast({ type: 'success', message: '배송지가 추가되었습니다.' });
            onSuccess?.();
            onClose();
          },
          onError: () => showToast({ type: 'error', message: '배송지 추가에 실패했습니다.' }),
        },
      );
      return;
    }

    if (!initialAddress) {
      return;
    }

    updateAddress(
      {
        id: initialAddress.id,
        addressName: form.addressName,
        postalCode: Number(form.postalCode),
        address: form.address,
        addressDetail: form.addressDetail,
        phone: form.phone,
        recipientName: form.recipientName,
        isDefault: initialAddress.isDefault,
      },
      {
        onSuccess: () => {
          showToast({ type: 'success', message: '배송지가 수정되었습니다.' });
          onSuccess?.();
          onClose();
        },
        onError: () => showToast({ type: 'error', message: '배송지 수정에 실패했습니다.' }),
      },
    );
  };

  const isPending = isCreatePending || isUpdatePending;
  const totalPages = Math.ceil(totalCount / countPerPage);
  const activeError = phoneError || formError;

  return (
    <>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70" onClick={onClose}>
        <div
          className="max-h-[90vh] w-[500px] overflow-y-auto custom-scrollbar rounded-2xl border border-white/[0.08] bg-surface p-8 shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-5">
            <div className="flex flex-col gap-1">
              <h2 className="m-0 text-xl font-bold text-white">{mode === 'add' ? '배송지 추가' : '배송지 수정'}</h2>
              {description ? <p className="m-0 text-[13px] text-neutral-400">{description}</p> : null}
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-400">수령인 이름</label>
              <input
                type="text"
                value={form.recipientName}
                onChange={(event) => setField('recipientName', event.target.value)}
                placeholder="수령인 이름을 입력하세요"
                className="box-border w-full rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3 text-[15px] text-white outline-none transition-colors focus:border-gold-light"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-400">배송지 이름</label>
              <input
                type="text"
                value={form.addressName}
                onChange={(event) => setField('addressName', event.target.value)}
                placeholder="예: 집, 회사"
                className="box-border w-full rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3 text-[15px] text-white outline-none transition-colors focus:border-gold-light"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-400">우편번호</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.postalCode}
                  readOnly
                  placeholder="주소 검색을 통해 자동 입력됩니다"
                  className="box-border flex-1 cursor-default rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3 text-[15px] text-white outline-none"
                />
                <button type="button" onClick={openAddressSearch} className="btn btn-gold whitespace-nowrap">
                  <FiSearch size={16} />
                  주소 검색
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-400">주소</label>
              <input
                type="text"
                value={form.address}
                readOnly
                placeholder="주소 검색을 통해 자동 입력됩니다"
                className="box-border w-full cursor-default rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3 text-[15px] text-white outline-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-400">상세 주소</label>
              <input
                type="text"
                value={form.addressDetail}
                onChange={(event) => setField('addressDetail', event.target.value)}
                placeholder="동, 호수 등 상세 주소를 입력하세요"
                className="box-border w-full rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3 text-[15px] text-white outline-none transition-colors focus:border-gold-light"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-400">전화번호</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(event) => {
                  setField('phone', formatPhoneNumber(event.target.value));
                  if (phoneError) {
                    setPhoneError('');
                  }
                }}
                onBlur={() => {
                  if (form.phone && !isValidPhoneNumber(form.phone)) {
                    setFormError('');
                    setPhoneError('전화번호 형식이 올바르지 않습니다.');
                  }
                }}
                placeholder="010-0000-0000"
                className={`box-border w-full rounded-lg border bg-white/[0.02] px-4 py-3 text-[15px] text-white outline-none transition-colors ${
                  phoneError ? 'border-accent' : 'border-white/5 focus:border-gold-light'
                }`}
              />
            </div>
            {activeError ? <p className="m-0 min-h-[20px] text-[13px] text-accent-light">{activeError}</p> : null}

            <div className="mt-2 flex justify-end gap-3">
              <button type="button" onClick={onClose} className="btn btn-primary-outline" disabled={isPending}>
                취소
              </button>
              <button type="button" onClick={handleSubmit} className="btn btn-gold" disabled={isPending}>
                {mode === 'add' ? '추가' : '수정'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <AddressSearchModal
        isOpen={addressSearchOpen}
        searchKeyword={searchKeyword}
        searchResults={searchResults}
        searchLoading={searchLoading}
        searchError={searchError}
        currentPage={currentPage}
        totalCount={totalCount}
        totalPages={totalPages}
        onClose={closeAddressSearch}
        onKeywordChange={setSearchKeyword}
        onSearch={searchAddress}
        onSelectAddress={selectAddress}
      />
    </>
  );
}

export default function AddressFormModal({
  isOpen,
  mode,
  initialAddress = null,
  defaultOnCreate = false,
  description,
  onClose,
  onSuccess,
}: AddressFormModalProps) {
  if (!isOpen) {
    return null;
  }

  const modalKey =
    mode === 'edit' && initialAddress ? `edit-${initialAddress.id}` : `add-${defaultOnCreate ? 'default' : 'normal'}`;

  return (
    <AddressFormModalContent
      key={modalKey}
      mode={mode}
      initialAddress={initialAddress}
      defaultOnCreate={defaultOnCreate}
      description={description}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}
