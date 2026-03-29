import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { usePostFollow } from '@/api/hooks/usePostFollow';
import { useGetSearch } from '@/api/hooks/useGetSearch';
import { useGetSearchSellers } from '@/api/hooks/useGetSearchSellers';
import LiveCard from '@/components/Main/LiveCard';
import NoItem from '@/components/common/NoItem';
import SellerStoreCard from '@/components/common/SellerStoreCard';
import type { LiveCardData, SearchMatchReason, SearchMatchType, SearchStreamResult } from '@/types';

const KEYWORD_MIN_LENGTH = 2;
const KEYWORD_MAX_LENGTH = 50;
const STREAM_RESULT_GRID_CLASS_NAME = 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4';
const STORE_RESULT_GRID_CLASS_NAME = 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4';

const MATCH_REASON_LABEL_MAP: Record<SearchMatchType, string> = {
  STREAM_TITLE: '방송 제목',
  ITEM_NAME: '상품명',
  TAG: '태그',
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

function SellerStoreCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-surface-elevated p-6">
      <div className="flex flex-col items-center gap-4">
        <div className="h-16 w-16 animate-pulse rounded-full bg-white/[0.06]" />
        <div className="flex w-full flex-col items-center gap-2">
          <div className="h-5 w-28 animate-pulse rounded-lg bg-white/[0.06]" />
          <div className="h-4 w-20 animate-pulse rounded-lg bg-white/[0.06]" />
        </div>
        <div className="h-10 w-full animate-pulse rounded-lg bg-white/[0.06]" />
        <div className="h-10 w-full animate-pulse rounded-lg bg-white/[0.06]" />
      </div>
    </div>
  );
}

function SearchSectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h3 className="text-[20px] font-semibold text-point">{title}</h3>
      <p className="text-[13px] text-white/45">{count}건</p>
    </div>
  );
}

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const keywordParam = searchParams.get('keyword')?.trim() ?? '';
  const validationMessage = useMemo(() => getValidationMessage(keywordParam), [keywordParam]);
  const isSearchEnabled = Boolean(keywordParam) && !validationMessage;
  const { mutate: toggleFollow, isPending: isFollowPending } = usePostFollow();

  const {
    data: streamResults = [],
    isLoading: isStreamLoading,
    isFetching: isStreamFetching,
    error: streamError,
  } = useGetSearch(keywordParam, isSearchEnabled);
  const {
    data: sellerResults = [],
    isLoading: isSellerLoading,
    isFetching: isSellerFetching,
    error: sellerError,
  } = useGetSearchSellers(keywordParam, isSearchEnabled);

  const totalResultCount = streamResults.length + sellerResults.length;
  const isInitialLoading = isStreamLoading || isSellerLoading;
  const isFetching = isStreamFetching || isSellerFetching;
  const hasAnyResult = totalResultCount > 0;
  const hasNoResult = isSearchEnabled && !isInitialLoading && !hasAnyResult && !streamError && !sellerError;

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-10 px-4 pb-14 pt-10 sm:px-6 lg:px-8">
      <section className="flex flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-[24px] font-semibold text-point">
              "{keywordParam}" <span className="mt-1 text-[15px] text-white/55">에 대한 검색 결과</span>
            </h2>
          </div>

          {isSearchEnabled && (
            <p className="text-[14px] text-neutral-300">
              총 <span className="font-semibold text-primary-light">{totalResultCount}</span>건
              <span className="ml-2 text-white/50">
                방송 {streamResults.length} · 상점 {sellerResults.length}
              </span>
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
            방송 제목, 상품명, 태그, 상점명으로 원하는 결과를 검색해보세요
          </div>
        )}

        {isSearchEnabled && isInitialLoading && (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <SearchSectionHeader title="방송 검색" count={0} />
              <div className={STREAM_RESULT_GRID_CLASS_NAME}>
                {Array.from({ length: 4 }, (_, index) => (
                  <SearchResultSkeleton key={index} />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <SearchSectionHeader title="상점 검색" count={0} />
              <div className={STORE_RESULT_GRID_CLASS_NAME}>
                {Array.from({ length: 4 }, (_, index) => (
                  <SellerStoreCardSkeleton key={index} />
                ))}
              </div>
            </div>
          </div>
        )}

        {isSearchEnabled && !isInitialLoading && isFetching && (
          <p className="text-[13px] text-white/45">검색 결과를 최신 상태로 불러오는 중입니다.</p>
        )}

        {hasNoResult && (
          <NoItem
            message="검색 결과가 없습니다"
            className="rounded-(--radius-panel) border border-white/8 bg-white/[0.03] px-6"
            textClassName="text-[18px] font-semibold text-point"
          />
        )}

        {!isInitialLoading && isSearchEnabled && !hasNoResult && (
          <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-4">
              <SearchSectionHeader title="방송 검색" count={streamResults.length} />

              {streamError ? (
                <div className="rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-[14px] text-accent-light">
                  방송 검색 결과를 불러오지 못했습니다
                </div>
              ) : streamResults.length > 0 ? (
                <div className={STREAM_RESULT_GRID_CLASS_NAME}>
                  {streamResults.map((result) => (
                    <div key={result.streamId} className="flex flex-col gap-4">
                      <LiveCard stream={toLiveCardStream(result)} className="max-w-none" />

                      <div className="rounded-(--radius-panel) border border-white/8 bg-white/[0.03] p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <p className="text-[14px] font-semibold text-point">매칭 사유</p>
                          <p className="text-[12px] text-white/45">{result.matchReasons.length}개</p>
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
              ) : (
                <NoItem
                  message="방송 검색 결과가 없습니다"
                  className="rounded-(--radius-panel) border border-white/8 bg-white/[0.03] px-5"
                  textClassName="text-[14px] text-white/50"
                />
              )}
            </div>

            <div className="flex flex-col gap-4">
              <SearchSectionHeader title="상점 검색" count={sellerResults.length} />

              {sellerError ? (
                <div className="rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-[14px] text-accent-light">
                  상점 검색 결과를 불러오지 못했습니다
                </div>
              ) : sellerResults.length > 0 ? (
                <div className={STORE_RESULT_GRID_CLASS_NAME}>
                  {sellerResults.map((seller) => (
                    <SellerStoreCard
                      key={seller.sellerId}
                      seller={{
                        sellerId: seller.sellerId,
                        shopName: seller.shopName,
                        profileImage: seller.profileImage,
                        intro: seller.intro,
                        rating: seller.rating,
                        isFollowed: seller.isFollowed,
                      }}
                      highlightKeyword={keywordParam}
                      onToggleFollow={(sellerId) => toggleFollow({ targetSellerId: sellerId })}
                      isFollowActionPending={isFollowPending}
                    />
                  ))}
                </div>
              ) : (
                <NoItem
                  message="상점 검색 결과가 없습니다"
                  className="rounded-(--radius-panel) border border-white/8 bg-white/[0.03] px-5"
                  textClassName="text-[14px] text-white/50"
                />
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
