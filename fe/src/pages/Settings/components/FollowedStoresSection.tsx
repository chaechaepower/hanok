import { FaStore } from 'react-icons/fa';
import { useGetFollowedStores } from '@/api/hooks/useGetFollowedStores';
import { useDeleteFollow } from '@/api/hooks/useDeleteFollow';
import type { FollowingItem } from '@/types';

export default function FollowedStoresSection() {
  const { data, isLoading } = useGetFollowedStores();
  const { mutate: unfollow, isPending } = useDeleteFollow();

  const followedList: FollowingItem[] = data?.content ?? [];
  const totalStores = data?.totalElements ?? 0;

  const handleUnfollow = (sellerId: number) => {
    unfollow({ userId: sellerId });
  };

  return (
    <>
      <div className="flex flex-col gap-2 mb-2">
        <h2 className="m-0 text-2xl font-bold text-white">
          팔로우한 스토어
          <span className="ml-2 text-[#d9b36d]">({totalStores})</span>
        </h2>
        <p className="m-0 text-[15px] text-[#aaa]">단골 스토어의 소식을 받아보세요.</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#333] border-t-[#d9b36d] rounded-full animate-spin" />
        </div>
      ) : followedList.length === 0 ? (
        <div className="w-full box-border border border-[#2e2e40] rounded-2xl p-12 bg-[#0c0c14] flex flex-col items-center gap-4">
          <FaStore size={40} className="text-[#333]" />
          <p className="m-0 text-[#555] text-[15px]">팔로우한 스토어가 없습니다.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {followedList.map(({ followId, seller }) => (
            <div
              key={followId}
              className="w-full box-border border border-[#2e2e40] rounded-2xl p-6 bg-[#0c0c14] flex items-center gap-5 hover:border-[#3a3a50] transition-colors"
            >
              <div className="relative flex-shrink-0">
                {seller.profileImageUri ? (
                  <img
                    src={seller.profileImageUri}
                    alt={seller.nickname}
                    className="w-14 h-14 rounded-full object-cover bg-[#1e1e2d]"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-[#1e1e2d] text-[#d9b36d] text-xl flex items-center justify-center font-bold">
                    {seller.nickname.charAt(0)}
                  </div>
                )}
                {seller.isLive && (
                  <span className="absolute -bottom-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                    LIVE
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold text-[16px]">{seller.nickname}</span>
                  <span className="text-[#d9b36d] text-[13px]">★ {seller.rating.toFixed(1)}</span>
                </div>
              </div>

              <button
                onClick={() => handleUnfollow(seller.sellerId)}
                disabled={isPending}
                className="flex-shrink-0 py-2 px-5 bg-white text-[#111] text-sm font-bold border-none rounded-full cursor-pointer hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                언팔로우
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
