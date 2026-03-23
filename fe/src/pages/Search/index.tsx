import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useGetSearch } from '@/api/hooks/useGetSearch';
import LiveCard from '@/components/Main/LiveCard';
import type { LiveCardData, SearchMatchReason, SearchMatchType, SearchStreamResult } from '@/types';

const KEYWORD_MIN_LENGTH = 2;
const KEYWORD_MAX_LENGTH = 50;
const RESULT_GRID_CLASS_NAME = 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5';

const MATCH_REASON_LABEL_MAP: Record<SearchMatchType, string> = {
  STREAM_TITLE: '라이브',
  ITEM_NAME: '물품명',
  TAG: '해시태그',
};

const getValidationMessage = (keyword: string) => {
  if (!keyword) {
    return null;
  }

  if (keyword.length < KEYWORD_MIN_LENGTH) {
    return `검색어는 ${KEYWORD_MIN_LENGTH}자 이상 입력해주세요.`;
  }

  if (keyword.length > KEYWORD_MAX_LENGTH) {
    return `검색어는 ${KEYWORD_MAX_LENGTH}자 이하로 입력해주세요.`;
  }

  return null;
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const toLiveCardStream = (result: SearchStreamResult): LiveCardData => ({
  streamId: result.streamId,
  title: result.title,
  category: result.category,
  thumbnailUri: result.thumbnail,
  streamStatus: result.status,
  viewerCount: result.viewerCount,
  scheduledAt: result.scheduledAt,
  startedAt: null,
  seller: result.seller,
});

function SearchResultReasonChip({ reason, keyword }: { reason: SearchMatchReason; keyword: string }) {
  const trimmedKeyword = keyword.trim();
  const highlightedValue = !trimmedKeyword
    ? reason.matchedValue
    : reason.matchedValue
        .split(new RegExp(`(${escapeRegExp(trimmedKeyword)})`, 'gi'))
        .filter(Boolean)
        .map((part, index) =>
          part.toLowerCase() === trimmedKeyword.toLowerCase() ? (
            <strong key={`${reason.type}-${reason.matchedValue}-${index}`} className="font-semibold text-gold-light">
              {part}
            </strong>
          ) : (
            <span key={`${reason.type}-${reason.matchedValue}-${index}`}>{part}</span>
          ),
        );

  return (
    <li className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[12px] leading-none text-neutral-200">
      <span className="text-primary-light">{MATCH_REASON_LABEL_MAP[reason.type]}</span>
      <span className="mx-1.5 text-white/20">|</span>
      <span>{highlightedValue}</span>
    </li>
  );
}

function SearchResultSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-(--radius-panel) border border-white/8 bg-white/[0.03]">
        <div className="aspect-3/4 animate-pulse bg-white/[0.05]" />
        <div className="space-y-3 p-5">
          <div className="h-6 w-20 animate-pulse rounded-lg bg-white/[0.06]" />
          <div className="h-5 w-3/4 animate-pulse rounded-lg bg-white/[0.06]" />
          <div className="h-4 w-2/3 animate-pulse rounded-lg bg-white/[0.06]" />
        </div>
      </div>
      <div className="rounded-(--radius-panel) border border-white/8 bg-white/[0.03] p-4">
        <div className="mb-3 h-4 w-24 animate-pulse rounded-lg bg-white/[0.06]" />
        <div className="flex gap-2">
          <div className="h-8 w-24 animate-pulse rounded-full bg-white/[0.06]" />
          <div className="h-8 w-28 animate-pulse rounded-full bg-white/[0.06]" />
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const keywordParam = searchParams.get('keyword')?.trim() ?? '';
  const validationMessage = useMemo(() => getValidationMessage(keywordParam), [keywordParam]);
  const isSearchEnabled = Boolean(keywordParam) && !validationMessage;
  const { data: results = [], isLoading, isFetching, error } = useGetSearch(keywordParam, isSearchEnabled);

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-10 px-4 pb-14 pt-10 sm:px-6 lg:px-8">
      <section className="flex flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-[24px] font-semibold text-point">검색 결과</h2>
            <p className="mt-1 text-[14px] text-white/55">
              {keywordParam
                ? `검색어 "${keywordParam}" 기준으로 일치한 라이브를 보여줍니다`
                : '검색어를 입력하면 관련 라이브를 바로 확인할 수 있습니다'}
            </p>
          </div>

          {isSearchEnabled && (
            <p className="text-[14px] text-neutral-300">
              총 <span className="font-semibold text-primary-light">{results.length}</span>개
            </p>
          )}
        </div>

        {validationMessage && (
          <div className="rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-[14px] text-accent-light">
            {validationMessage}
          </div>
        )}

        {!keywordParam && (
          <div className="rounded-(--radius-panel) border border-dashed border-white/10 bg-white/[0.03] px-6 py-14 text-center text-white/55">
            라이브 제목, 상품명, 해시태그 중 하나를 입력해 검색을 시작하세요.
          </div>
        )}

        {isSearchEnabled && isLoading && (
          <div className={RESULT_GRID_CLASS_NAME}>
            {Array.from({ length: 6 }, (_, index) => (
              <SearchResultSkeleton key={index} />
            ))}
          </div>
        )}

        {isSearchEnabled && !isLoading && error && (
          <div className="rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-[14px] text-accent-light">
            검색 결과를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
          </div>
        )}

        {isSearchEnabled && !isLoading && !error && results.length === 0 && (
          <div className="rounded-(--radius-panel) border border-white/8 bg-white/[0.03] px-6 py-14 text-center">
            <p className="text-[18px] font-semibold text-point">일치하는 라이브가 없습니다</p>
            <p className="mt-2 text-[14px] text-white/50">다른 키워드나 상품명, 해시태그 조합으로 다시 검색해보세요</p>
          </div>
        )}

        {isSearchEnabled && !isLoading && !error && results.length > 0 && (
          <>
            {isFetching && <p className="text-[13px] text-white/45">최신 검색 결과를 확인하는 중입니다</p>}
            <div className={RESULT_GRID_CLASS_NAME}>
              {results.map((result) => (
                <div key={result.streamId} className="flex flex-col gap-4">
                  <LiveCard stream={toLiveCardStream(result)} className="max-w-none" />

                  <div className="rounded-(--radius-panel) border border-white/8 bg-white/[0.03] p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-[14px] font-semibold text-point">탐색 결과</p>
                      <p className="text-[12px] text-white/45">{result.matchReasons.length}건 일치</p>
                    </div>

                    <ul className="flex flex-wrap gap-2">
                      {result.matchReasons.map((reason) => (
                        <SearchResultReasonChip
                          key={`${result.streamId}-${reason.type}-${reason.matchedValue}`}
                          reason={reason}
                          keyword={keywordParam}
                        />
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
