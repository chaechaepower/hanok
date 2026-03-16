import { useState, useCallback } from 'react';
import { FiX, FiSearch } from 'react-icons/fi';
import { FaMapMarkerAlt } from 'react-icons/fa';
import type { Address, AddressFormState, AddressModalMode, JusoResult } from '@/types';
import { useGetAddresses } from '@/api/hooks/useGetAddresses';
import { usePostAddress } from '@/api/hooks/usePostAddress';
import { usePatchAddress } from '@/api/hooks/usePatchAddress';
import { useDeleteAddress } from '@/api/hooks/useDeleteAddress';

const JUSO_API_KEY = import.meta.env.VITE_JUSO_API_KEY as string;

const EMPTY_FORM: AddressFormState = {
  addressName: '',
  recipientName: '',
  postalCode: '',
  address: '',
  addressDetail: '',
  phone: '010',
};

export default function ShippingSection() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<AddressModalMode>('add');
  const [editId, setEditId] = useState<number | null>(null);
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
  const { data, isLoading } = useGetAddresses();
  const { mutate: createAddress } = usePostAddress();
  const { mutate: updateAddress } = usePatchAddress();
  const { mutate: removeAddress } = useDeleteAddress();

  const addresses = data ?? [];

  const openAddModal = () => {
    setForm(EMPTY_FORM);
    setFormError('');
    setPhoneError('');
    setModalMode('add');
    setEditId(null);
    setModalOpen(true);
  };

  const openEditModal = (addr: Address) => {
    setForm({
      addressName: addr.addressName,
      recipientName: addr.recipientName,
      postalCode: String(addr.postalCode),
      address: addr.address,
      addressDetail: addr.addressDetail || '',
      phone: addr.phone,
    });
    setFormError('');
    setPhoneError('');
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
    if (!form.recipientName || !form.postalCode || !form.address || !form.phone || !form.addressName) {
      setFormError('모든 항목을 입력해주세요.');
      return;
    }
    if (!/^01[016789]-?\d{3,4}-?\d{4}$/.test(form.phone)) {
      setPhoneError('유효하지 않은 휴대폰 번호입니다.');
      return;
    }

    if (modalMode === 'add') {
      createAddress(
        {
          addressName: form.addressName,
          postalCode: Number(form.postalCode),
          address: form.address,
          addressDetail: form.addressDetail,
          phone: form.phone,
          recipientName: form.recipientName,
          isDefault: addresses.length === 0,
        },
        { onSuccess: () => setModalOpen(false) },
      );
    } else {
      updateAddress(
        {
          id: editId!,
          addressName: form.addressName,
          postalCode: Number(form.postalCode),
          address: form.address,
          addressDetail: form.addressDetail,
          phone: form.phone,
          recipientName: form.recipientName,
        },
        { onSuccess: () => setModalOpen(false) },
      );
    }
  };

  const searchAddress = useCallback(
    async (page: number = 1) => {
      if (!searchKeyword.trim()) {
        setSearchError('검색어를 입력해주세요.');
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

  const totalPages = Math.ceil(totalCount / countPerPage);

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
          className="flex-shrink-0 py-2 px-4 bg-[#0a0a0a] border border-[#3a3a50] text-white text-sm font-semibold rounded-full cursor-pointer hover:bg-[#2a2a3a] transition-colors"
        >
          + 새 배송지 추가
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="w-full box-border border border-[#d9b36d]/30 rounded-2xl p-12 bg-[#050505] flex flex-col items-center gap-4">
          <FaMapMarkerAlt size={40} className="text-[#333]" />
          <p className="m-0 text-[#555] text-[15px]">등록된 배송지가 없습니다.</p>
        </div>
      ) : (
        <div className="w-full box-border border border-[#d9b36d]/30 rounded-2xl bg-[#050505] overflow-hidden">
          {[...addresses]
            .sort((a, b) => Number(b.isDefault) - Number(a.isDefault))
            .map((addr, idx) => (
              <div key={addr.id} className={`p-8 flex flex-col gap-2 ${idx !== 0 ? 'border-t border-[#d9b36d]/20' : ''}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-bold text-[16px]">{addr.addressName}</span>
                  {addr.isDefault && (
                    <span className="px-2.5 py-0.5 bg-white text-[#111] text-xs font-bold rounded-full">기본</span>
                  )}
                </div>

                <p className="m-0 text-[15px] text-[#ddd]">
                  {addr.recipientName}&nbsp;&nbsp;({addr.postalCode})
                </p>
                <p className="m-0 text-[15px] text-[#ddd]">
                  {addr.address}{addr.addressDetail ? ` ${addr.addressDetail}` : ''}
                </p>
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
            className="bg-[#0a0a0a] border border-white/5 rounded-2xl w-[500px] p-8 flex flex-col gap-5 shadow-[0_8px_30px_rgba(0,0,0,0.5)] max-h-[90vh] overflow-y-auto"
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

            <div className="flex flex-col gap-2">
              <label className="text-[14px] text-[#aaa] font-medium">받는 분</label>
              <input
                type="text"
                value={form.recipientName}
                onChange={(e) => setForm((prev) => ({ ...prev, recipientName: e.target.value }))}
                placeholder="받는 분 이름"
                className="w-full box-border bg-white/[0.02] text-white border border-white/5 rounded-lg px-4 py-3 text-[15px] outline-none focus:border-[#d9b36d] transition-colors"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[14px] text-[#aaa] font-medium">배송지 별칭</label>
              <input
                type="text"
                value={form.addressName}
                onChange={(e) => setForm((prev) => ({ ...prev, addressName: e.target.value }))}
                placeholder="예: 집, 회사"
                className="w-full box-border bg-white/[0.02] text-white border border-white/5 rounded-lg px-4 py-3 text-[15px] outline-none focus:border-[#d9b36d] transition-colors"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[14px] text-[#aaa] font-medium">우편번호</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.postalCode}
                  readOnly
                  placeholder="주소 검색을 이용해주세요"
                  className="flex-1 box-border bg-white/[0.02] text-white border border-white/5 rounded-lg px-4 py-3 text-[15px] outline-none cursor-default"
                />
                <button
                  type="button"
                  onClick={openAddressSearch}
                  className="flex items-center gap-1.5 px-4 py-3 bg-[#d9b36d] text-[#111] font-bold border-none rounded-lg cursor-pointer text-sm hover:bg-[#c8a45c] transition-colors whitespace-nowrap"
                >
                  <FiSearch size={16} />
                  주소 검색
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[14px] text-[#aaa] font-medium">주소</label>
              <input
                type="text"
                value={form.address}
                readOnly
                placeholder="주소 검색을 이용해주세요"
                className="w-full box-border bg-white/[0.02] text-white border border-white/5 rounded-lg px-4 py-3 text-[15px] outline-none cursor-default"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[14px] text-[#aaa] font-medium">상세 주소</label>
              <input
                type="text"
                value={form.addressDetail}
                onChange={(e) => setForm((prev) => ({ ...prev, addressDetail: e.target.value }))}
                placeholder="동/호수 등 (선택)"
                className="w-full box-border bg-white/[0.02] text-white border border-white/5 rounded-lg px-4 py-3 text-[15px] outline-none focus:border-[#d9b36d] transition-colors"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[14px] text-[#aaa] font-medium">휴대폰 번호</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => {
                  const raw = e.target.value.replace(/^010-?/, '').replace(/[^0-9]/g, '');
                  let formatted = '010';
                  if (raw.length <= 4) {
                    formatted = raw.length > 0 ? `010-${raw}` : '010';
                  } else {
                    formatted = `010-${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
                  }
                  setForm((prev) => ({ ...prev, phone: formatted }));
                  if (phoneError) setPhoneError('');
                }}
                onBlur={() => {
                  if (form.phone && !/^01[016789]-?\d{3,4}-?\d{4}$/.test(form.phone)) {
                    setPhoneError('유효하지 않은 휴대폰 번호입니다.');
                  }
                }}
                placeholder="0000-0000"
                className={`w-full box-border bg-white/[0.02] text-white border rounded-lg px-4 py-3 text-[15px] outline-none transition-colors ${phoneError ? 'border-red-500' : 'border-white/5 focus:border-[#d9b36d]'}`}
              />
              {phoneError && <p className="m-0 text-[13px] text-red-400">{phoneError}</p>}
            </div>

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

      {addressSearchOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-[1000] flex items-center justify-center"
          onClick={() => setAddressSearchOpen(false)}
        >
          <div
            className="bg-[#0a0a0a] border border-white/5 rounded-2xl w-[520px] p-8 flex flex-col gap-5 shadow-[0_8px_30px_rgba(0,0,0,0.5)] max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="m-0 text-white text-xl font-bold">도로명 주소 검색</h2>
              <button
                onClick={() => setAddressSearchOpen(false)}
                className="bg-transparent border-none text-[#888] cursor-pointer hover:text-white transition-colors"
              >
                <FiX size={22} />
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') searchAddress(1);
                }}
                placeholder="도로명, 건물명, 지번 입력"
                autoFocus
                className="flex-1 box-border bg-white/[0.02] text-white border border-white/5 rounded-lg px-4 py-3 text-[15px] outline-none focus:border-[#d9b36d] transition-colors"
              />
              <button
                onClick={() => searchAddress(1)}
                disabled={searchLoading}
                className="flex items-center gap-1.5 px-5 py-3 bg-[#d9b36d] text-[#111] font-bold border-none rounded-lg cursor-pointer text-sm hover:bg-[#c8a45c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiSearch size={16} />
                검색
              </button>
            </div>

            {searchResults.length === 0 && !searchError && !searchLoading && (
              <div className="flex flex-col items-center gap-3 py-8 text-[#666]">
                <FaMapMarkerAlt size={32} />
                <div className="text-center text-[14px] leading-relaxed">
                  <p className="m-0">도로명, 건물명 또는 지번으로 검색하세요.</p>
                  <p className="m-0 text-[13px] text-[#555] mt-1">예: 판교역로 235, 삼성동 159</p>
                </div>
              </div>
            )}

            {searchLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-3 border-[#333] border-t-[#d9b36d] rounded-full animate-spin" />
              </div>
            )}

            {searchError && <p className="m-0 text-[13px] text-red-400 text-center py-4">{searchError}</p>}

            {!searchLoading && searchResults.length > 0 && (
              <>
                <p className="m-0 text-[13px] text-[#888]">
                  총 <span className="text-[#d9b36d] font-semibold">{totalCount.toLocaleString()}</span>건의 결과
                </p>
                <div className="flex flex-col overflow-y-auto max-h-[340px] -mx-2">
                  {searchResults.map((juso, idx) => (
                    <button
                      key={idx}
                      onClick={() => selectAddress(juso)}
                      className="w-full text-left bg-transparent border-none px-4 py-3.5 cursor-pointer hover:bg-[#2a2a3a] rounded-lg transition-colors group mx-0"
                    >
                      <div className="flex items-start gap-3">
                        <span className="inline-flex items-center px-2 py-0.5 bg-[#d9b36d]/15 text-[#d9b36d] text-[12px] font-bold rounded mt-0.5 flex-shrink-0">
                          {juso.zipNo}
                        </span>
                        <div className="flex flex-col gap-1 min-w-0">
                          <span className="text-[14px] text-white group-hover:text-[#d9b36d] transition-colors break-words">
                            {juso.roadAddr}
                          </span>
                          <span className="text-[13px] text-[#777] break-words">{juso.jibunAddr}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-1 pt-2">
                    <button
                      onClick={() => searchAddress(currentPage - 1)}
                      disabled={currentPage <= 1}
                      className="px-3 py-1.5 bg-transparent border border-white/5 text-[#aaa] text-[13px] rounded cursor-pointer hover:bg-[#2a2a3a] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      이전
                    </button>
                    <span className="text-[13px] text-[#888] px-3">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => searchAddress(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      className="px-3 py-1.5 bg-transparent border border-white/5 text-[#aaa] text-[13px] rounded cursor-pointer hover:bg-[#2a2a3a] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      다음
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
