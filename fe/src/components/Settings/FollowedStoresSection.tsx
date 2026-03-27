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
          <p className="m-0 text-neutral-500 text-[15px]">팔로우한 스토어가 없습니다</p>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
            {followedList.map(({ followId, seller }) => (
              <div
                key={followId}
                onClick={() => navigate(`/profile/${seller.sellerId}`)}
                className="box-border rounded-2xl border border-white/[0.06] bg-surface-elevated p-6 flex flex-col items-center gap-4 hover:border-gold-light/40 transition-colors cursor-pointer"
              >
                <div className="flex-shrink-0">
                  {seller.profileImageUri ? (
                    <img
                      src={seller.profileImageUri}
                      alt={seller.nickname}
                      className="w-16 h-16 rounded-full object-cover bg-surface"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-surface text-gold-light text-2xl flex items-center justify-center font-bold">
                      {seller.nickname.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-center gap-1">
                  <span className="text-white font-bold text-[16px]">{seller.nickname}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-gold-light text-[14px] font-bold">{seller.rating.toFixed(1)}</span>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }, (_, i) => (
                        <svg
                          key={i}
                          className={`w-3.5 h-3.5 ${i < Math.round(seller.rating) ? 'text-gold-light' : 'text-neutral-700'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnfollow(seller.sellerId);
                  }}
                  disabled={isPending}
                  className="w-full py-2.5 rounded-lg border border-accent-light/40 bg-transparent text-accent-light text-[14px] font-bold cursor-pointer hover:bg-accent/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  언팔로우
                </button>
              </div>
            ))}
          </div>

          <div ref={observerRef} className="h-1" />

          {isFetchingNextPage && (
            <div className="flex items-center justify-center py-4">
              <div className="w-6 h-6 border-3 border-neutral-700 border-t-gold-light rounded-full animate-spin" />
            </div>
          )}

          {totalStores > 0 && (
            <p className="mt-6 text-[14px] text-neutral-500">
              총 {totalStores}개 중 {followedList.length}개 표시
            </p>
          )}
        </div>
      )}
    </>
  );
}
