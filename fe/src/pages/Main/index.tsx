import { useRef, useState } from 'react';

import { useGetMain } from '@/api/hooks/useGetMain';
import type { MainStreamSort } from '@/api/hooks/useGetMain';
import { useGetNewSellerRecommendedStreams } from '@/api/hooks/useGetNewSellerRecommendedStreams';
import { useGetSellerRanking } from '@/api/hooks/useGetSellerRanking';
import AllLiveSection from '@/components/Main/AllLiveSection';
import FollowingBanner from '@/components/Main/FollowingBanner';
import NewSellerLiveSection from '@/components/Main/NewSellerLiveSection';
import ScheduledStreamCarousel from '@/components/Main/ScheduledStreamCarousel';
import MainSideBar from '@/components/Main/SideBar';
import {
  PAGE_SIZE,
  SCHEDULED_SECTION_SIZE,
  SORT_OPTIONS,
  getScheduledOrderTime,
  mapNewSellerStreamToLiveCard,
  sortStreams,
} from '@/utils/mainStreamSection';
import type { SideBarItem } from '@/types';
import useInfiniteScrollTrigger from '@/hooks/useInfiniteScrollTrigger';
import useInViewOnce from '@/hooks/useInViewOnce';

function DeferredSectionPlaceholder({ cardCount = 3 }: { cardCount?: number }) {
  return (
    <div className="rounded-(--radius-section) bg-background px-6 pb-8 pt-6">
      <div className="mb-6 space-y-2">
        <div className="h-8 w-56 animate-pulse rounded-xl bg-white/8" />
        <div className="h-4 w-72 animate-pulse rounded-lg bg-white/6" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: cardCount }, (_, index) => (
          <div key={index} className="h-52 animate-pulse rounded-3xl bg-surface-elevated" />
        ))}
      </div>
    </div>
  );
}

export default function MainPage() {
  const [selectedCategoryItemId, setSelectedCategoryItemId] = useState<string>('ALL');
  const [allLiveSortFilter, setAllLiveSortFilter] = useState<MainStreamSort>('LATEST');
  const isLoggedIn = Boolean(localStorage.getItem('accessToken'));

  const selectedCategory = selectedCategoryItemId !== 'ALL' ? selectedCategoryItemId : undefined;
  const allLiveSortLabel = SORT_OPTIONS.find((option) => option.value === allLiveSortFilter)?.label ?? '';

  const { data: rankingData = [] } = useGetSellerRanking();
  const {
    data: followingLiveData,
    fetchNextPage: fetchFollowingLiveNextPage,
    hasNextPage: hasFollowingLiveNextPage,
    isFetchingNextPage: isFetchingFollowingLiveNextPage,
  } = useGetMain({
    type: 'FOLLOWING',
    category: selectedCategory,
    status: 'LIVE',
    sort: 'LATEST',
    size: 6,
    enabled: isLoggedIn,
  });
  const scheduledSectionRef = useRef<HTMLDivElement | null>(null);
  const allLiveSectionRef = useRef<HTMLDivElement | null>(null);
  const shouldLoadScheduledSection = useInViewOnce(scheduledSectionRef);
  const shouldLoadAllLiveSection = useInViewOnce(allLiveSectionRef);
  const {
    data: allLiveData,
    fetchNextPage: fetchAllLiveNextPage,
    hasNextPage: hasAllLiveNextPage,
    isFetchingNextPage: isFetchingAllLiveNextPage,
    isPending: isAllLivePending,
  } = useGetMain({
    type: 'ALL',
    category: selectedCategory,
    status: 'LIVE',
    sort: allLiveSortFilter,
    size: PAGE_SIZE,
    enabled: shouldLoadAllLiveSection,
  });
  const {
    data: scheduledLiveData,
    fetchNextPage: fetchScheduledLiveNextPage,
    hasNextPage: hasScheduledLiveNextPage,
    isFetchingNextPage: isFetchingScheduledLiveNextPage,
    isPending: isScheduledPending,
  } = useGetMain({
    type: 'ALL',
    category: selectedCategory,
    status: 'SCHEDULED',
    sort: 'LATEST',
    size: SCHEDULED_SECTION_SIZE,
    enabled: shouldLoadScheduledSection,
  });
  const { data: newSellerLiveData } = useGetNewSellerRecommendedStreams({
    limit: PAGE_SIZE,
  });

  const allLiveTriggerRef = useRef<HTMLDivElement | null>(null);

  useInfiniteScrollTrigger({
    fetchNextPage: fetchAllLiveNextPage,
    hasNextPage: hasAllLiveNextPage,
    isFetchingNextPage: isFetchingAllLiveNextPage,
    triggerRef: allLiveTriggerRef,
  });

  const followingBroadcasts = sortStreams(followingLiveData?.pages.flatMap((page) => page.content) ?? [], 'LATEST');

  const recommendedBroadcasts = (newSellerLiveData ?? []).map(mapNewSellerStreamToLiveCard);

  const scheduledBroadcasts = [...(scheduledLiveData?.pages.flatMap((page) => page.content) ?? [])]
    .filter((stream) => (selectedCategory ? stream.category === selectedCategory : true))
    .sort((a, b) => getScheduledOrderTime(a) - getScheduledOrderTime(b));

  const allLiveBroadcasts = sortStreams(
    (allLiveData?.pages.flatMap((page) => page.content) ?? []).filter((stream) =>
      selectedCategory ? stream.category === selectedCategory : true,
    ),
    allLiveSortFilter,
  );

  const handleCategoryClick = (item: SideBarItem) => {
    setSelectedCategoryItemId(item.id);
  };

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-6 pt-8 xl:flex-row">
      <MainSideBar activeItemId={selectedCategoryItemId} onItemClick={handleCategoryClick} rankingItems={rankingData} />

      <div className="flex min-w-0 flex-1 flex-col gap-12">
        {isLoggedIn && (
          <FollowingBanner
            streams={followingBroadcasts}
            hasNextPage={hasFollowingLiveNextPage}
            isFetchingNextPage={isFetchingFollowingLiveNextPage}
            fetchNextPage={fetchFollowingLiveNextPage}
          />
        )}

        <NewSellerLiveSection streams={recommendedBroadcasts} />

        <div ref={scheduledSectionRef}>
          {!shouldLoadScheduledSection || isScheduledPending ? (
            <DeferredSectionPlaceholder />
          ) : (
            <ScheduledStreamCarousel
              streams={scheduledBroadcasts}
              hasNextPage={hasScheduledLiveNextPage}
              isFetchingNextPage={isFetchingScheduledLiveNextPage}
              fetchNextPage={fetchScheduledLiveNextPage}
            />
          )}
        </div>

        <div ref={allLiveSectionRef}>
          {!shouldLoadAllLiveSection || isAllLivePending ? (
            <DeferredSectionPlaceholder cardCount={6} />
          ) : (
            <AllLiveSection
              streams={allLiveBroadcasts}
              selectedSortLabel={allLiveSortLabel}
              sortFilter={allLiveSortFilter}
              onSortChange={setAllLiveSortFilter}
              hasNextPage={hasAllLiveNextPage}
              isFetchingNextPage={isFetchingAllLiveNextPage}
              triggerRef={allLiveTriggerRef}
            />
          )}
        </div>
      </div>
    </div>
  );
}
