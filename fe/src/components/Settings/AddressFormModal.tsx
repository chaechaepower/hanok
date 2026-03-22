import { useCallback, useEffect, useState } from 'react';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { FiSearch, FiX } from 'react-icons/fi';

import { useGetAddresses } from '@/api/hooks/useGetAddresses';
import { usePatchAddress } from '@/api/hooks/usePatchAddress';
import { usePostAddress } from '@/api/hooks/usePostAddress';
import type { Address, AddressFormState, AddressModalMode, JusoResult } from '@/types';

const JUSO_API_KEY = import.meta.env.VITE_JUSO_API_KEY as string;

const EMPTY_FORM: AddressFormState = {
  addressName: '',
  recipientName: '',
  postalCode: '',
  address: '',
  addressDetail: '',
  phone: '010',
};

type AddressFormModalProps = {
  isOpen: boolean;
  mode: AddressModalMode;
  initialAddress?: Address | null;
  defaultOnCreate?: boolean;
  description?: string;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function AddressFormModal({
  isOpen,
  mode,
  initialAddress = null,
  defaultOnCreate = false,
  description,
  onClose,
  onSuccess,
}: AddressFormModalProps) {
  const [form, setForm] = useState<AddressFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [addressSearchOpen, setAddressSearchOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<JusoResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const countPerPage = 10;
  const { data: addresses } = useGetAddresses(isOpen);
  const { mutate: createAddress, isPending: isCreatePending } = usePostAddress();
  const { mutate: updateAddress, isPending: isUpdatePending } = usePatchAddress();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (mode === 'edit' && initialAddress) {
      setForm({
        addressName: initialAddress.addressName,
        recipientName: initialAddress.recipientName,
        postalCode: String(initialAddress.postalCode),
        address: initialAddress.address,
        addressDetail: initialAddress.addressDetail || '',
        phone: initialAddress.phone,
      });
    } else {
      setForm(EMPTY_FORM);
    }

    setFormError('');
    setPhoneError('');
    setAddressSearchOpen(false);
    setSearchKeyword('');
    setSearchResults([]);
    setSearchLoading(false);
    setSearchError('');
    setCurrentPage(1);
    setTotalCount(0);
  }, [initialAddress, isOpen, mode]);

  const searchAddress = useCallback(
    async (page: number = 1) => {
      if (!searchKeyword.trim()) {
        setSearchError('검색할 주소를 입력해주세요.');
        return;
      }

      setSearchLoading(true);
      setSearchError('');

      try {
        const params = new URLSearchParams({
          confmKey: JUSO_API_KEY,
          currentPage: String(page),
          countPerPage: String(countPerPage),
          keyword: searchKeyword.trim(),
          resultType: 'json',
        });

        const res = await fetch(`https://business.juso.go.kr/addrlink/addrLinkApi.do?${params.toString()}`);
        const data = await res.json();
        const result = data.results;

        if (result.common.errorCode !== '0') {
          setSearchError(result.common.errorMessage || '주소 검색 중 오류가 발생했습니다.');
          setSearchResults([]);
          return;
        }

        setSearchResults(result.juso ?? []);
        setTotalCount(Number(result.common.totalCount));
        setCurrentPage(page);
      } catch {
        setSearchError('주소 검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    },
    [searchKeyword],
  );

  const openAddressSearch = () => {
    setSearchKeyword('');
    setSearchResults([]);
    setSearchError('');
    setCurrentPage(1);
    setTotalCount(0);
    setAddressSearchOpen(true);
  };

  const selectAddress = (juso: JusoResult) => {
    setForm((prev) => ({
      ...prev,
      postalCode: juso.zipNo,
      address: juso.roadAddr,
      addressDetail: '',
    }));
    setAddressSearchOpen(false);
  };

  const handleSubmit = () => {
    if (!form.recipientName || !form.postalCode || !form.address || !form.phone || !form.addressName) {
      setFormError('필수 항목을 모두 입력해주세요.');
      return;
    }

    if (!/^01[016789]-?\d{3,4}-?\d{4}$/.test(form.phone)) {
      setPhoneError('올바른 휴대폰 번호 형식으로 입력해주세요.');
      return;
    }

    setFormError('');

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
            onSuccess?.();
            onClose();
          },
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
          onSuccess?.();
          onClose();
        },
      },
    );
  };

  if (!isOpen) {
    return null;
  }

  const isPending = isCreatePending || isUpdatePending;
  const totalPages = Math.ceil(totalCount / countPerPage);

  return (
    <>
      <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70" onClick={onClose}>
        <div
          className="max-h-[90vh] w-[500px] overflow-y-auto rounded-2xl border border-white/5 bg-background p-8 shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-5 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h2 className="m-0 text-xl font-bold text-white">{mode === 'add' ? '배송지 추가' : '배송지 수정'}</h2>
              {description ? <p className="m-0 text-[13px] text-neutral-400">{description}</p> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer border-none bg-transparent text-neutral-600 transition-colors hover:text-white"
            >
              <FiX size={22} />
            </button>
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-400">받는 분</label>
              <input
                type="text"
                value={form.recipientName}
                onChange={(event) => setForm((prev) => ({ ...prev, recipientName: event.target.value }))}
                placeholder="받는 분 이름"
                className="box-border w-full rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3 text-[15px] text-white outline-none transition-colors focus:border-gold-light"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-400">배송지 이름</label>
              <input
                type="text"
                value={form.addressName}
                onChange={(event) => setForm((prev) => ({ ...prev, addressName: event.target.value }))}
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
                  placeholder="주소 검색을 통해 입력해주세요"
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
                placeholder="주소 검색을 통해 입력해주세요"
                className="box-border w-full cursor-default rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3 text-[15px] text-white outline-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-400">상세 주소</label>
              <input
                type="text"
                value={form.addressDetail}
                onChange={(event) => setForm((prev) => ({ ...prev, addressDetail: event.target.value }))}
                placeholder="동, 호수 등"
                className="box-border w-full rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3 text-[15px] text-white outline-none transition-colors focus:border-gold-light"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-400">휴대폰 번호</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(event) => {
                  const raw = event.target.value.replace(/^010-?/, '').replace(/[^0-9]/g, '');
                  const formatted =
                    raw.length <= 4 ? (raw.length > 0 ? `010-${raw}` : '010') : `010-${raw.slice(0, 4)}-${raw.slice(4, 8)}`;

                  setForm((prev) => ({ ...prev, phone: formatted }));
                  if (phoneError) {
                    setPhoneError('');
                  }
                }}
                onBlur={() => {
                  if (form.phone && !/^01[016789]-?\d{3,4}-?\d{4}$/.test(form.phone)) {
                    setPhoneError('올바른 휴대폰 번호 형식으로 입력해주세요.');
                  }
                }}
                placeholder="010-0000-0000"
                className={`box-border w-full rounded-lg border bg-white/[0.02] px-4 py-3 text-[15px] text-white outline-none transition-colors ${
                  phoneError ? 'border-accent' : 'border-white/5 focus:border-gold-light'
                }`}
              />
              {phoneError ? <p className="m-0 text-[13px] text-accent-light">{phoneError}</p> : null}
            </div>

            {formError ? <p className="m-0 text-[13px] text-accent-light">{formError}</p> : null}

            <div className="mt-2 flex justify-end gap-3">
              <button type="button" onClick={onClose} className="btn btn-primary-outline" disabled={isPending}>
                취소
              </button>
              <button type="button" onClick={handleSubmit} className="btn btn-gold" disabled={isPending}>
                {mode === 'add' ? '추가' : '저장'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {addressSearchOpen ? (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80"
          onClick={() => setAddressSearchOpen(false)}
        >
          <div
            className="max-h-[80vh] w-[520px] overflow-hidden rounded-2xl border border-white/5 bg-background p-8 shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="m-0 text-xl font-bold text-white">주소 검색</h2>
              <button
                type="button"
                onClick={() => setAddressSearchOpen(false)}
                className="cursor-pointer border-none bg-transparent text-neutral-600 transition-colors hover:text-white"
              >
                <FiX size={22} />
              </button>
            </div>

            <div className="flex flex-col gap-5">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(event) => setSearchKeyword(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      void searchAddress(1);
                    }
                  }}
                  placeholder="도로명, 건물명, 지번을 입력하세요"
                  autoFocus
                  className="box-border flex-1 rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3 text-[15px] text-white outline-none transition-colors focus:border-gold-light"
                />
                <button
                  type="button"
                  onClick={() => void searchAddress(1)}
                  disabled={searchLoading}
                  className="btn btn-gold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FiSearch size={16} />
                  검색
                </button>
              </div>

              {searchResults.length === 0 && !searchError && !searchLoading ? (
                <div className="flex flex-col items-center gap-3 py-8 text-neutral-500">
                  <FaMapMarkerAlt size={32} />
                  <div className="text-center text-[14px] leading-relaxed">
                    <p className="m-0">도로명, 건물명 또는 지번을 입력해 주소를 검색해주세요.</p>
                    <p className="mt-1 m-0 text-[13px] text-neutral-500">예: 테헤란로 235, 역삼동 159</p>
                  </div>
                </div>
              ) : null}

              {searchLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-neutral-700 border-t-gold-light" />
                </div>
              ) : null}

              {searchError ? <p className="m-0 py-4 text-center text-[13px] text-accent-light">{searchError}</p> : null}

              {!searchLoading && searchResults.length > 0 ? (
                <>
                  <p className="m-0 text-[13px] text-neutral-600">
                    총 <span className="font-semibold text-gold-light">{totalCount.toLocaleString()}</span>건 검색
                  </p>
                  <div className="-mx-2 flex max-h-[340px] flex-col overflow-y-auto">
                    {searchResults.map((juso, index) => (
                      <button
                        key={`${juso.zipNo}-${index}`}
                        type="button"
                        onClick={() => selectAddress(juso)}
                        className="group mx-0 w-full rounded-lg border-none bg-transparent px-4 py-3.5 text-left transition-colors hover:bg-neutral-800"
                      >
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 inline-flex flex-shrink-0 items-center rounded bg-gold-light/15 px-2 py-0.5 text-[12px] font-bold text-gold-light">
                            {juso.zipNo}
                          </span>
                          <div className="min-w-0 flex flex-col gap-1">
                            <span className="break-words text-[14px] text-white transition-colors group-hover:text-gold-light">
                              {juso.roadAddr}
                            </span>
                            <span className="break-words text-[13px] text-neutral-600">{juso.jibunAddr}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {totalPages > 1 ? (
                    <div className="flex items-center justify-center gap-1 pt-2">
                      <button
                        type="button"
                        onClick={() => void searchAddress(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className="cursor-pointer rounded border border-white/5 bg-transparent px-3 py-1.5 text-[13px] text-neutral-400 transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        이전
                      </button>
                      <span className="px-3 text-[13px] text-neutral-600">
                        {currentPage} / {totalPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => void searchAddress(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className="cursor-pointer rounded border border-white/5 bg-transparent px-3 py-1.5 text-[13px] text-neutral-400 transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        다음
                      </button>
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
