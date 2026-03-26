import { useRef, useEffect } from 'react';
import { MdLiveTv } from 'react-icons/md';

import SellerControlBar from '@/components/Live/Stream/SellerControlBar';
import useMicLevel from '@/hooks/useMicLevel';
import type { LiveRegisterTutorialStepId } from './LiveRegisterTutorial';

type Props = {
  videoPreviewRef: React.RefObject<HTMLVideoElement | null>;
  isCameraOn: boolean;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onReopenTutorial: () => void;
  onPreviewIntroduce: () => void;
  onPreviewStart: () => void;
  introduceButtonRef: React.RefObject<HTMLButtonElement | null>;
  startButtonRef: React.RefObject<HTMLButtonElement | null>;
  getTargetClassName: (targetId: LiveRegisterTutorialStepId) => string;
};


export default function LiveRegisterPreviewPanel({
  videoPreviewRef,
  isCameraOn,
  onStartCamera,
  onStopCamera,
  onReopenTutorial,
  onPreviewIntroduce,
  onPreviewStart,
}: Props) {
  const bgVideoRef = useRef<HTMLVideoElement>(null);
  const { isMicOn, level, toggleMic } = useMicLevel();

  useEffect(() => {
    if (!videoPreviewRef.current || !bgVideoRef.current) return;
    if (videoPreviewRef.current.srcObject) {
      bgVideoRef.current.srcObject = videoPreviewRef.current.srcObject;
    }

    const observer = new MutationObserver(() => {
      if (videoPreviewRef.current?.srcObject && bgVideoRef.current) {
        bgVideoRef.current.srcObject = videoPreviewRef.current.srcObject;
      }
    });

    observer.observe(videoPreviewRef.current, { attributes: true });
    return () => observer.disconnect();
  }, [videoPreviewRef, isCameraOn]);

  return (
    <div className="relative flex min-w-0 flex-2 flex-col overflow-hidden rounded-2xl bg-background">
      {/* 블러 배경 영상 */}
      <video
        ref={bgVideoRef}
        autoPlay
        muted
        playsInline
        className={`absolute inset-0 h-full w-full object-cover -scale-x-100 blur-2xl brightness-50 saturate-150 ${isCameraOn ? '' : 'hidden'}`}
      />

      {/* 메인 영상 */}
      <div className="relative flex flex-1 items-center justify-center">
        <video
          ref={videoPreviewRef}
          autoPlay
          muted
          playsInline
          className={`relative h-full w-full object-contain -scale-x-100 ${isCameraOn ? '' : 'hidden'}`}
        />
        {!isCameraOn && (
          <div className="flex flex-col items-center gap-3 text-white/20">
            <MdLiveTv size={60} />
            <span className="text-base">카메라가 꺼져 있습니다</span>
          </div>
        )}
      </div>

      {/* 우상단: 컨트롤 */}
      <div className="absolute right-4 top-4 flex items-center gap-2 rounded-2xl bg-surface/80 px-2.5 py-2 backdrop-blur-md">
        <button
          type="button"
          onClick={onReopenTutorial}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-bold text-neutral-400 transition-all hover:text-neutral-200"
        >
          튜토리얼
        </button>
        <div className="h-5 w-px bg-neutral-600" />
        <div className="flex items-end gap-[4px] px-2 py-1.5">
          {Array.from({ length: 5 }, (_, i) => {
            const threshold = (i + 1) / 5;
            const isActive = isMicOn && level >= threshold * 0.6;
            const h = 6 + i * 4;
            const color = isActive
              ? i < 2 ? 'bg-accent' : i < 4 ? 'bg-gold' : 'bg-ember'
              : 'bg-neutral-700';
            return <div key={i} className={`w-[4px] rounded-full transition-all duration-75 ${color}`} style={{ height: `${h}px` }} />;
          })}
        </div>
      </div>

      {/* 좌상단: LIVE 뱃지 (미리보기) */}
      <div className="absolute left-3 top-4 z-10 flex items-center gap-1.5 rounded-full bg-accent/80 px-3 py-1.5 backdrop-blur-md">
        <div className="h-2 w-2 animate-pulse rounded-full bg-white" />
        <span className="translate-y-px text-xs font-black leading-none text-white">PREVIEW</span>
      </div>

      {/* 하단: 판매자 컨트롤바 */}
      <SellerControlBar
        canIntroduce
        canStart
        onIntroduce={onPreviewIntroduce}
        onStart={onPreviewStart}
        toggleMic={toggleMic}
        toggleCamera={isCameraOn ? onStopCamera : onStartCamera}
        isMicOn={isMicOn}
        isCameraOn={isCameraOn}
        micLevel={level}
      />
    </div>
  );
}
