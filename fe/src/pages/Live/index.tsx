import LeftPanel from "./LeftPanel";
import RightPanel from "./RightPanel";

export default function LivePage() {
  return (
    <div className="flex h-screen w-full gap-2 p-2">
      <LeftPanel />
      <div className="flex-1 bg-background">영상</div>
      <RightPanel />
    </div>
  );
}
