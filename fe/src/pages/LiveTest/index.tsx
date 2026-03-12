import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLiveKit } from "@/hooks/useLiveKit";
import { getFetchInstance } from "@/api/instance";

const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL ?? "ws://localhost:7880";

export default function LiveTestPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [isSeller, setIsSeller] = useState(false);

  // 백엔드에서 토큰 발급
  useEffect(() => {
    if (!id) return;
    getFetchInstance()
      .post<{ token: string }>(`/v1/streams/${id}/token`)
      .then((res) => setToken(res.data.token))
      .catch((err) => console.error("토큰 발급 실패:", err));
  }, [id]);

  const { state, videoRef, toggleMic, toggleCamera, disconnect, isMicOn, isCameraOn } =
    useLiveKit({
      serverUrl: LIVEKIT_URL,
      token,
      isHost: isSeller,
    });

  return (
    <div className="flex h-screen flex-col bg-black text-white">
      {/* 상단 바 */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-800"
          onClick={() => navigate("/")}
        >
          ← 홈으로
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">Stream #{id}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-bold ${
              state === "connected"
                ? "bg-green-600 text-white"
                : state === "connecting"
                  ? "bg-yellow-600 text-white"
                  : state === "error"
                    ? "bg-red-600 text-white"
                    : "bg-zinc-700 text-zinc-400"
            }`}
          >
            {state}
          </span>
        </div>
      </div>

      {/* 영상 영역 */}
      <div className="relative flex flex-1 items-center justify-center">
        {state === "connected" ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="text-center text-zinc-500">
            {state === "connecting" && "연결 중..."}
            {state === "disconnected" && (token ? "연결 끊김" : "토큰 발급 대기 중...")}
            {state === "error" && "연결 오류 발생"}
          </div>
        )}
      </div>

      {/* 하단 컨트롤 */}
      <div className="flex items-center justify-center gap-3 px-4 py-4">
        {/* 역할 토글 */}
        <div className="flex gap-1 rounded-lg bg-zinc-800 p-1">
          <button
            className={`rounded-md px-3 py-1.5 text-xs font-bold ${
              isSeller ? "bg-white text-black" : "text-zinc-500"
            }`}
            onClick={() => setIsSeller(true)}
          >
            판매자
          </button>
          <button
            className={`rounded-md px-3 py-1.5 text-xs font-bold ${
              !isSeller ? "bg-white text-black" : "text-zinc-500"
            }`}
            onClick={() => setIsSeller(false)}
          >
            구매자
          </button>
        </div>

        {/* 미디어 컨트롤 (판매자만) */}
        {isSeller && (
          <>
            <button
              className={`rounded-lg px-4 py-2 text-sm font-bold ${
                isMicOn ? "bg-zinc-700" : "bg-red-600"
              }`}
              onClick={toggleMic}
            >
              {isMicOn ? "🎤 ON" : "🎤 OFF"}
            </button>
            <button
              className={`rounded-lg px-4 py-2 text-sm font-bold ${
                isCameraOn ? "bg-zinc-700" : "bg-red-600"
              }`}
              onClick={toggleCamera}
            >
              {isCameraOn ? "📷 ON" : "📷 OFF"}
            </button>
          </>
        )}

        <button
          className="rounded-lg bg-red-700 px-4 py-2 text-sm font-bold hover:bg-red-600"
          onClick={disconnect}
        >
          연결 해제
        </button>
      </div>
    </div>
  );
}
