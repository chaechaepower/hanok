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
  toggleMic?: () => void;
  toggleCamera?: () => void;
  isMicOn?: boolean;
  isCameraOn?: boolean;
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
  toggleMic,
  toggleCamera,
  isMicOn,
  isCameraOn,
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
      toggleMic={toggleMic}
      toggleCamera={toggleCamera}
      isMicOn={isMicOn}
      isCameraOn={isCameraOn}
    />
  ) : (
    <BuyerControlBar bidSync={bidSync} activeAuctionId={activeBidAuctionId} />
  );
}
