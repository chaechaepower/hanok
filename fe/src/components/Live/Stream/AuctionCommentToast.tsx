type Props = {
  message: string;
};

export default function AuctionCommentToast({ message }: Props) {
  return (
    <div className="pointer-events-none absolute top-4 left-1/2 z-40 w-[min(88%,32rem)] -translate-x-1/2">
      <div className="rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(7,7,8,0.86)] px-4 py-3 text-center shadow-[0_16px_40px_rgba(0,0,0,0.45)] backdrop-blur-md">
        <p className="text-sm font-bold text-white">{message}</p>
      </div>
    </div>
  );
}
