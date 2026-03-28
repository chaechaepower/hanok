import { useEffect } from 'react';
import type { RefObject } from 'react';

type InfiniteScrollTriggerParams = {
  fetchNextPage: () => Promise<unknown>;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  triggerRef: RefObject<HTMLDivElement | null>;
  rootRef?: RefObject<HTMLElement | null>;
  rootMargin?: string;
  threshold?: number;
};

export default function useInfiniteScrollTrigger({
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  triggerRef,
  rootRef,
  rootMargin = '280px 0px',
  threshold = 0,
}: InfiniteScrollTriggerParams) {
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) {
      return;
    }

    const target = triggerRef.current;
    if (!target) {
      return;
    }

    const root = rootRef?.current ?? null;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) {
          return;
        }

        observer.unobserve(target);
        void fetchNextPage();
      },
      { root, rootMargin, threshold },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, rootMargin, rootRef, threshold, triggerRef]);
}
