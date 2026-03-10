import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoHomeFill } from "react-icons/go";
import LeftPanel from "./LeftPanel";
import RightPanel from "./RightPanel";
import StreamOverlay from "@/components/Live/Stream/StreamOverlay";
import StreamPlaceholder from "@/components/Live/Stream/StreamPlaceholder";
import ControlBar from "@/components/Live/Stream/ControlBar";
import SellerGuideOverlay from "@/components/Live/Stream/SellerGuideOverlay";

export default function LivePage() {
  const navigate = useNavigate();
  // TODO: 실제 로그인 유저 기반으로 판매자 여부 판단
  const [isSeller, setIsSeller] = useState(true);

  return (
    <div className="flex h-screen w-full flex-col bg-black p-3">
      {/* ── Top Bar ── */}
      <div className="mb-2 flex shrink-0 items-center">
        <button
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-bold text-[#71717A] transition hover:bg-[rgba(255,255,255,0.05)] hover:text-[#A1A1AA]"
          onClick={() => navigate("/")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          <GoHomeFill /> 홈으로
        </button>
      </div>

      {/* ── Main Content ── */}
      <div className="flex min-h-0 flex-1 gap-3">
      <div className="min-w-0 flex-1">
        <LeftPanel isSeller={isSeller} />
      </div>
      <div className="relative min-w-0 flex-[2] overflow-hidden rounded-2xl bg-background">
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
      <div className="min-w-0 flex-1">
        <RightPanel isSeller={isSeller} />
      </div>
      </div>
    </div>
  );
}
