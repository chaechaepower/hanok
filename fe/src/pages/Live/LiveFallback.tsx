type LiveFallbackProps = {
  title: string;
  description: string;
  onAction: () => void;
  actionLabel: string;
};

export default function LiveFallback({ title, description, onAction, actionLabel }: LiveFallbackProps) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-surface px-6">
      <div className="w-full max-w-[520px] rounded-(--radius-panel) border border-white/8 bg-background px-8 py-10 text-center shadow-[0_28px_80px_rgba(0,0,0,0.28)]">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-h1 text-gold">
          !
        </div>
        <h1 className="mt-6 text-h1 font-black text-white">{title}</h1>
        <p className="mt-3 break-keep text-sub-lg leading-7 whitespace-pre-line text-neutral-400">{description}</p>
        <button
          type="button"
          onClick={onAction}
          className="mt-8 inline-flex min-w-[200px] items-center justify-center rounded-(--radius-panel) bg-point px-5 py-3 text-body-lg text-background transition hover:opacity-90"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
