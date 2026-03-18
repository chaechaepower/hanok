import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaStore } from 'react-icons/fa';
import { useGetFollowedStores } from '@/api/hooks/useGetFollowedStores';
import { usePostFollow } from '@/api/hooks/usePostFollow';

export default function FollowedStoresSection() {
  const navigate = useNavigate();
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
    const el = observerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleObserver]);

  return (
    <>
      <div className="flex flex-col gap-2 mb-2">
        <h2 className="m-0 text-2xl font-bold text-white">
          팔로우한 스토어
          <span className="ml-2 text-gold-light">({totalStores})</span>
        </h2>
        <p className="m-0 text-[15px] text-neutral-400">단골 스토어의 소식을 받아보세요.</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-neutral-700 border-t-gold-light rounded-full animate-spin" />
        </div>
      ) : followedList.length === 0 ? (
        <div className="w-full box-border rounded-2xl p-12 bg-surface-elevated flex flex-col items-center gap-4">
          <FaStore size={40} className="text-neutral-700" />
          <p className="m-0 text-neutral-500 text-[15px]">팔로우한 스토어가 없습니다.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {followedList.map(({ followId, seller }) => (
            <div
              key={followId}
              onClick={() => navigate(`/profile/${seller.sellerId}`)}
              className="w-full box-border rounded-2xl p-6 bg-surface-elevated flex items-center gap-5 hover:bg-surface transition-colors cursor-pointer"
            >
              <div className="relative flex-shrink-0">
                {seller.profileImageUri ? (
                  <img
                    src={seller.profileImageUri}
                    alt={seller.nickname}
                    className="w-14 h-14 rounded-full object-cover bg-surface"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-surface text-gold-light text-xl flex items-center justify-center font-bold">
                    {seller.nickname.charAt(0)}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold text-[16px]">{seller.nickname}</span>
                  <span className="text-gold-light text-[13px]">★ {seller.rating.toFixed(1)}</span>
                </div>
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); handleUnfollow(seller.sellerId); }}
                disabled={isPending}
                className="btn btn-accent-outline flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                언팔로우
              </button>
            </div>
          ))}

          <div ref={observerRef} className="h-1" />

          {isFetchingNextPage && (
            <div className="flex items-center justify-center py-4">
              <div className="w-6 h-6 border-3 border-neutral-700 border-t-gold-light rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}
    </>
  );
}
