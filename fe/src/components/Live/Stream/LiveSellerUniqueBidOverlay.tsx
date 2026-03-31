import SellerUniqueBidOverlay from './SellerUniqueBidOverlay';
import { useLiveUniqueBidSync } from '@/hooks/useLiveHotState';
import type { LiveAuctionType } from '@/types';

interface Props {
  auctionType: LiveAuctionType | null;
}

export default function LiveSellerUniqueBidOverlay({ auctionType }: Props) {
  const uniqueBidSync = useLiveUniqueBidSync();

  if (auctionType !== 'UNIQUE_TOP' || !uniqueBidSync) {
    return null;
  }

  return <SellerUniqueBidOverlay participantCount={uniqueBidSync.participantCount} />;
}
