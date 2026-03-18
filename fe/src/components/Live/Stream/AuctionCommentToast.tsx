type Props = {
  message?: string | null;
};

export default function AuctionCommentToast({ message }: Props) {
  if (!message) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute top-16 left-1/2 z-40 w-[min(92%,40rem)] -translate-x-1/2 md:top-14">
      <div className="animate-toast-in relative overflow-hidden rounded-[28px] border border-accent/30 bg-background/92 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl">
        <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-accent via-gold to-accent-light" />
        <div className="absolute -top-10 right-8 h-24 w-24 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute -bottom-8 left-10 h-20 w-20 rounded-full bg-gold/15 blur-3xl" />

        <div className="relative flex items-center gap-3 px-4 py-3.5 md:px-5 md:py-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-accent shadow-[0_0_0_4px_rgba(166,61,46,0.16)]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white">
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
              <path
                d="M18.8 6.8C21.2943 9.29428 21.2943 14.7057 18.8 17.2"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold leading-[1.55] text-warm drop-shadow-[0_2px_10px_rgba(0,0,0,0.4)]">
              {message}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
