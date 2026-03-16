import SellerControlBar from './SellerControlBar';
import BuyerControlBar from './BuyerControlBar';
import type { BidSyncPayload, LiveAuctionType, UniqueBidSyncPayload } from '@/types';

interface ReadyItem {
  auctionId: number;
  auctionStatus: string;
}

interface Props {
  isSeller: boolean;
  auctionType: LiveAuctionType | null;
  bidSync: BidSyncPayload | null;
  uniqueBidSync: UniqueBidSyncPayload | null;
  activeBidAuctionId: number | null;
  introduceAuctionId: number | null;
  introduceAuctionType: LiveAuctionType | null;
  startAuctionId: number | null;
  startAuctionType: LiveAuctionType | null;
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
  auctionType,
  bidSync,
  uniqueBidSync,
  activeBidAuctionId,
  introduceAuctionId,
  introduceAuctionType,
  startAuctionId,
  startAuctionType,
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
      introduceAuctionType={introduceAuctionType}
      startAuctionId={startAuctionId}
      startAuctionType={startAuctionType}
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
    <BuyerControlBar
      auctionType={auctionType}
      bidSync={bidSync}
      uniqueBidSync={uniqueBidSync}
      activeAuctionId={activeBidAuctionId}
    />
  );
}
