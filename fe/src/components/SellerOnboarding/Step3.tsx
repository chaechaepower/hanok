import { useState } from 'react';

import Button from '@/components/common/Button';
import BankSelectModal from '@/components/common/BankSelectModal';
import type { AccountData } from '@/types';
import type { UserAccountResponse } from '@/types/wallet';
import { BANKS } from '@/constants/sellerRegister';

type Step3Props = {
  onPrev: () => void;
  onNext: (data: AccountData) => void;
  hasExistingAccount: boolean;
  existingAccount: UserAccountResponse | null;
};

const inputClass =
  'w-full h-14 rounded-xl border border-neutral-800 bg-background px-5 text-base text-white outline-none font-[inherit]';

export default function Step3({ onPrev, onNext, hasExistingAccount, existingAccount }: Step3Props) {
  const existingBankCode = existingAccount?.bankName
    ? BANKS.find((bank) => bank.name === existingAccount.bankName)?.code || ''
    : '';

  const [accountName, setAccountName] = useState(existingAccount?.accountName || '');
  const [bank, setBank] = useState(existingBankCode);
  const [accountNumber, setAccountNumber] = useState(existingAccount?.accountNum || '');
  const [error, setError] = useState('');
  const [showBankModal, setShowBankModal] = useState(false);

  const selectedBankName = BANKS.find((item) => item.code === bank)?.name || '';

  const handleNext = () => {
    if (hasExistingAccount) {
      onNext({
        bankCode: existingBankCode,
        accountNum: existingAccount?.accountNum || '',
        accountName: existingAccount?.accountName || '',
      });
      return;
    }

    if (!accountName) {
      setError('예금주명을 입력해주세요.');
      return;
    }

    if (!bank) {
      setError('은행을 선택해주세요.');
      return;
    }

    if (!accountNumber) {
      setError('계좌번호를 입력해주세요.');
      return;
    }

    setError('');
    onNext({ bankCode: bank, accountNum: accountNumber, accountName });
  };

  const handleSelectBank = (code: string) => {
    setBank(code);
    setError('');
    setShowBankModal(false);
  };

  return (
    <>
      <div className="mb-8">
        <h2 className="mb-3 text-2xl font-bold text-white">정산받을 은행 계좌 인증을 진행해주세요</h2>
        <p className="text-base text-neutral-300">판매 금액이 정산되는 계좌입니다</p>
      </div>

      {hasExistingAccount ? (
        <div className="mb-6 rounded-2xl border border-neutral-800 bg-surface p-8">
          <div className="mb-6 flex items-center gap-3">
            <p className="m-0 text-lg font-semibold text-neutral-200">계좌 정보</p>
            <span className="rounded-md bg-primary-light px-2.5 py-1 text-sm font-semibold text-background">
              등록됨
            </span>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between">
              <span className="text-base text-neutral-500">예금주</span>
              <span className="text-base text-white">{existingAccount?.accountName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-base text-neutral-500">은행</span>
              <span className="text-base text-white">{existingAccount?.bankName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-base text-neutral-500">계좌번호</span>
              <span className="text-base text-white">{existingAccount?.accountNum}</span>
            </div>
          </div>
          <p className="mb-0 mt-5 text-sm text-neutral-600">계좌 변경은 설정에서 가능합니다</p>
        </div>
      ) : (
        <>
          <p className="mb-4 text-base font-semibold text-neutral-200">계좌 정보 입력</p>

          <div className="mb-5">
            <input
              type="text"
              value={accountName}
              onChange={(event) => {
                setAccountName(event.target.value);
                setError('');
              }}
              placeholder="예금주명"
              className={inputClass}
            />
          </div>

          <div className="mb-5">
            <button
              type="button"
              onClick={() => setShowBankModal(true)}
              className={`${inputClass} flex cursor-pointer items-center justify-between text-left ${
                bank ? 'text-white' : 'text-neutral-600'
              }`}
            >
              <span>{bank ? selectedBankName : '은행/증권사 선택'}</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-neutral-500"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          </div>

          <BankSelectModal
            isOpen={showBankModal}
            selectedCode={bank}
            onClose={() => setShowBankModal(false)}
            onSelect={(selectedBank) => handleSelectBank(selectedBank.code)}
            activeTabClassName="border-primary-light text-primary-light"
            selectedItemClassName="bg-primary-light font-bold text-background"
          />

          <div className="mb-5">
            <input
              type="text"
              value={accountNumber}
              onChange={(event) => {
                setAccountNumber(event.target.value.replace(/\D/g, ''));
                setError('');
              }}
              placeholder="계좌번호"
              className={inputClass}
              maxLength={20}
            />
          </div>

          {error && <p className="mb-3 pl-1 text-sm text-accent-light">{error}</p>}
        </>
      )}

      <div className="sticky bottom-0 flex justify-between bg-background pb-6 pt-8">
        <Button variant="outline" onClick={onPrev} className="w-32! h-12! rounded-xl! text-base!">
          이전
        </Button>
        <Button onClick={handleNext} className="w-32! h-12! rounded-xl! text-base!">
          다음
        </Button>
      </div>
    </>
  );
}
