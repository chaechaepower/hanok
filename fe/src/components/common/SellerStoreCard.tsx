import { useNavigate } from 'react-router-dom';

type SellerStoreCardData = {
  sellerId: number;
  shopName: string;
  profileImage: string | null;
  intro?: string | null;
  rating: number;
  isFollowed: boolean;
};

type SellerStoreCardProps = {
  seller: SellerStoreCardData;
  onToggleFollow?: (sellerId: number) => void;
  isFollowActionPending?: boolean;
  className?: string;
  highlightKeyword?: string;
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const renderHighlightedText = (
  value: string,
  keyword?: string,
  highlightClassName = 'font-semibold text-gold-light',
) => {
  const trimmedKeyword = keyword?.trim();

  if (!trimmedKeyword) {
    return value;
  }

  const parts = value.split(new RegExp(`(${escapeRegExp(trimmedKeyword)})`, 'gi')).filter(Boolean);

  return parts.map((part, index) =>
    part.toLowerCase() === trimmedKeyword.toLowerCase() ? (
      <strong key={`${value}-${trimmedKeyword}-${index}`} className={highlightClassName}>
        {part}
      </strong>
    ) : (
      <span key={`${value}-${trimmedKeyword}-${index}`}>{part}</span>
    ),
  );
};

export default function SellerStoreCard({
  seller,
  onToggleFollow,
  isFollowActionPending = false,
  className,
  highlightKeyword,
}: SellerStoreCardProps) {
  const navigate = useNavigate();
  const roundedRating = Math.round(seller.rating);
  const introText = seller.intro?.trim() || '상점 소개가 아직 등록되지 않았습니다.';
  const highlightedShopName = renderHighlightedText(seller.shopName, highlightKeyword);
  const highlightedIntro = renderHighlightedText(introText, highlightKeyword);

  return (
    <article
      onClick={() => navigate(`/profile/${seller.sellerId}`)}
      className={`box-border cursor-pointer rounded-2xl border border-white/[0.06] bg-surface-elevated p-6 transition-colors hover:border-gold-light/40 ${className ?? ''}`}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="flex-shrink-0">
          {seller.profileImage ? (
            <img
              src={seller.profileImage}
              alt={seller.shopName}
              className="h-16 w-16 rounded-full bg-surface object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface text-2xl font-bold text-gold-light">
              {seller.shopName.charAt(0)}
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-1 text-center">
          <span className="text-[16px] font-bold text-white">{highlightedShopName}</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[14px] font-bold text-gold-light">{seller.rating.toFixed(1)}</span>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }, (_, index) => (
                <svg
                  key={index}
                  className={`h-3.5 w-3.5 ${index < roundedRating ? 'text-gold-light' : 'text-neutral-700'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
          </div>
        </div>

        <p className="min-h-[40px] text-center text-[13px] leading-[1.5] text-neutral-400">{highlightedIntro}</p>

        {onToggleFollow && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleFollow(seller.sellerId);
            }}
            disabled={isFollowActionPending}
            className={`w-full rounded-lg border py-2.5 text-[14px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              seller.isFollowed
                ? 'border-accent-light/40 bg-transparent text-accent-light hover:bg-accent/10'
                : 'border-gold-light/30 bg-gold-light/10 text-gold-light hover:bg-gold-light/16'
            }`}
          >
            {seller.isFollowed ? '팔로우' : '언팔로우'}
          </button>
        )}
      </div>
    </article>
  );
}
