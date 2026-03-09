import Skeleton from '@/components/ui/Skeleton';

const SKELETON_CARD_COUNT = 5;
const SKELETON_SIDEBAR_ITEM_COUNT = 12;

function LiveCardSkeleton() {
  return (
    <div className="w-full max-w-57.5">
      <Skeleton className="aspect-3/4 w-full bg-white/10!" borderRadius="16px" />

      <div className="mt-5 flex items-start gap-3">
        <Skeleton width="48px" height="48px" borderRadius="9999px" className="shrink-0 bg-white/10!" />
        <div className="min-w-0 flex-1">
          <Skeleton width="160px" height="16px" borderRadius="6px" className="max-w-full bg-white/10!" />
          <Skeleton width="130px" height="14px" borderRadius="6px" className="mt-3 max-w-full bg-white/10!" />
        </div>
      </div>
    </div>
  );
}

export default function MainSkeleton() {
  return (
    <div className="flex w-full">
      <aside className="w-full max-w-70 px-4 py-6">
        <div className="flex flex-col gap-2">
          {Array.from({ length: SKELETON_SIDEBAR_ITEM_COUNT }).map((_, index) => (
            <Skeleton key={index} height="48px" borderRadius="12px" className="w-full bg-white/10!" />
          ))}
        </div>
      </aside>

      <div className="flex w-full flex-col">
        <div className="flex items-center justify-between gap-4 pb-2 pl-4 pr-8 pt-8">
          <Skeleton width="220px" height="44px" borderRadius="12px" className="bg-white/10!" />
          <Skeleton width="132px" height="44px" borderRadius="12px" className="bg-white/10!" />
        </div>

        <section className="flex flex-col gap-8 pb-10 pl-4 pr-8 pt-6">
          <Skeleton width="280px" height="28px" borderRadius="8px" className="max-w-full bg-white/10!" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: SKELETON_CARD_COUNT }).map((_, index) => (
              <LiveCardSkeleton key={`following-${index}`} />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-8 py-10 pl-4 pr-8">
          <Skeleton width="260px" height="28px" borderRadius="8px" className="max-w-full bg-white/10!" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: SKELETON_CARD_COUNT }).map((_, index) => (
              <LiveCardSkeleton key={`all-${index}`} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
