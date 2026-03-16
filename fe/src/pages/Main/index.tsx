import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

import { useGetMain } from '@/api/hooks/useGetMain';
import type { MainStreamSort, MainStreamStatus } from '@/api/hooks/useGetMain';
import { useGetMe } from '@/api/hooks/useGetMe';
import LiveCard from '@/components/Main/LiveCard';
import { MAIN_CATEGORY_ITEMS } from '@/components/Main/SideBar';
import SideBar from '@/components/common/layouts/SideBar';
import { MdKeyboardArrowDown } from 'react-icons/md';
import type { SideBarItem } from '@/types';

const PAGE_SIZE = 10;
const GRID_CLASS_NAME = 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5';
const STATUS_OPTIONS: Array<{ value: MainStreamStatus; label: string }> = [
  { value: 'LIVE', label: '라이브 중' },
  { value: 'SCHEDULED', label: '방송 예정' },
];
const SORT_OPTIONS: Array<{ value: MainStreamSort; label: string }> = [
  { value: 'LATEST', label: '최신순' },
  { value: 'VIEWER_COUNT', label: '시청자순' },
];

type InfiniteScrollTriggerParams = {
  fetchNextPage: () => Promise<unknown>;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  triggerRef: RefObject<HTMLDivElement | null>;
};

const useInfiniteScrollTrigger = ({
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  triggerRef,
}: InfiniteScrollTriggerParams) => {
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) {
      return;
    }

    const target = triggerRef.current;
    if (!target) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) {
          return;
        }
        observer.unobserve(target);
        void fetchNextPage();
      },
      { rootMargin: '280px 0px' },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, triggerRef]);
};

type FollowingSectionProps = {
  category?: string;
  isLiveStatus: boolean;
  sortFilter: MainStreamSort;
  statusFilter: MainStreamStatus;
};

const FollowingSection = ({ category, isLiveStatus, sortFilter, statusFilter }: FollowingSectionProps) => {
  const isLoggedIn = Boolean(localStorage.getItem('accessToken'));
  const { data: meData } = useGetMe({ enabled: isLoggedIn });
  const {
    data: followingLiveData,
    fetchNextPage: fetchFollowingNextPage,
    hasNextPage: hasFollowingNextPage,
    isFetchingNextPage: isFetchingFollowingNextPage,
  } = useGetMain({
    type: 'FOLLOWING',
    category,
    status: statusFilter,
    sort: sortFilter,
    size: PAGE_SIZE,
  });

  const followingTriggerRef = useRef<HTMLDivElement | null>(null);

  useInfiniteScrollTrigger({
    fetchNextPage: fetchFollowingNextPage,
    hasNextPage: hasFollowingNextPage,
    isFetchingNextPage: isFetchingFollowingNextPage,
    triggerRef: followingTriggerRef,
  });

  const followingBroadcasts = followingLiveData.pages.flatMap((page) => page.content);
  const sectionTitle = isLiveStatus ? `${meData?.nickname ?? '회원'}님의 단골 경매!` : '다음 경매를 기다려보세요!';

  return (
    <section className="flex flex-1 flex-col gap-8 pb-10 pl-4 pr-8 pt-6">
      <h2 className="text-[24px] font-semibold text-point">{sectionTitle}</h2>
      {followingBroadcasts.length > 0 ? (
        <>
          <div className={GRID_CLASS_NAME}>
            {followingBroadcasts.map((broadcast) => (
              <LiveCard key={broadcast.streamId} stream={broadcast} />
            ))}
          </div>
          {hasFollowingNextPage && <div ref={followingTriggerRef} className="h-8 w-full" />}
          {isFetchingFollowingNextPage && <p className="text-center text-[14px] text-white/60">불러오는 중...</p>}
        </>
      ) : (
        <p className="pt-12 text-center text-[16px] text-white/60">
          {isLiveStatus ? '현재 진행중인 경매가 없습니다.' : '예약된 경매가 없습니다.'}
        </p>
      )}
    </section>
  );
};

export default function MainPage() {
  const [selectedCategoryItemId, setSelectedCategoryItemId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<MainStreamStatus>('LIVE');
  const [sortFilter, setSortFilter] = useState<MainStreamSort>('LATEST');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const isLoggedIn = Boolean(localStorage.getItem('accessToken'));

  const selectedCategory = selectedCategoryItemId !== 'ALL' ? selectedCategoryItemId : undefined;
  const selectedSortLabel = SORT_OPTIONS.find((option) => option.value === sortFilter)?.label ?? '';

  const handleCategoryClick = (item: SideBarItem) => {
    setSelectedCategoryItemId(item.id);
  };

  const {
    data: allLiveData,
    fetchNextPage: fetchAllNextPage,
    hasNextPage: hasAllNextPage,
    isFetchingNextPage: isFetchingAllNextPage,
  } = useGetMain({
    type: 'ALL',
    category: selectedCategory,
    status: statusFilter,
    sort: sortFilter,
    size: PAGE_SIZE,
  });

  const allTriggerRef = useRef<HTMLDivElement | null>(null);
  const sortDropdownRef = useRef<HTMLDivElement | null>(null);

  useInfiniteScrollTrigger({
    fetchNextPage: fetchAllNextPage,
    hasNextPage: hasAllNextPage,
    isFetchingNextPage: isFetchingAllNextPage,
    triggerRef: allTriggerRef,
  });

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!sortDropdownRef.current?.contains(target)) {
        setIsSortDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const allBroadcasts = allLiveData.pages.flatMap((page) => page.content);
  const isLiveStatus = statusFilter === 'LIVE';

  return (
    <div className="flex w-full">
      <SideBar
        items={MAIN_CATEGORY_ITEMS}
        activeItemId={selectedCategoryItemId}
        onItemClick={handleCategoryClick}
        className="min-h-[calc(100vh-108px)]"
      />
      <div className="flex w-full flex-col">
        <div className="flex items-center justify-between gap-4 pb-0 pl-4 pr-8 pt-8">
          <div className="inline-flex items-center rounded-xl bg-white/6 p-1">
            {STATUS_OPTIONS.map((option) => {
              const isSelected = statusFilter === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatusFilter(option.value)}
                  className={`rounded-lg px-4 py-2 text-[13px] font-medium transition ${
                    isSelected ? 'bg-white text-[#111827]' : 'text-point/75 hover:text-point'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <div ref={sortDropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setIsSortDropdownOpen((prev) => !prev)}
              className="inline-flex min-w-33 items-center justify-between gap-3 rounded-xl border border-white/15 px-3 py-2 shadow-[0_8px_20px_rgba(0,0,0,0.25)] transition hover:border-white/30"
            >
              <div className="flex flex-col items-start leading-none">
                <span className="mt-1 text-[14px] font-semibold text-point">{selectedSortLabel}</span>
              </div>
              <span
                className={`text-[11px] text-point/70 transition-transform ${isSortDropdownOpen ? 'rotate-180' : ''}`}
              >
                <MdKeyboardArrowDown />
              </span>
            </button>

            {isSortDropdownOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-33 overflow-hidden rounded-xl border border-white/15  p-1 shadow-[0_14px_30px_rgba(0,0,0,0.45)] backdrop-blur-md">
                {SORT_OPTIONS.map((option) => {
                  const isSelected = sortFilter === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setSortFilter(option.value);
                        setIsSortDropdownOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[14px] transition ${
                        isSelected ? 'bg-white font-semibold text-[#111827]' : 'text-point/85 hover:bg-white/10'
                      }`}
                    >
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {isLoggedIn && (
          <FollowingSection
            category={selectedCategory}
            isLiveStatus={isLiveStatus}
            sortFilter={sortFilter}
            statusFilter={statusFilter}
          />
        )}

        <section className="flex flex-1 flex-col gap-8 py-10 pl-4 pr-8">
          <h2 className="text-[24px] font-semibold text-point">
            {isLiveStatus ? '현재 진행 중인 경매!' : '예정된 경매를 살펴보세요'}
          </h2>
          {allBroadcasts.length > 0 ? (
            <>
              <div className={GRID_CLASS_NAME}>
                {allBroadcasts.map((broadcast) => (
                  <LiveCard key={broadcast.streamId} stream={broadcast} />
                ))}
              </div>
              {hasAllNextPage && <div ref={allTriggerRef} className="h-8 w-full" />}
              {isFetchingAllNextPage && <p className="text-center text-[14px] text-white/60">불러오는 중...</p>}
            </>
          ) : (
            <p className="pt-12 text-center text-[16px] text-white/60">
              {isLiveStatus ? '현재 진행중인 경매가 없습니다.' : '예약된 경매가 없습니다.'}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
