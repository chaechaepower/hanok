import { FaVideo, FaVideoSlash } from 'react-icons/fa';
import { MdLiveTv } from 'react-icons/md';

import SellerActionButtons from '@/components/Live/Stream/SellerActionButtons';
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
  introduceButtonRef,
  startButtonRef,
  getTargetClassName,
}: Props) {
  return (
    <div className="relative flex min-w-0 flex-2 flex-col overflow-hidden rounded-2xl bg-background">
      <div className="flex flex-1 items-center justify-center">
        <video
          ref={videoPreviewRef}
          autoPlay
          muted
          playsInline
          className={`h-full w-full object-contain ${isCameraOn ? '' : 'hidden'}`}
          style={{ transform: 'scaleX(-1)' }}
        />
        {!isCameraOn && (
          <div className="flex flex-col items-center gap-3 text-white/20">
            <MdLiveTv size={60} />
            <span className="text-base">카메라가 꺼져 있습니다</span>
          </div>
        )}
      </div>

      <div className="absolute right-4 top-8 flex items-center gap-2 rounded-2xl bg-surface/80 px-2.5 py-2">
        <button
          type="button"
          onClick={onReopenTutorial}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-bold text-neutral-400 transition-all hover:text-neutral-200"
        >
          튜토리얼
        </button>
        <button
          type="button"
          onClick={isCameraOn ? onStopCamera : onStartCamera}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-bold transition-all ${
            isCameraOn ? 'text-neutral-400 hover:text-neutral-200' : 'text-accent hover:text-accent-light'
          }`}
        >
          {isCameraOn ? <FaVideo size={14} /> : <FaVideoSlash size={14} />}
          {isCameraOn ? '카메라 끄기' : '카메라 켜기'}
        </button>
      </div>

      <div className="pointer-events-none absolute bottom-9 left-4 right-4 flex h-30 items-stretch justify-center">
        <div className="pointer-events-auto flex max-w-125 flex-1 flex-col items-center gap-2 px-4">
          <SellerActionButtons
            onIntroduce={onPreviewIntroduce}
            onStart={onPreviewStart}
            canIntroduce
            canStart
            introduceButtonRef={introduceButtonRef}
            startButtonRef={startButtonRef}
            introduceButtonClassName={`${getTargetClassName('introduce')} text-base py-3 [&_span]:text-xs`}
            startButtonClassName={`${getTargetClassName('start')} text-base py-3 [&_span]:text-xs`}
          />
        </div>
      </div>
    </div>
  );
}
