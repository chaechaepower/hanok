import { useLiveAuctionComment } from '@/hooks/useLiveHotState';

export default function LiveMobileAuctionCommentToast() {
  const auctionComment = useLiveAuctionComment();

  if (!auctionComment) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute bottom-4 left-1/2 z-40 w-[min(85%,20rem)] -translate-x-1/2">
      <div className="animate-toast-in relative overflow-hidden rounded-(--radius-panel) border border-accent/30 bg-background/92 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl">
        <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-accent via-gold to-accent-light" />
        <div className="relative flex items-center gap-2 px-3 py-2.5">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-accent">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-white">
              <path
                d="M3 11.5V12.5C3 13.0523 3.44772 13.5 4 13.5H6L11.2 17.4C11.8598 17.8948 12.8 17.4241 12.8 16.6V7.4C12.8 6.57589 11.8598 6.10521 11.2 6.6L6 10.5H4C3.44772 10.5 3 10.9477 3 11.5Z"
                fill="currentColor"
              />
              <path
                d="M16.5 9C17.8807 10.3807 17.8807 13.6193 16.5 15"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <p className="min-w-0 flex-1 text-xs font-semibold leading-snug text-warm">{auctionComment.message}</p>
        </div>
      </div>
    </div>
  );
}
