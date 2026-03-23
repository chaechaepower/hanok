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
} from '@/components/Main/mainStreamSectionUtils';
import useInfiniteScrollTrigger from '@/components/Main/useInfiniteScrollTrigger';
import type { SideBarItem } from '@/types';

export default function MainPage() {
  const [selectedCategoryItemId, setSelectedCategoryItemId] = useState<string>('ALL');
  const [allLiveSortFilter, setAllLiveSortFilter] = useState<MainStreamSort>('LATEST');
  const isLoggedIn = Boolean(localStorage.getItem('accessToken'));

  const selectedCategory = selectedCategoryItemId !== 'ALL' ? selectedCategoryItemId : undefined;
  const allLiveSortLabel = SORT_OPTIONS.find((option) => option.value === allLiveSortFilter)?.label ?? '';

  const { data: rankingData = [] } = useGetSellerRanking();
  const { data: followingLiveData } = useGetMain({
    type: 'FOLLOWING',
    category: selectedCategory,
    status: 'LIVE',
    sort: 'LATEST',
    size: 20,
  });
  const {
    data: allLiveData,
    fetchNextPage: fetchAllLiveNextPage,
    hasNextPage: hasAllLiveNextPage,
    isFetchingNextPage: isFetchingAllLiveNextPage,
  } = useGetMain({
    type: 'ALL',
    category: selectedCategory,
    status: 'LIVE',
    sort: allLiveSortFilter,
    size: PAGE_SIZE,
  });
  const { data: scheduledLiveData } = useGetMain({
    type: 'ALL',
    category: selectedCategory,
    status: 'SCHEDULED',
    sort: 'LATEST',
    size: SCHEDULED_SECTION_SIZE,
  });
  const {
    data: newSellerLiveData,
  } = useGetNewSellerRecommendedStreams({
    size: PAGE_SIZE,
  });

  const allLiveTriggerRef = useRef<HTMLDivElement | null>(null);

  useInfiniteScrollTrigger({
    fetchNextPage: fetchAllLiveNextPage,
    hasNextPage: hasAllLiveNextPage,
    isFetchingNextPage: isFetchingAllLiveNextPage,
    triggerRef: allLiveTriggerRef,
  });

  const followingBroadcasts = sortStreams(
    followingLiveData?.pages.flatMap((page) => page.content) ?? [],
    'LATEST',
  );

  const recommendedBroadcasts = (newSellerLiveData?.pages.flatMap((page) => page.content) ?? []).map(
    mapNewSellerStreamToLiveCard,
  );

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
      <MainSideBar
        activeItemId={selectedCategoryItemId}
        onItemClick={handleCategoryClick}
        rankingItems={rankingData}
      />

      <div className="flex min-w-0 flex-1 flex-col gap-6">
        {isLoggedIn && <FollowingBanner streams={followingBroadcasts} />}

        <NewSellerLiveSection streams={recommendedBroadcasts} />

        <ScheduledStreamCarousel streams={scheduledBroadcasts} />

        <AllLiveSection
          streams={allLiveBroadcasts}
          selectedSortLabel={allLiveSortLabel}
          sortFilter={allLiveSortFilter}
          onSortChange={setAllLiveSortFilter}
          hasNextPage={hasAllLiveNextPage}
          isFetchingNextPage={isFetchingAllLiveNextPage}
          triggerRef={allLiveTriggerRef}
        />
      </div>
    </div>
  );
}
