export default function HistoryRowSkeleton() {
  return (
    <div className="flex flex-col items-start gap-4 rounded-[22px] px-2 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-3">
      <div className="flex min-w-0 items-center gap-4">
        <div className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-white/10" />
        <div className="space-y-2">
          <div className="h-5 w-28 animate-pulse rounded-md bg-white/10" />
          <div className="h-4 w-32 animate-pulse rounded-md bg-white/8" />
        </div>
      </div>

      <div className="w-full shrink-0 space-y-2 text-left sm:w-auto sm:text-right">
        <div className="h-5 w-28 animate-pulse rounded-md bg-white/10 sm:ml-auto" />
        <div className="h-4 w-20 animate-pulse rounded-md bg-white/8 sm:ml-auto" />
      </div>
    </div>
  );
}
