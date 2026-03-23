import type { RefObject } from 'react';
import { FiInfo, FiX } from 'react-icons/fi';

import Button from '@/components/common/Button';

export type PointModalType = 'charge' | 'withdraw';

type PointManagementModalProps = {
  isOpen: boolean;
  activeTab: PointModalType;
  amountInput: string;
  registeredWithdrawAccount: string;
  isDirectInputMode: boolean;
  isSubmitting?: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  onClose: () => void;
  onTabChange: (tab: PointModalType) => void;
  onAmountChange: (value: string) => void;
  onPresetClick: (amount: number) => void;
  onDirectInputClick: () => void;
  onSubmit: () => void | Promise<void>;
};

const pointPresetAmounts = [10000, 50000, 100000];
const numberFormatter = new Intl.NumberFormat('ko-KR');

export default function PointManagementModal({
  isOpen,
  activeTab,
  amountInput,
  registeredWithdrawAccount,
  isDirectInputMode,
  isSubmitting = false,
  inputRef,
  onClose,
  onTabChange,
  onAmountChange,
  onPresetClick,
  onDirectInputClick,
  onSubmit,
}: PointManagementModalProps) {
  if (!isOpen) return null;

  const submitLabel = activeTab === 'charge' ? '충전하기' : '환전하기';
  const amountLabel = activeTab === 'charge' ? '충전 금액' : '환전 요청 금액';
  const helperText =
    activeTab === 'charge'
      ? '충전한 금액은 즉시 포인트로 발행되어\n경매 입찰에 사용할 수 있습니다.'
      : '환전 요청 시 경매에 예치 되지 않은 \u2018가용 포인트\u2019 내에서 가능하며, 평일 기준 1~2일 이내에 등록된 계좌로 입금됩니다.';
  const formattedAmount = amountInput ? formatMoney(Number(amountInput)) : '';
  const selectedPreset = isDirectInputMode
    ? null
    : (pointPresetAmounts.find((amount) => amount === Number(amountInput)) ?? null);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-135 rounded-(--radius-panel) bg-surface-elevated px-8 py-9 shadow-[0_30px_90px_rgba(0,0,0,0.45)]"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="가상머니 관리"
      >
        <div className="flex items-start justify-between">
          <h2 className="text-[24px] font-bold text-neutral-100">가상머니 관리</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="모달 닫기"
            className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-100 transition hover:bg-white/6"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>

        <div className="mt-8 flex border-b border-neutral-800">
          {(['charge', 'withdraw'] as const).map((tab) => {
            const isActive = activeTab === tab;
            const label = tab === 'charge' ? '충전하기' : '출금하기';

            return (
              <button
                key={tab}
                type="button"
                onClick={() => onTabChange(tab)}
                className={`relative flex-1 pb-4 text-center text-[18px] font-semibold transition ${
                  isActive ? 'text-gold-light' : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                {label}
                {isActive && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-gold-light" />}
              </button>
            );
          })}
        </div>

        <div className="mt-9">
          <p className="text-[15px] font-semibold text-neutral-100">{amountLabel}</p>
          <div className="relative mt-4">
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              value={formattedAmount}
              onChange={(event) => onAmountChange(event.target.value)}
              placeholder="0"
              className="h-16 w-full rounded-(--radius-panel) border border-neutral-800 bg-transparent px-6 pr-16 text-right text-[28px] font-semibold text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-gold-light transition-colors"
            />
            <span className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 text-[18px] font-semibold text-neutral-500">
              원
            </span>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {pointPresetAmounts.map((amount) => {
              const isSelected = selectedPreset === amount;

              return (
                <button
                  key={amount}
                  type="button"
                  onClick={() => onPresetClick(amount)}
                  className={`flex h-12 items-center justify-center rounded-(--radius-control) border text-[16px] font-semibold transition ${
                    isSelected
                      ? 'border-gold bg-gold/10 text-neutral-100'
                      : 'border-neutral-800 text-neutral-100 hover:border-neutral-600'
                  }`}
                >
                  + {formatCompactAmount(amount)}
                </button>
              );
            })}

            <button
              type="button"
              onClick={onDirectInputClick}
              className={`flex h-12 items-center justify-center rounded-(--radius-control) border text-[16px] font-semibold transition ${
                isDirectInputMode
                  ? 'border-gold bg-gold/10 text-neutral-100'
                  : 'border-neutral-800 text-neutral-100 hover:border-neutral-600'
              }`}
            >
              {activeTab === 'charge' ? '직접 입력' : '전액'}
            </button>
          </div>
        </div>

        {activeTab === 'withdraw' && (
          <div className="mt-10">
            <p className="text-[15px] font-semibold text-neutral-100">출금 계좌</p>
            <input
              type="text"
              value={registeredWithdrawAccount}
              readOnly
              className="mt-4 h-14 w-full rounded-(--radius-panel) border border-neutral-800 bg-transparent px-6 text-[16px] font-medium text-neutral-500 outline-none"
            />
          </div>
        )}

        <div className="mt-14 flex items-start gap-3 text-gold-light">
          <FiInfo className="mt-1 h-6 w-6 shrink-0" />
          <p className="whitespace-pre-line text-[15px] leading-6 text-gold-light">{helperText}</p>
        </div>

        <div className="mt-6">
          <Button
            variant="white"
            className="h-15 rounded-(--radius-panel) text-[18px] font-semibold"
            disabled={isSubmitting || !amountInput || Number(amountInput) <= 0}
            onClick={onSubmit}
          >
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

function formatMoney(amount: number) {
  return numberFormatter.format(amount);
}

function formatCompactAmount(amount: number) {
  return `${numberFormatter.format(amount / 10000)}만`;
}
