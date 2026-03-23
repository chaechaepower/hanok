import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { IconType } from 'react-icons';
import { FiArrowDown, FiArrowUp, FiChevronLeft, FiCreditCard, FiInfo, FiZap } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { useGetTradeReports } from '@/api/hooks/useGetTradeReports';
import { useGetAccount } from '@/api/hooks/useGetAccount';
import { completeWalletCharge } from '@/api/hooks/usePostCompleteWalletCharge';
import { createWalletCharge } from '@/api/hooks/usePostWalletCharge';
import { createWalletWithdrawal } from '@/api/hooks/usePostWalletWithdrawal';
import { useGetWallet } from '@/api/hooks/useGetWallet';
import HistoryRowSkeleton from '@/components/Wallet/HistoryRowSkeleton';
import PointManagementModal, { type PointModalType } from '@/components/Wallet/PointManagementModal';
import Button from '@/components/common/Button';
import { MIN_WALLET_CHARGE_AMOUNT } from '@/constants/wallet';
import type { TradeReportItem } from '@/types';
import { requestPointChargePayment } from '@/utils/requestPointChargePayment';
import coins from '@/assets/coins.png';
import { useToast } from '@/hooks/useToast';

type WalletType = 'charge' | 'withdraw' | 'settlement';

type WalletHistoryItem = {
  id: string;
  title: string;
  occurredAt: string;
  amount: number;
  status: string;
  kind: WalletType;
};

const numberFormatter = new Intl.NumberFormat('ko-KR');

const walletTabs: Array<{ key: WalletType; label: string }> = [
  { key: 'charge', label: '충전 내역' },
  { key: 'withdraw', label: '출금 내역' },
  { key: 'settlement', label: '정산 내역' },
];

export default function WalletPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<WalletType>('withdraw');
  const [isPointModalOpen, setIsPointModalOpen] = useState(false);
  const [pointModalType, setPointModalType] = useState<PointModalType>('charge');
  const [pointAmountInput, setPointAmountInput] = useState('');
  const [isDirectInputMode, setIsDirectInputMode] = useState(false);
  const [isPointSubmitting, setIsPointSubmitting] = useState(false);
  const pointInputRef = useRef<HTMLInputElement>(null);
  const { data: account } = useGetAccount();
  const { data: wallet, isLoading } = useGetWallet();
  const { showToast } = useToast();

  const chargeReportsQuery = useGetTradeReports('CHARGE', activeTab === 'charge');
  const withdrawReportsQuery = useGetTradeReports('WITHDRAW', activeTab === 'withdraw');
  const settlementReportsQuery = useGetTradeReports('SETTLEMENT', activeTab === 'settlement');

  const balance = wallet?.balance ?? 0;
  const depositedBalance = wallet?.depositedBalance ?? 0;
  const registeredWithdrawAccount = account ? `${account.bankName} ${account.accountNum}(등록됨)` : '';
  const numericPointAmount = Number(pointAmountInput || 0);
  const clampWithdrawAmount = (amount: number) => {
    if (pointModalType !== 'withdraw') return amount;
    return Math.min(amount, balance);
  };

  const chargeHistory = mapTradeReportsToHistory('charge', chargeReportsQuery.data ?? []);
  const withdrawHistory = mapTradeReportsToHistory('withdraw', withdrawReportsQuery.data ?? []);
  const settlementHistory = mapTradeReportsToHistory('settlement', settlementReportsQuery.data ?? []);

  const historyByTab: Record<WalletType, WalletHistoryItem[]> = {
    charge: chargeHistory,
    withdraw: withdrawHistory,
    settlement: settlementHistory,
  };

  const historyLoadingByTab: Record<WalletType, boolean> = {
    charge: chargeReportsQuery.isLoading,
    withdraw: withdrawReportsQuery.isLoading,
    settlement: settlementReportsQuery.isLoading,
  };

  const currentHistory = historyByTab[activeTab];
  const isHistoryLoading = historyLoadingByTab[activeTab];

  const openPointModal = (type: PointModalType) => {
    setPointModalType(type);
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
      showToast({ message: '잔고가 부족합니다.' });
    }

    setPointAmountInput(sanitizedValue ? String(nextAmount) : '');
    setIsDirectInputMode(true);
  };

  const handlePointPresetClick = (amount: number) => {
    if (pointModalType === 'withdraw' && amount > balance) {
      showToast({ message: '잔고가 부족합니다.' });
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
    if (numericPointAmount <= 0) return;

    if (isPointSubmitting) return;

    if (pointModalType === 'charge' && numericPointAmount < MIN_WALLET_CHARGE_AMOUNT) {
      setPointAmountInput(String(MIN_WALLET_CHARGE_AMOUNT));
      showToast({ message: '최소 10000원부터 충전 가능합니다.' });
      return;
    }

    setIsPointSubmitting(true);

    try {
      if (pointModalType === 'withdraw') {
        await createWalletWithdrawal({
          amount: numericPointAmount,
        });

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['wallet'] }),
          queryClient.invalidateQueries({ queryKey: ['tradeReports', 'WITHDRAW'] }),
        ]);

        showToast({ message: '출금 요청이 완료되었습니다.' });
        closePointModal();
        return;
      }

      const chargeResponse = await createWalletCharge({
        amount: numericPointAmount,
      });
      const initialPaymentId = chargeResponse.paymentId;

      const response = await requestPointChargePayment({
        amount: numericPointAmount,
        paymentId: initialPaymentId,
      });

      if (!response) {
        showToast({ message: '결제창을 열지 못했습니다. 팝업 차단 여부를 확인해주세요.' });
        return;
      }

      if (response.code) {
        showToast({ message: response.message ?? '결제가 취소되었거나 실패했습니다.' });
        return;
      }

      await completeWalletCharge({
        paymentId: initialPaymentId,
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['wallet'] }),
        queryClient.invalidateQueries({ queryKey: ['tradeReports', 'CHARGE'] }),
      ]);

      showToast({ message: '결제가 완료되었습니다.' });
      closePointModal();
    } catch (error) {
      showToast({ message: error instanceof Error ? error.message : '결제 요청 중 오류가 발생했습니다.' });
    } finally {
      setIsPointSubmitting(false);
    }
  };

  return (
    <>
      <section className="max-w-[1100px] w-full text-neutral-100">
        <div className="mx-auto flex w-full flex-col gap-8 pb-16 pt-8">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-warm transition hover:bg-white/6"
                aria-label="이전 페이지로 이동"
              >
                <FiChevronLeft className="h-6 w-6" />
              </button>
              <h1 className="text-2xl font-bold text-warm leading-tight">내 가상머니</h1>
            </div>
            <p className="text-neutral-500 text-sm mt-1 ml-12">
              경매 입찰을 위한 가상머니 충전 및 정산 내역을 관리합니다.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <article className="relative overflow-hidden rounded-(--radius-panel) bg-surface-elevated px-8 py-6 shadow-[0_30px_80px_rgba(0,0,0,0.28)]">
              <div className="relative z-10 flex max-w-67.5 flex-col gap-5">
                <div className="space-y-3">
                  <p className="text-lg font-semibold text-white">보유 머니</p>
                  <div className="space-y-2">
                    {isLoading ? (
                      <>
                        <div className="h-10 w-52.5 animate-pulse rounded-xl bg-white/10 sm:h-12 sm:w-62.5" />
                        <div className="h-4 w-32.5 animate-pulse rounded-md bg-white/8" />
                      </>
                    ) : (
                      <>
                        <p className="text-[32px] font-bold tracking-[-0.03em] text-gold-light">
                          {formatMoney(balance)} 원
                        </p>
                        <p className="text-[14px] text-neutral-400">= {formatMoney(balance)} KRW</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-row gap-3">
                  <div className="w-full">
                    <Button variant="warm" className="gap-2 font-semibold" onClick={() => openPointModal('charge')}>
                      <FiZap className="h-4 w-4" />
                      충전하기
                    </Button>
                  </div>
                  <div className="w-full">
                    <Button
                      variant="warmOutline"
                      className="gap-2 font-semibold"
                      onClick={() => openPointModal('withdraw')}
                    >
                      <FiCreditCard className="h-4 w-4" />
                      출금하기
                    </Button>
                  </div>
                </div>
              </div>

              <img src={coins} alt="coins" className="absolute right-4 bottom-6 w-50 md:block" />
            </article>

            <article className="flex flex-col justify-between rounded-(--radius-panel) bg-surface-elevated px-8 py-6 shadow-[0_30px_80px_rgba(0,0,0,0.28)]">
              <div className="space-y-3">
                <p className="text-lg font-semibold text-white">경매 예치 머니</p>
                <div className="space-y-2">
                  {isLoading ? (
                    <>
                      <div className="h-10 w-45 animate-pulse rounded-xl bg-white/10 sm:h-12 sm:w-55" />
                      <div className="h-4 w-42.5 animate-pulse rounded-md bg-white/8" />
                    </>
                  ) : (
                    <>
                      <p className="text-[32px] font-bold tracking-[-0.03em] text-gold">
                        {formatMoney(depositedBalance)} 원
                      </p>
                      <p className="text-[14px] text-neutral-500">현재 거래 대기 중인 금액입니다.</p>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-primary-muted bg-primary-muted/30 px-4 py-3 text-[14px] text-gold">
                <FiInfo className="h-4 w-4 shrink-0" />
                <p>거래 완료 또는 유찰 시 자동 반환/정산됩니다.</p>
              </div>
            </article>
          </div>

          <article className="rounded-(--radius-section) bg-surface-elevated px-5 py-5 shadow-[0_26px_70px_rgba(0,0,0,0.24)] sm:px-7 sm:py-6">
            <div className="border-b border-neutral-800">
              <div className="macro-scroll flex gap-2 overflow-x-auto">
                {walletTabs.map((tab) => {
                  const isActive = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      className={`relative shrink-0 px-3 py-4 text-sm font-semibold transition sm:px-4 sm:text-[15px] ${
                        isActive ? 'text-gold' : 'text-neutral-500 hover:text-neutral-300'
                      }`}
                    >
                      {tab.label}
                      {isActive && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-gold" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col pt-6">
              {isHistoryLoading ? (
                Array.from({ length: 3 }, (_, index) => <HistoryRowSkeleton key={index} />)
              ) : currentHistory.length > 0 ? (
                currentHistory.map((item) => (
                  <HistoryRow
                    key={item.id}
                    item={item}
                    onClick={item.kind === 'settlement' ? () => navigate('/tracking') : undefined}
                  />
                ))
              ) : (
                <div className="px-2 py-10 text-center text-sm text-neutral-500">내역이 없습니다.</div>
              )}
            </div>
          </article>
        </div>
      </section>

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

function HistoryRow({ item, onClick }: { item: WalletHistoryItem; onClick?: () => void }) {
  const iconMap: Record<WalletType, { icon: IconType; wrapperClassName: string; iconClassName: string }> = {
    charge: {
      icon: FiArrowDown,
      wrapperClassName: 'bg-ember-muted',
      iconClassName: 'text-ember-light',
    },
    withdraw: {
      icon: FiArrowUp,
      wrapperClassName: 'bg-gold-muted',
      iconClassName: 'text-gold-light',
    },
    settlement: {
      icon: FiArrowUp,
      wrapperClassName: 'bg-primary-muted',
      iconClassName: 'text-neutral-100',
    },
  };

  const settlementIcon = item.amount < 0 ? FiArrowUp : FiArrowDown;
  const {
    icon: Icon,
    wrapperClassName,
    iconClassName,
  } = item.kind === 'settlement' ? { ...iconMap.settlement, icon: settlementIcon } : iconMap[item.kind];

  return (
    <div
      className={`flex flex-col items-start gap-4 rounded-(--radius-panel) px-2 py-4 transition hover:bg-white/2 sm:flex-row sm:items-center sm:justify-between sm:px-3 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex min-w-0 items-center gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${wrapperClassName}`}>
          <Icon className={`h-5 w-5 ${iconClassName}`} />
        </div>
        <div className="min-w-0 space-y-2">
          <p className="truncate text-[17px] font-semibold text-neutral-100">{item.title}</p>
          <p className="text-sm text-neutral-500">{item.occurredAt}</p>
        </div>
      </div>

      <div className="w-full shrink-0 text-left sm:w-auto sm:text-right">
        <p className="text-[20px] font-bold tracking-[-0.02em] text-neutral-100">
          {formatTransactionAmount(item.amount)}
        </p>
        <p className="mt-2 text-sm text-neutral-500">{item.status}</p>
      </div>
    </div>
  );
}

function mapTradeReportsToHistory(
  kind: Extract<WalletType, 'charge' | 'withdraw' | 'settlement'>,
  reports: TradeReportItem[],
) {
  const config = {
    charge: { title: '충전', status: '충전 완료', sign: 1, kind: 'charge' as const },
    withdraw: { title: '출금', status: '출금 완료', sign: -1, kind: 'withdraw' as const },
    settlement: { title: '정산', status: '정산 완료', sign: 1, kind: 'settlement' as const },
  }[kind];

  return reports.map((report, index) => ({
    id: `${kind}-${report.createdAt}-${index}`,
    title: kind === 'settlement' && report.itemName ? report.itemName : config.title,
    occurredAt: report.createdAt.replace('T', ' '),
    amount: report.amount * config.sign,
    status: config.status,
    kind: config.kind,
  }));
}

function formatMoney(amount: number) {
  return numberFormatter.format(amount);
}

function formatTransactionAmount(amount: number) {
  const sign = amount > 0 ? '+' : '-';
  return `${sign} ${formatMoney(Math.abs(amount))}원`;
}
