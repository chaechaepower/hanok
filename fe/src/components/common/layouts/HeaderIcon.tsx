import type { ReactNode } from 'react';

type HeaderIconProps = {
  children: ReactNode;
  onClick: () => void;
  ariaLabel: string;
  tooltip: string;
  badgeCount?: number;
  hasNoti?: boolean;
};

export default function HeaderIcon({ children, onClick, ariaLabel, tooltip, badgeCount, hasNoti }: HeaderIconProps) {
  return (
    <div className="group relative flex items-center justify-center">
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className={`relative flex h-(--nav-btn-height) w-(--nav-btn-height) items-center justify-center rounded-(--nav-btn-radius) border border-transparent transition-all hover:border-warm/6 hover:bg-warm/5 active:scale-95 ${hasNoti ? 'text-neutral-200 hover:text-neutral-100' : ''}`}
      >
        {children}
        {badgeCount != null && badgeCount > 0 && (
          <span className="animate-badge-pulse pointer-events-none absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-background bg-accent px-[5px] text-[10px] font-[800] text-white">
            {badgeCount}
          </span>
        )}
      </button>
      <span className="pointer-events-none absolute top-full z-10 mt-2 whitespace-nowrap rounded-lg bg-neutral-800 px-2.5 py-1 text-xs text-neutral-200 opacity-0 shadow-lg transition duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
        {tooltip}
      </span>
    </div>
  );
}
