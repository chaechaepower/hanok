import AuctionTimer from './AuctionTimer';
import { useLiveTimer } from '@/hooks/useLiveHotState';

interface Props {
  onExpire: () => void;
}

export default function LiveAuctionTimer({ onExpire }: Props) {
  const timer = useLiveTimer();

  if (!timer) {
    return null;
  }

  return <AuctionTimer key={timer.receivedAtMs} timer={timer} onExpire={onExpire} />;
}
