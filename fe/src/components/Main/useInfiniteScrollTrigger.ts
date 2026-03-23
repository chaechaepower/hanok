import { useEffect } from 'react';
import type { RefObject } from 'react';

type InfiniteScrollTriggerParams = {
  fetchNextPage: () => Promise<unknown>;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  triggerRef: RefObject<HTMLDivElement | null>;
};

export default function useInfiniteScrollTrigger({
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  triggerRef,
}: InfiniteScrollTriggerParams) {
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
}
