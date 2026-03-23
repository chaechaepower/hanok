import type { RefObject } from 'react';

import type { MainStreamSort } from '@/api/hooks/useGetMain';
import LiveCard from '@/components/Main/LiveCard';
import type { LiveCardData } from '@/types';

import MainSortDropdown from './MainSortDropdown';
import { GRID_CLASS_NAME, SORT_OPTIONS } from './mainStreamSectionUtils';

type AllLiveSectionProps = {
  streams: LiveCardData[];
  selectedSortLabel: string;
  sortFilter: MainStreamSort;
  onSortChange: (value: MainStreamSort) => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  triggerRef: RefObject<HTMLDivElement | null>;
};

export default function AllLiveSection({
  streams,
  selectedSortLabel,
  sortFilter,
  onSortChange,
  hasNextPage,
  isFetchingNextPage,
  triggerRef,
}: AllLiveSectionProps) {
  return (
    <section className="rounded-[32px] border border-white/8 bg-background px-6 pb-10 pt-6">
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-[28px] font-semibold text-warm">진행 중인 경매</h2>
          <p className="mt-1 text-sm text-neutral-500">한옥의 경매에 참여하세요!</p>
        </div>

        <div className="flex items-center gap-3">
          <MainSortDropdown
            options={SORT_OPTIONS}
            selectedValue={sortFilter}
            selectedLabel={selectedSortLabel}
            onSelect={onSortChange}
          />
        </div>
      </div>

      {streams.length > 0 ? (
        <>
          <div className={GRID_CLASS_NAME}>
            {streams.map((broadcast) => (
              <LiveCard key={`all-${broadcast.streamId}`} stream={broadcast} />
            ))}
          </div>

          {hasNextPage && <div ref={triggerRef} className="h-8 w-full" />}

          {isFetchingNextPage && (
            <p className="pt-6 text-center text-sm text-neutral-500">전체 경매 라이브를 더 불러오는 중입니다.</p>
          )}
        </>
      ) : (
        <p className="py-16 text-center text-base text-neutral-500">전체 경매 라이브가 없습니다.</p>
      )}
    </section>
  );
}
