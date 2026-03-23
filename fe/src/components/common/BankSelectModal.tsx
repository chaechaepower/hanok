import { useMemo, useState } from 'react';

import { BANKS } from '@/constants/sellerRegister';

type BankSelectModalProps = {
  isOpen: boolean;
  selectedCode?: string;
  onClose: () => void;
  onSelect: (bank: { code: string; name: string }) => void;
  activeTabClassName: string;
  selectedItemClassName: string;
};

const BANK_LIST = BANKS.filter((bank) => Number(bank.code) < 200);
const STOCK_LIST = BANKS.filter((bank) => Number(bank.code) >= 200);

export default function BankSelectModal({
  isOpen,
  selectedCode,
  onClose,
  onSelect,
  activeTabClassName,
  selectedItemClassName,
}: BankSelectModalProps) {
  const [bankTab, setBankTab] = useState<'bank' | 'stock'>('bank');

  const currentList = useMemo(() => (bankTab === 'bank' ? BANK_LIST : STOCK_LIST), [bankTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="flex max-h-[70vh] w-full max-w-[430px] flex-col overflow-hidden rounded-2xl bg-surface-elevated"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="shrink-0 px-5 pt-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[17px] font-bold text-white">은행/증권사 선택</h3>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer border-none bg-transparent p-0 text-2xl text-neutral-500"
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
                className={`flex-1 cursor-pointer border-none border-b-2 bg-transparent py-2.5 text-sm font-semibold ${
                  bankTab === tab ? activeTabClassName : 'border-transparent text-neutral-500'
                }`}
              >
                {tab === 'bank' ? '은행' : '증권사'}
              </button>
            ))}
          </div>
        </div>

        <div className="scrollbar-hide overflow-y-auto px-5 pb-5 pt-2">
          <div className="grid grid-cols-3 gap-2">
            {currentList.map((bank) => (
              <button
                key={bank.code}
                type="button"
                onClick={() => onSelect(bank)}
                className={`overflow-hidden text-ellipsis whitespace-nowrap rounded-lg border-none px-1 py-3 text-center text-[13px] transition-colors ${
                  selectedCode === bank.code
                    ? selectedItemClassName
                    : 'bg-neutral-800 font-normal text-neutral-200 hover:bg-neutral-700 hover:text-white'
                }`}
              >
                {bank.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
