import { useState } from "react";
import LeftPanel from "./LeftPanel";
import RightPanel from "./RightPanel";
import StreamOverlay from "@/components/Live/Stream/StreamOverlay";
import StreamPlaceholder from "@/components/Live/Stream/StreamPlaceholder";
import ControlBar from "@/components/Live/Stream/ControlBar";
import SellerGuideOverlay from "@/components/Live/Stream/SellerGuideOverlay";

export default function LivePage() {
  // TODO: 실제 로그인 유저 기반으로 판매자 여부 판단
  const [isSeller, setIsSeller] = useState(true);

  return (
    <div className="flex h-screen w-full gap-2 p-2">
      <LeftPanel />
      <div className="relative flex-1 bg-background">
        <StreamOverlay />
        <SellerGuideOverlay />
        <StreamPlaceholder />
        <ControlBar isSeller={isSeller} />

        {/* TODO: 테스트용 — 확인 후 삭제 */}
        <div className="absolute top-3 right-3 flex gap-1 rounded-lg bg-[rgba(0,0,0,.6)] p-1">
          <button
            className={`rounded-md px-3 py-1 text-xs font-bold transition ${isSeller ? "bg-white text-black" : "text-[#71717a]"}`}
            onClick={() => setIsSeller(true)}
          >
            판매자
          </button>
          <button
            className={`rounded-md px-3 py-1 text-xs font-bold transition ${!isSeller ? "bg-white text-black" : "text-[#71717a]"}`}
            onClick={() => setIsSeller(false)}
          >
            구매자
          </button>
        </div>
      </div>
      <RightPanel isSeller={isSeller} />
    </div>
  );
}
