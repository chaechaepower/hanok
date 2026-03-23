import Skeleton from '@/components/ui/Skeleton';

const SKELETON_CARD_COUNT = 5;
const SKELETON_CATEGORY_ITEM_COUNT = 6;

function LiveCardSkeleton() {
  return (
    <div className="w-full max-w-57.5">
      <div className="mb-3 flex items-center gap-3">
        <Skeleton width="40px" height="40px" borderRadius="9999px" className="shrink-0 bg-white/10!" />
        <Skeleton width="120px" height="15px" borderRadius="6px" className="max-w-full bg-white/10!" />
      </div>

      <Skeleton className="aspect-3/4 w-full bg-white/10!" borderRadius="16px" />

      <div className="mt-4">
        <Skeleton width="160px" height="16px" borderRadius="6px" className="max-w-full bg-white/10!" />
        <Skeleton width="110px" height="14px" borderRadius="6px" className="mt-3 max-w-full bg-white/10!" />
      </div>
    </div>
  );
}

export default function MainSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-6 pt-8 xl:flex-row">
      <aside className="w-full shrink-0 xl:w-[280px]">
        <div className="rounded-(--radius-panel)  p-3">
          <Skeleton height="72px" borderRadius="20px" className="w-full bg-white/10!" />
          <div className="mt-3 flex flex-col gap-2">
            {Array.from({ length: SKELETON_CATEGORY_ITEM_COUNT }).map((_, index) => (
              <Skeleton key={index} height="52px" borderRadius="16px" className="w-full bg-white/10!" />
            ))}
          </div>
        </div>

        <div className="mt-5 rounded-(--radius-panel)  p-4">
          <Skeleton width="160px" height="22px" borderRadius="8px" className="bg-white/10!" />
          <div className="mt-4 flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} height="62px" borderRadius="18px" className="w-full bg-white/10!" />
            ))}
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <section className="rounded-(--radius-section)  p-4">
          <Skeleton width="280px" height="28px" borderRadius="8px" className="bg-white/10!" />
          <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.75fr)_320px]">
            <Skeleton height="360px" borderRadius="28px" className="w-full bg-white/10!" />
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} height="92px" borderRadius="22px" className="w-full bg-white/10!" />
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-(--radius-section)  px-6 pb-10 pt-6">
          <div className="flex items-center justify-between gap-4">
            <Skeleton width="260px" height="28px" borderRadius="8px" className="max-w-full bg-white/10!" />
            <Skeleton width="132px" height="44px" borderRadius="16px" className="bg-white/10!" />
          </div>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
            {Array.from({ length: SKELETON_CARD_COUNT }).map((_, index) => (
              <LiveCardSkeleton key={`all-${index}`} />
            ))}
          </div>
        </section>

        <section className="rounded-(--radius-section)  px-6 pb-6 pt-5">
          <div className="flex items-center justify-between gap-4">
            <Skeleton width="220px" height="28px" borderRadius="8px" className="bg-white/10!" />
            <div className="flex gap-2">
              <Skeleton width="44px" height="44px" borderRadius="9999px" className="bg-white/10!" />
              <Skeleton width="44px" height="44px" borderRadius="9999px" className="bg-white/10!" />
            </div>
          </div>
          <div className="mt-5 flex gap-4 overflow-hidden">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} height="150px" borderRadius="26px" className="min-w-[360px] bg-white/10!" />
            ))}
          </div>
        </section>

        <section className="rounded-(--radius-section)  px-6 pb-10 pt-6">
          <Skeleton width="220px" height="28px" borderRadius="8px" className="max-w-full bg-white/10!" />
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
            {Array.from({ length: SKELETON_CARD_COUNT }).map((_, index) => (
              <LiveCardSkeleton key={`whole-${index}`} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
