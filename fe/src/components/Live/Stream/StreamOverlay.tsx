import type { ReactNode } from 'react';
import { IoMdShare } from 'react-icons/io';
import { LuWallet } from 'react-icons/lu';

import HoverTooltip from '@/components/common/HoverTooltip';
import PointManagementModal from '@/components/common/modal/PointManagementModal';
import { useToast } from '@/hooks/useToast';

import useStreamPointManagement from '@/hooks/useStreamPointManagement';

interface Props {
  viewerCount?: number;
  isSeller?: boolean;
}

function OverlayIconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <div className="group relative flex items-center justify-center">
      <button
        type="button"
        onClick={onClick}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-surface/70 text-neutral-300 backdrop-blur-md transition hover:bg-surface hover:text-neutral-100"
        aria-label={label}
      >
        {children}
      </button>
      <HoverTooltip label={label} placement="left" />
    </div>
  );
}

export default function StreamOverlay({ viewerCount = 0, isSeller = false }: Props) {
  const { showToast } = useToast();
  const {
    isPointModalOpen,
    pointModalType,
    pointAmountInput,
    registeredWithdrawAccount,
    isDirectInputMode,
    isPointSubmitting,
    pointInputRef,
    openChargeModal,
    closePointModal,
    handlePointModalTabChange,
    handlePointAmountChange,
    handlePointPresetClick,
    handleDirectInputClick,
    handlePointAction,
  } = useStreamPointManagement();

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast({ message: '링크가 복사되었습니다.' });
    } catch {
      // noop
    }
  };

  return (
    <>
      <div className="absolute left-3 top-3 z-10 flex items-center gap-3">
        <div className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5">
          <div className="h-2 w-2 animate-pulse rounded-full bg-white" />
          <span className="translate-y-px text-xs leading-none font-black text-white">
            LIVE {viewerCount.toLocaleString('ko-KR')}
          </span>
        </div>
      </div>

      {!isSeller && (
        <div className="absolute right-3 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-4">
          <OverlayIconButton label="공유하기" onClick={() => void handleShare()}>
            <IoMdShare size={18} />
          </OverlayIconButton>
          <OverlayIconButton label="가상머니 충전" onClick={openChargeModal}>
            <LuWallet size={18} />
          </OverlayIconButton>
        </div>
      )}

      <PointManagementModal
        isOpen={isPointModalOpen}
        activeTab={pointModalType}
        amountInput={pointAmountInput}
        registeredWithdrawAccount={registeredWithdrawAccount}
        isDirectInputMode={isDirectInputMode}
        isSubmitting={isPointSubmitting}
        inputRef={pointInputRef}
        onClose={closePointModal}
        onTabChange={handlePointModalTabChange}
        onAmountChange={handlePointAmountChange}
        onPresetClick={handlePointPresetClick}
        onDirectInputClick={handleDirectInputClick}
        onSubmit={handlePointAction}
      />
    </>
  );
}
