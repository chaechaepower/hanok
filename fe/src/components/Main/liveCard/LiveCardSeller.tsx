type Props = {
  nickname: string;
  profileImageUri?: string | null;
  canNavigateToProfile: boolean;
  onSellerClick: () => void;
};

export default function LiveCardSeller({
  nickname,
  profileImageUri,
  canNavigateToProfile,
  onSellerClick,
}: Props) {
  const sellerInitial = nickname.trim().charAt(0) || '?';

  return (
    <button
      type="button"
      onClick={onSellerClick}
      disabled={!canNavigateToProfile}
      className={`mb-1 flex w-full items-center gap-2.5 rounded-xl bg-transparent px-1 py-1 text-left transition-colors ${
        canNavigateToProfile ? 'cursor-pointer' : 'cursor-default'
      } disabled:pointer-events-none`}
    >
      {profileImageUri ? (
        <img
          src={profileImageUri}
          alt={`${nickname} profile`}
          loading="lazy"
          decoding="async"
          className="h-7 w-7 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-muted text-[14px] font-semibold text-primary-light">
          {sellerInitial}
        </div>
      )}

      <span className="min-w-0 truncate text-[14px] font-medium leading-none text-neutral-200">{nickname}</span>
    </button>
  );
}
