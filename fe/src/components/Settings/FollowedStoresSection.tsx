import { useCallback, useEffect, useRef } from 'react';
import { FaStore } from 'react-icons/fa';

import { useGetFollowedStores } from '@/api/hooks/useGetFollowedStores';
import { usePostFollow } from '@/api/hooks/usePostFollow';
import SellerStoreCard from '@/components/common/SellerStoreCard';

export default function FollowedStoresSection() {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetFollowedStores();
  const { mutate: unfollow, isPending } = usePostFollow();
  const observerRef = useRef<HTMLDivElement>(null);

  const followedList = data?.pages.flatMap((page) => page.content) ?? [];
  const totalStores = data?.pages[0]?.totalElements ?? 0;

  const handleUnfollow = (sellerId: number) => {
    unfollow({ targetSellerId: sellerId });
  };

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  );

  useEffect(() => {
    const element = observerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    observer.observe(element);

    return () => observer.disconnect();
  }, [handleObserver]);

  return (
    <>
      <div className="mb-2 flex flex-col gap-2">
        <h2 className="m-0 text-2xl font-bold text-white">
          팔로우한 상점
          <span className="ml-2 text-gold-light">({totalStores})</span>
        </h2>
        <p className="m-0 text-[15px] text-neutral-400">팔로우한 상점을 확인하고 방문해 보세요!</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-700 border-t-gold-light" />
        </div>
      ) : followedList.length === 0 ? (
        <div className="flex w-full flex-col items-center gap-4 rounded-2xl bg-surface-elevated p-12">
          <FaStore size={40} className="text-neutral-700" />
          <p className="m-0 text-[15px] text-neutral-500">팔로우한 상점이 아직 없습니다</p>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
            {followedList.map(({ followId, seller }) => (
              <SellerStoreCard
                key={followId}
                seller={{
                  sellerId: seller.sellerId,
                  shopName: seller.nickname,
                  profileImage: seller.profileImageUri,
                  rating: seller.rating,
                  isFollowed: true,
                }}
                onToggleFollow={handleUnfollow}
                isFollowActionPending={isPending}
              />
            ))}
          </div>

          <div ref={observerRef} className="h-1" />

          {isFetchingNextPage && (
            <div className="flex items-center justify-center py-4">
              <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-neutral-700 border-t-gold-light" />
            </div>
          )}
        </div>
      )}
    </>
  );
}
