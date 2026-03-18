import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

import { useGetMain } from '@/api/hooks/useGetMain';
import type { MainStreamSort, MainStreamStatus } from '@/api/hooks/useGetMain';
import { useGetMe } from '@/api/hooks/useGetMe';
import LiveCard from '@/components/Main/LiveCard';
import { MAIN_CATEGORY_ITEMS } from '@/components/Main/SideBar';
import SideBar from '@/components/common/layouts/SideBar';
import { MdKeyboardArrowDown } from 'react-icons/md';
import { motion } from 'framer-motion';
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

  const followingBroadcasts = followingLiveData?.pages.flatMap((page) => page.content) ?? [];
  const sectionTitle = isLiveStatus ? `${meData?.nickname ?? '회원'}님의 단골 경매!` : '다음 경매를 기다려보세요!';

  return (
    <section className="mx-10 mt-6 flex flex-1 flex-col gap-6 rounded-2xl bg-surface-elevated px-8 pb-10 pt-6">
      <h2 className="text-[28px] font-semibold text-warm">{sectionTitle}</h2>
      {followingBroadcasts.length > 0 ? (
        <>
          <div className={GRID_CLASS_NAME}>
            {followingBroadcasts.map((broadcast) => (
              <LiveCard key={broadcast.streamId} stream={broadcast} />
            ))}
          </div>
          {hasFollowingNextPage && <div ref={followingTriggerRef} className="h-8 w-full" />}
          {isFetchingFollowingNextPage && <p className="text-center text-body-md text-neutral-500">불러오는 중...</p>}
        </>
      ) : (
        <p className="pt-12 text-center text-body-lg text-neutral-500">
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

  const allBroadcasts = allLiveData?.pages.flatMap((page) => page.content) ?? [];
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
        <div className="flex items-center justify-between gap-4 px-10 pt-8">
          <div className="relative inline-flex items-center rounded-xl bg-warm/6 p-1">
            {STATUS_OPTIONS.map((option) => {
              const isSelected = statusFilter === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatusFilter(option.value)}
                  className="relative z-10 rounded-lg px-4 py-2 text-subtitle-sm transition"
                >
                  {isSelected && (
                    <motion.span
                      layoutId="statusTab"
                      initial={false}
                      className="absolute inset-0 rounded-lg bg-primary"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span
                    className={`relative z-10 ${isSelected ? 'text-neutral-100' : 'text-neutral-400 hover:text-neutral-200'}`}
                  >
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div ref={sortDropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setIsSortDropdownOpen((prev) => !prev)}
              className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-primary/15 px-4 py-2 transition hover:bg-primary/25"
            >
              <span className="text-body-md font-semibold text-primary-light">{selectedSortLabel}</span>
              <span
                className={`text-caption text-point/70 transition-transform ${isSortDropdownOpen ? 'rotate-180' : ''}`}
              >
                <MdKeyboardArrowDown />
              </span>
            </button>

            {isSortDropdownOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-30 min-w-full overflow-hidden rounded-[10px] bg-primary/15 p-1 shadow-primary-glow backdrop-blur-md">
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
                      className={`flex w-full items-center justify-center rounded-lg px-3 py-2 text-center text-body-md transition ${
                        isSelected ? 'bg-primary font-semibold text-neutral-100' : 'text-neutral-300 hover:bg-warm/10'
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

        <section className="mx-10 mt-6 flex flex-1 flex-col gap-6 rounded-2xl bg-surface-elevated px-8 pb-10 pt-6">
          <h2 className="text-[28px] font-semibold text-warm">
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
              {isFetchingAllNextPage && <p className="text-center text-body-md text-neutral-500">불러오는 중...</p>}
            </>
          ) : (
            <p className="pt-12 text-center text-body-lg text-neutral-500">
              {isLiveStatus ? '현재 진행중인 경매가 없습니다.' : '예약된 경매가 없습니다.'}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
