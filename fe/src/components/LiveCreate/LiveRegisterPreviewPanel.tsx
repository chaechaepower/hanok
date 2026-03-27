import { useRef, useEffect } from 'react';
import { MdLiveTv } from 'react-icons/md';

import SellerControlBar from '@/components/Live/Stream/SellerControlBar';
import SellerGuideOverlay from '@/components/Live/Stream/SellerGuideOverlay';
import useMicLevel from '@/hooks/useMicLevel';
import type { LiveRegisterTutorialStepId } from './LiveRegisterTutorial';

type Props = {
  videoPreviewRef: React.RefObject<HTMLVideoElement | null>;
  isCameraOn: boolean;
  activeStepId: LiveRegisterTutorialStepId | null;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onReopenTutorial: () => void;
  onPreviewIntroduce: () => void;
  onPreviewStart: () => void;
  introduceButtonRef: React.RefObject<HTMLButtonElement | null>;
  startButtonRef: React.RefObject<HTMLButtonElement | null>;
  guidePanelRef: React.RefObject<HTMLDivElement | null>;
  getTargetClassName: (targetId: LiveRegisterTutorialStepId) => string;
};

export default function LiveRegisterPreviewPanel({
  videoPreviewRef,
  isCameraOn,
  activeStepId,
  onStartCamera,
  onStopCamera,
  onReopenTutorial,
  onPreviewIntroduce,
  onPreviewStart,
  introduceButtonRef,
  startButtonRef,
  guidePanelRef,
  getTargetClassName,
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

      {/* 우상단: 튜토리얼 */}
      <button
        type="button"
        onClick={onReopenTutorial}
        className="absolute right-4 top-4 flex items-center gap-1.5 rounded-2xl bg-surface/80 px-4 py-2 text-[13px] font-bold text-neutral-400 backdrop-blur-md transition-all hover:text-neutral-200"
      >
        경매 튜토리얼
      </button>

      {/* 좌상단: LIVE 뱃지 (미리보기) */}
      <div className="absolute left-3 top-4 z-10 flex items-center gap-1.5 rounded-full bg-accent/80 px-3 py-1.5 backdrop-blur-md">
        <div className="h-2 w-2 animate-pulse rounded-full bg-white" />
        <span className="translate-y-px text-xs font-black leading-none text-white">PREVIEW</span>
      </div>

      {/* 하단: 판매자 컨트롤바 */}
      <SellerGuideOverlay
        defaultOpen={false}
        forceOpen={activeStepId === 'guide'}
        containerClassName={activeStepId === 'guide' ? 'z-[60]' : ''}
        panelRef={guidePanelRef}
        panelClassName={getTargetClassName('guide')}
      />

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
        introduceButtonRef={introduceButtonRef}
        startButtonRef={startButtonRef}
        introduceButtonClassName={getTargetClassName('introduce')}
        startButtonClassName={getTargetClassName('start')}
      />
    </div>
  );
}
