import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { LuShare, LuWallet } from 'react-icons/lu';

import { useGetAccount } from '@/api/hooks/useGetAccount';
import { completeWalletCharge } from '@/api/hooks/usePostCompleteWalletCharge';
import { createWalletCharge } from '@/api/hooks/usePostWalletCharge';
import { useGetWallet } from '@/api/hooks/useGetWallet';
import { useToast } from '@/components/common/Toast';
import PointManagementModal, { type PointModalType } from '@/components/Wallet/PointManagementModal';
import { requestPointChargePayment } from '@/utils/requestPointChargePayment';

interface Props {
  viewerCount?: number;
  isSeller?: boolean;
}

export default function StreamOverlay({ viewerCount = 0, isSeller = false }: Props) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data: wallet } = useGetWallet();
  const { data: account } = useGetAccount();
  const balance = wallet?.balance ?? 0;
  const registeredWithdrawAccount = account ? `${account.bankName} ${account.accountNumber}(등록됨)` : '';

  const [isPointModalOpen, setIsPointModalOpen] = useState(false);
  const [pointModalType, setPointModalType] = useState<PointModalType>('charge');
  const [pointAmountInput, setPointAmountInput] = useState('');
  const [isDirectInputMode, setIsDirectInputMode] = useState(false);
  const [isPointSubmitting, setIsPointSubmitting] = useState(false);
  const pointInputRef = useRef<HTMLInputElement>(null);
  const numericPointAmount = Number(pointAmountInput || 0);

  const clampWithdrawAmount = (amount: number) => {
    if (pointModalType !== 'withdraw') return amount;
    return Math.min(amount, balance);
  };

  const openChargeModal = () => {
    setPointModalType('charge');
    setPointAmountInput('');
    setIsDirectInputMode(false);
    setIsPointModalOpen(true);
  };

  const closePointModal = () => {
    setIsPointModalOpen(false);
    setPointAmountInput('');
    setIsDirectInputMode(false);
  };

  const handlePointModalTabChange = (type: PointModalType) => {
    setPointModalType(type);
    setPointAmountInput('');
    setIsDirectInputMode(false);
  };

  const handlePointAmountChange = (value: string) => {
    const sanitizedValue = value.replace(/\D/g, '');
    const nextAmount = clampWithdrawAmount(Number(sanitizedValue || 0));
    setPointAmountInput(sanitizedValue ? String(nextAmount) : '');
    setIsDirectInputMode(true);
  };

  const handlePointPresetClick = (amount: number) => {
    setPointAmountInput(String(clampWithdrawAmount(amount)));
    setIsDirectInputMode(false);
  };

  const handleDirectInputClick = () => {
    if (pointModalType === 'withdraw') {
      setPointAmountInput(String(balance));
      setIsDirectInputMode(false);
      return;
    }
    setIsDirectInputMode(true);
    pointInputRef.current?.focus();
  };

  const handlePointAction = async () => {
    if (numericPointAmount <= 0 || isPointSubmitting) return;

    setIsPointSubmitting(true);

    try {
      if (pointModalType === 'withdraw') {
        return;
      }

      const chargeResponse = await createWalletCharge({ amount: numericPointAmount });
      const initialPaymentId = chargeResponse.paymentId;
      const response = await requestPointChargePayment({ amount: numericPointAmount, paymentId: initialPaymentId });

      if (!response) {
        showToast({ message: '결제창을 열지 못했습니다. 팝업 차단 여부를 확인해주세요.' });
        return;
      }

      if (response.code) {
        showToast({ message: response.message ?? '결제가 취소되었거나 실패했습니다.' });
        return;
      }

      await completeWalletCharge({ paymentId: initialPaymentId });
      await queryClient.invalidateQueries({ queryKey: ['wallet'] });

      showToast({ message: '충전이 완료되었습니다.' });
      closePointModal();
    } catch (error) {
      showToast({ message: error instanceof Error ? error.message : '충전 중 오류가 발생했습니다.' });
    } finally {
      setIsPointSubmitting(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast({ message: '링크가 복사되었습니다.' });
    } catch {
      /* noop */
    }
  };

  return (
    <>
      <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
        <div className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1">
          <div className="h-2 w-2 animate-pulse rounded-full bg-white" />
          <span className="text-xs font-black text-white">LIVE {viewerCount.toLocaleString('ko-KR')}</span>
        </div>
      </div>

      {!isSeller && (
        <div className="absolute right-4 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-4">
          <button
            type="button"
            onClick={() => void handleShare()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface/70 text-neutral-300 backdrop-blur-md transition hover:bg-surface hover:text-neutral-100"
            aria-label="공유하기"
          >
            <LuShare size={18} />
          </button>
          <button
            type="button"
            onClick={openChargeModal}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface/70 text-neutral-300 backdrop-blur-md transition hover:bg-surface hover:text-neutral-100"
            aria-label="충전하기"
          >
            <LuWallet size={18} />
          </button>
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
