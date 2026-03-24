import { FaMapMarkerAlt } from 'react-icons/fa';
import { FiSearch } from 'react-icons/fi';

import type { JusoResult } from '@/types';

type Props = {
  isOpen: boolean;
  searchKeyword: string;
  searchResults: JusoResult[];
  searchLoading: boolean;
  searchError: string;
  currentPage: number;
  totalCount: number;
  totalPages: number;
  onClose: () => void;
  onKeywordChange: (value: string) => void;
  onSearch: (page?: number) => Promise<void>;
  onSelectAddress: (juso: JusoResult) => void;
};

export default function AddressSearchModal({
  isOpen,
  searchKeyword,
  searchResults,
  searchLoading,
  searchError,
  currentPage,
  totalCount,
  totalPages,
  onClose,
  onKeywordChange,
  onSearch,
  onSelectAddress,
}: Props) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80" onClick={onClose}>
      <div
        className="max-h-[80vh] w-[520px] overflow-hidden rounded-2xl border border-white/5 bg-background p-8 shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5">
          <h2 className="m-0 text-xl font-bold text-white">주소 검색</h2>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchKeyword}
              onChange={(event) => onKeywordChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  void onSearch(1);
                }
              }}
              placeholder="도로명, 건물명 또는 지번을 입력하세요"
              autoFocus
              className="box-border flex-1 rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3 text-[15px] text-white outline-none transition-colors focus:border-gold-light"
            />
            <button
              type="button"
              onClick={() => void onSearch(1)}
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
                <p className="m-0">도로명, 건물명 또는 지번을 입력해 주소를 검색해 주세요</p>
                <p className="m-0 mt-1 text-[13px] text-neutral-500">예: 테헤란로 235, 역삼동 159</p>
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
                    onClick={() => onSelectAddress(juso)}
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
                    onClick={() => void onSearch(currentPage - 1)}
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
                    onClick={() => void onSearch(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="cursor-pointer rounded border border-white/5 bg-transparent px-3 py-1.5 text-[13px] text-neutral-400 transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    다음
                  </button>
                </div>
              ) : null}

              <div className="mt-5 flex justify-end">
                <button type="button" onClick={onClose} className="btn btn-primary-outline">
                  닫기
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
