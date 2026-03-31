import AuctionCommentToast from './AuctionCommentToast';
import { useLiveAuctionComment } from '@/hooks/useLiveHotState';

export default function LiveAuctionCommentToast() {
  const auctionComment = useLiveAuctionComment();

  if (!auctionComment) {
    return null;
  }

  return <AuctionCommentToast key={auctionComment.id} message={auctionComment.message} />;
}
