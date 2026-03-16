import type { StreamEnterTopBidder } from '@/types';

type BidderViewModel = {
  rank: number;
  initial: string;
  nickname: string;
  price: string;
};

interface Props {
  topBidders?: StreamEnterTopBidder[];
}

const FALLBACK_BIDDERS: BidderViewModel[] = [
  { rank: 1, initial: '고', nickname: '고미술애호가', price: '685,000원' },
  { rank: 2, initial: '전', nickname: '전통수집광', price: '650,000원' },
  { rank: 3, initial: 'H', nickname: 'Heritage_K', price: '620,000원' },
];

const rankStyles = {
  1: {
    avatar: 'h-10 w-10 border-gold bg-gold/[0.08] text-gold',
    name: 'text-white',
    price: 'text-[11px] text-gold',
    block: 'h-11 bg-gold/12 border border-b-0 border-gold/25 text-gold',
  },
  2: {
    avatar: 'h-[34px] w-[34px] border-neutral-500/30 bg-neutral-800 text-neutral-300',
    name: 'text-neutral-400',
    price: 'text-[10px] text-neutral-500',
    block: 'h-[30px] bg-neutral-500/6 border border-b-0 border-neutral-500/12 text-neutral-300',
  },
  3: {
    avatar: 'h-[34px] w-[34px] border-primary/30 bg-neutral-800 text-primary',
    name: 'text-neutral-400',
    price: 'text-[10px] text-neutral-500',
    block: 'h-5 bg-primary/6 border border-b-0 border-primary/12 text-primary',
  },
} as const;

const toBidderViewModels = (topBidders?: StreamEnterTopBidder[]): BidderViewModel[] => {
  if (!topBidders || topBidders.length === 0) {
    return FALLBACK_BIDDERS;
  }

  return topBidders
    .slice()
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 3)
    .map((bidder) => ({
      rank: bidder.rank,
      initial: bidder.nickname.trim().charAt(0).toUpperCase() || '?',
      nickname: bidder.nickname,
      price: `${bidder.amount.toLocaleString('ko-KR')}원`,
    }));
};

export default function TopBidderList({ topBidders }: Props) {
  const bidders = toBidderViewModels(topBidders);
  const podiumOrder = [bidders[1], bidders[0], bidders[2]].filter(Boolean);

  return (
    <div className="border-b border-white/5 bg-neutral-900/30 px-4 pt-4">
      <div className="mb-3.5 text-[10px] font-black uppercase text-gold">상위 입찰자</div>
      <div className="flex items-end justify-center gap-1.5">
        {podiumOrder.map((bidder) => {
          const s = rankStyles[bidder.rank as keyof typeof rankStyles];

          return (
            <div key={bidder.rank} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className={`flex items-center justify-center rounded-full border-2 text-[11px] font-black ${s.avatar}`}
              >
                {bidder.initial}
              </div>
              <div className={`max-w-20 truncate text-center text-[9px] font-bold ${s.name}`}>{bidder.nickname}</div>
              <div className={`font-mono font-black ${s.price}`}>{bidder.price}</div>
              <div
                className={`flex w-full items-center justify-center rounded-t-[10px] text-base font-black ${s.block}`}
              >
                {bidder.rank}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
