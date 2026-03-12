type Props = {
  message: string;
};

export default function AuctionCommentToast({ message }: Props) {
  return (
    <div className="pointer-events-none absolute top-16 left-1/2 z-40 w-[min(88%,38rem)] -translate-x-1/2 md:top-20">
      <div className="relative overflow-hidden rounded-3xl border border-[rgba(255,255,255,0.1)] bg-[linear-gradient(135deg,rgba(9,9,11,0.26),rgba(255,255,255,0.04))] px-4 py-3.5 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
        <div className="relative flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.05)] shadow-[0_0_18px_rgba(255,255,255,0.04)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white">
              <path
                d="M3 11.5V12.5C3 13.0523 3.44772 13.5 4 13.5H6L11.2 17.4C11.8598 17.8948 12.8 17.4241 12.8 16.6V7.4C12.8 6.57589 11.8598 6.10521 11.2 6.6L6 10.5H4C3.44772 10.5 3 10.9477 3 11.5Z"
                fill="currentColor"
                fillOpacity="0.92"
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
            <p className="text-sm font-semibold leading-relaxed text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.35)]">
              {message}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
