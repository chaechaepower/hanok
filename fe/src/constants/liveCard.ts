import type { SearchStreamStatus } from '@/types';

export const SCHEDULED_BADGE_LABEL = '방송 예정';

export const STREAM_STATUS_META_MAP: Record<
  SearchStreamStatus,
  { label: string; badgeClassName: string; canEnter: boolean }
> = {
  LIVE: {
    label: 'LIVE',
    badgeClassName: 'bg-[#EF4444] text-white',
    canEnter: true,
  },
  SCHEDULED: {
    label: SCHEDULED_BADGE_LABEL,
    badgeClassName: 'bg-gold/20 text-gold-light',
    canEnter: false,
  },
  PAUSED: {
    label: '일시 정지',
    badgeClassName: 'bg-ember/20 text-ember-light',
    canEnter: true,
  },
  ENDED: {
    label: '종료됨',
    badgeClassName: 'bg-white/12 text-white/70',
    canEnter: false,
  },
};
