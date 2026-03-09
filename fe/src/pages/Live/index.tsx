import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';
import StreamOverlay from '@/components/Live/Stream/StreamOverlay';
import StreamPlaceholder from '@/components/Live/Stream/StreamPlaceholder';
import ControlBar from '@/components/Live/Stream/ControlBar';
import SellerGuideOverlay from '@/components/Live/Stream/SellerGuideOverlay';

export default function LivePage() {
  return (
    <div className="flex h-screen w-full gap-2 p-2">
      <LeftPanel />
      <div className="relative flex-1 bg-background">
        <StreamOverlay />
        <SellerGuideOverlay />
        <StreamPlaceholder />
        <ControlBar />
      </div>
      <RightPanel />
    </div>
  );
}
