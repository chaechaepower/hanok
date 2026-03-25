import { useEffect, useState } from 'react';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

const MOBILE_QUERY = '(max-width: 767px)';
const TABLET_QUERY = '(min-width: 768px) and (max-width: 1024px)';

function getBreakpoint(mobile: boolean, tablet: boolean): Breakpoint {
  if (mobile) return 'mobile';
  if (tablet) return 'tablet';
  return 'desktop';
}

export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>(() => {
    if (typeof window === 'undefined') return 'desktop';
    return getBreakpoint(
      window.matchMedia(MOBILE_QUERY).matches,
      window.matchMedia(TABLET_QUERY).matches,
    );
  });

  useEffect(() => {
    const mobileMedia = window.matchMedia(MOBILE_QUERY);
    const tabletMedia = window.matchMedia(TABLET_QUERY);

    const update = () => setBreakpoint(getBreakpoint(mobileMedia.matches, tabletMedia.matches));

    mobileMedia.addEventListener('change', update);
    tabletMedia.addEventListener('change', update);

    return () => {
      mobileMedia.removeEventListener('change', update);
      tabletMedia.removeEventListener('change', update);
    };
  }, []);

  return breakpoint;
}
