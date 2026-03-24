import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useGetAccount } from '@/api/hooks/useGetAccount';
import { completeWalletCharge } from '@/api/hooks/usePostCompleteWalletCharge';
import { createWalletCharge } from '@/api/hooks/usePostWalletCharge';
import { useGetWallet } from '@/api/hooks/useGetWallet';
import type { PointModalType } from '@/components/common/modal/PointManagementModal';
import { MIN_WALLET_CHARGE_AMOUNT } from '@/constants/wallet';
import { useToast } from '@/hooks/useToast';
import { requestPointChargePayment } from '@/utils/requestPointChargePayment';

export default function useStreamPointManagement() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data: wallet } = useGetWallet();
  const { data: account } = useGetAccount();

  const balance = wallet?.balance ?? 0;
  const registeredWithdrawAccount = account ? `${account.bankName} ${account.accountNum}(등록됨)` : '';

  const [isPointModalOpen, setIsPointModalOpen] = useState(false);
  const [pointModalType, setPointModalType] = useState<PointModalType>('charge');
  const [pointAmountInput, setPointAmountInput] = useState('');
  const [isDirectInputMode, setIsDirectInputMode] = useState(false);
  const [isPointSubmitting, setIsPointSubmitting] = useState(false);
  const pointInputRef = useRef<HTMLInputElement>(null);
  const numericPointAmount = Number(pointAmountInput || 0);

  const clampWithdrawAmount = (amount: number) => {
    if (pointModalType !== 'withdraw') {
      return amount;
    }

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
    const requestedAmount = Number(sanitizedValue || 0);
    const isOverBalance = pointModalType === 'withdraw' && requestedAmount > balance;
    const nextAmount = clampWithdrawAmount(requestedAmount);

    if (isOverBalance) {
      showToast({ message: '보유 포인트를 초과할 수 없습니다.' });
    }

    setPointAmountInput(sanitizedValue ? String(nextAmount) : '');
    setIsDirectInputMode(true);
  };

  const handlePointPresetClick = (amount: number) => {
    if (pointModalType === 'withdraw' && amount > balance) {
      showToast({ message: '보유 포인트를 초과할 수 없습니다.' });
    }

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
    if (numericPointAmount <= 0 || isPointSubmitting) {
      return;
    }

    if (pointModalType === 'charge' && numericPointAmount < MIN_WALLET_CHARGE_AMOUNT) {
      setPointAmountInput(String(MIN_WALLET_CHARGE_AMOUNT));
      showToast({ message: '최소 10000원부터 충전 가능합니다.' });
      return;
    }

    setIsPointSubmitting(true);

    try {
      if (pointModalType === 'withdraw') {
        return;
      }

      const chargeResponse = await createWalletCharge({ amount: numericPointAmount });
      const paymentId = chargeResponse.paymentId;
      const paymentResponse = await requestPointChargePayment({
        amount: numericPointAmount,
        paymentId,
      });

      if (!paymentResponse) {
        showToast({ message: '결제 응답을 확인하지 못했습니다. 잠시 후 다시 시도해주세요.' });
        return;
      }

      if (paymentResponse.code) {
        showToast({ message: paymentResponse.message ?? '결제가 취소되었거나 실패했습니다.' });
        return;
      }

      await completeWalletCharge({ paymentId });
      await queryClient.invalidateQueries({ queryKey: ['wallet'] });

      showToast({ message: '충전이 완료되었습니다.' });
      closePointModal();
    } catch (error) {
      showToast({
        message: error instanceof Error ? error.message : '충전 처리 중 문제가 발생했습니다.',
      });
    } finally {
      setIsPointSubmitting(false);
    }
  };

  return {
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
  };
}
