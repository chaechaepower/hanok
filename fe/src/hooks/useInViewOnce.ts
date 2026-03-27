import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

type UseInViewOnceOptions = {
  rootMargin?: string;
};

export default function useInViewOnce(
  targetRef: RefObject<Element | null>,
  { rootMargin = '280px 0px' }: UseInViewOnceOptions = {},
) {
  const [hasEnteredView, setHasEnteredView] = useState(false);
  const isObserverUnavailable = typeof window !== 'undefined' && typeof IntersectionObserver === 'undefined';

  useEffect(() => {
    if (hasEnteredView || isObserverUnavailable) {
      return;
    }

    const target = targetRef.current;
    if (!target) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) {
          return;
        }

        setHasEnteredView(true);
        observer.disconnect();
      },
      { rootMargin },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [hasEnteredView, isObserverUnavailable, rootMargin, targetRef]);

  return hasEnteredView || isObserverUnavailable;
}
