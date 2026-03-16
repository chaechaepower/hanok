import SellerControlBar from './SellerControlBar';
import BuyerControlBar from './BuyerControlBar';
import type { BidSyncPayload } from '@/types';

interface ReadyItem {
  auctionId: number;
  auctionStatus: string;
}

interface Props {
  isSeller: boolean;
  bidSync: BidSyncPayload | null;
  activeBidAuctionId: number | null;
  introduceAuctionId: number | null;
  startAuctionId: number | null;
  canIntroduce: boolean;
  canStart: boolean;
  readyItems: ReadyItem[];
  selectedAuctionId: number | null;
  onSelectAuctionItem: (id: number | null) => void;
}

export default function ControlBar({
  isSeller,
  bidSync,
  activeBidAuctionId,
  introduceAuctionId,
  startAuctionId,
  canIntroduce,
  canStart,
  readyItems,
  selectedAuctionId,
  onSelectAuctionItem,
}: Props) {
  return isSeller ? (
    <SellerControlBar
      introduceAuctionId={introduceAuctionId}
      startAuctionId={startAuctionId}
      canIntroduce={canIntroduce}
      canStart={canStart}
      readyItems={readyItems}
      selectedAuctionId={selectedAuctionId}
      onSelectAuctionItem={onSelectAuctionItem}
    />
  ) : (
    <BuyerControlBar bidSync={bidSync} activeAuctionId={activeBidAuctionId} />
  );
}
