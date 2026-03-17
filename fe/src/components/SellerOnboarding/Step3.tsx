import { useState } from 'react';
import Button from '@/components/common/Button';
import { BANKS } from '../../pages/SellerOnboarding/constants';
import type { AccountData } from '@/types';
import type { UserAccountResponse } from '@/types/wallet';

type Step3Props = {
  onPrev: () => void;
  onNext: (data: AccountData) => void;
  hasExistingAccount: boolean;
  existingAccount: UserAccountResponse | null;
};

const BANK_LIST = BANKS.filter((b) => Number(b.code) < 200);
const STOCK_LIST = BANKS.filter((b) => Number(b.code) >= 200);

const inputClass = 'w-full h-12 bg-background border border-neutral-800 rounded-lg text-white text-sm px-4 outline-none font-[inherit]';

export default function Step3({ onPrev, onNext, hasExistingAccount, existingAccount }: Step3Props) {
  const existingBankCode = existingAccount?.bankName
    ? BANKS.find((b) => b.name === existingAccount.bankName)?.code || ''
    : '';
  const [accountName, setaccountName] = useState(existingAccount?.accountName || '');
  const [bank, setBank] = useState(existingBankCode);
  const [accountNumber, setAccountNumber] = useState(existingAccount?.accountNum || '');
  const [error, setError] = useState('');
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankTab, setBankTab] = useState<'bank' | 'stock'>('bank');

  const selectedBankName = BANKS.find((b) => b.code === bank)?.name || '';

  const handleNext = () => {
    if (hasExistingAccount) {
      onNext({ bankCode: existingBankCode, accountNum: existingAccount?.accountNum || '', accountName: existingAccount?.accountName || '' });
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

  const currentList = bankTab === 'bank' ? BANK_LIST : STOCK_LIST;

  return (
    <>
      <div className="mb-7">
        <h2 className="text-[17px] font-bold text-white mb-2">
          정산받을 은행 계좌 인증을 진행해주세요.
        </h2>
        <p className="text-sm text-neutral-300">판매 금액이 정산되는 계좌입니다.</p>
      </div>

      {hasExistingAccount ? (
        <div className="bg-surface border border-neutral-800 rounded-xl p-6 mb-4">
          <div className="flex items-center gap-2 mb-5">
            <p className="text-[15px] text-neutral-200 font-semibold m-0">계좌 정보</p>
            <span className="text-xs text-background bg-primary-light rounded px-2 py-0.5 font-semibold">등록됨</span>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between">
              <span className="text-sm text-neutral-500">예금주</span>
              <span className="text-sm text-white">{existingAccount?.accountName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-500">은행</span>
              <span className="text-sm text-white">{existingAccount?.bankName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-500">계좌번호</span>
              <span className="text-sm text-white">{existingAccount?.accountNum}</span>
            </div>
          </div>
          <p className="text-xs text-neutral-600 mt-4 mb-0">계좌 변경은 설정에서 가능합니다.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-neutral-200 mb-3 font-semibold">계좌 정보 입력</p>

          <div className="mb-4">
            <input
              type="text"
              value={accountName}
              onChange={(e) => {
                setaccountName(e.target.value);
                setError('');
              }}
              placeholder="예금주명"
              className={inputClass}
            />
          </div>

          <div className="mb-4">
            <button
              type="button"
              onClick={() => setShowBankModal(true)}
              className={`${inputClass} text-left cursor-pointer flex items-center justify-between ${bank ? 'text-white' : 'text-neutral-600'}`}
            >
              <span>{bank ? selectedBankName : '은행/증권사 선택'}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-500">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          </div>

          {showBankModal && (
            <div
              className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60"
              onClick={() => setShowBankModal(false)}
            >
              <div
                className="w-full max-w-[430px] max-h-[70vh] bg-surface rounded-2xl flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-5 pt-4 shrink-0">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[17px] font-bold text-white">은행/증권사 선택</h3>
                    <button
                      type="button"
                      onClick={() => setShowBankModal(false)}
                      className="bg-transparent border-none text-neutral-500 text-2xl cursor-pointer p-0"
                    >
                      &times;
                    </button>
                  </div>
                  <div className="flex border-b border-neutral-800">
                    {(['bank', 'stock'] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setBankTab(tab)}
                        className={`flex-1 py-2.5 bg-transparent border-none text-sm font-semibold cursor-pointer ${
                          bankTab === tab
                            ? 'text-primary-light border-b-2 border-primary-light'
                            : 'text-neutral-500 border-b-2 border-transparent'
                        }`}
                      >
                        {tab === 'bank' ? '은행' : '증권사'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="overflow-y-auto px-5 pt-2 pb-5">
                  <div className="grid grid-cols-3 gap-2">
                    {currentList.map((b) => (
                      <button
                        key={b.code}
                        type="button"
                        onClick={() => handleSelectBank(b.code)}
                        className={`py-3 px-1 border-none rounded-lg text-[13px] cursor-pointer text-center whitespace-nowrap overflow-hidden text-ellipsis ${
                          bank === b.code
                            ? 'bg-primary-light text-background font-bold'
                            : 'bg-neutral-800 text-neutral-200 font-normal'
                        }`}
                      >
                        {b.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mb-4">
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => {
                setAccountNumber(e.target.value.replace(/\D/g, ''));
                setError('');
              }}
              placeholder="계좌번호"
              className={inputClass}
              maxLength={20}
            />
          </div>

          {error && <p className="text-accent-light text-[13px] pl-1 mb-2">{error}</p>}
        </>
      )}

      <div className="flex justify-between sticky bottom-0 pt-6 pb-6">
        <Button variant="outline" onClick={onPrev} className="w-30!">
          이전
        </Button>
        <Button onClick={handleNext} className="w-30!">
          다음
        </Button>
      </div>
    </>
  );
}
