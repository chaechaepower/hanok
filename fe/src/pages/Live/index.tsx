import LeftPanel from "./LeftPanel";
import RightPanel from "./RightPanel";
import StreamOverlay from "./Stream/StreamOverlay";
import StreamPlaceholder from "./Stream/StreamPlaceholder";
import ControlBar from "./Stream/ControlBar";

export default function LivePage() {
  return (
    <div className="flex h-screen w-full gap-2 p-2">
      <LeftPanel />
      <div className="relative flex-1 bg-background">
        <StreamOverlay />
        <StreamPlaceholder />
        <ControlBar />
      </div>
      <RightPanel />
    </div>
  );
}
