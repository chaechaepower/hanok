import SellerControlBar from './SellerControlBar';
import BuyerControlBar from './BuyerControlBar';
import type { BidSyncPayload } from '@/types';

interface Props {
  isSeller: boolean;
  bidSync: BidSyncPayload | null;
  introduceAuctionId: number | null;
  startAuctionId: number | null;
  canIntroduce: boolean;
  canStart: boolean;
}

export default function ControlBar({ isSeller, bidSync, introduceAuctionId, startAuctionId, canIntroduce, canStart }: Props) {
  return isSeller ? (
    <SellerControlBar
      introduceAuctionId={introduceAuctionId}
      startAuctionId={startAuctionId}
      canIntroduce={canIntroduce}
      canStart={canStart}
    />
  ) : (
    <BuyerControlBar bidSync={bidSync} />
  );
}
