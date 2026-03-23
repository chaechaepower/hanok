import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { FaCreditCard } from 'react-icons/fa';

import { useGetAccount } from '@/api/hooks/useGetAccount';
import { usePostUserAccount } from '@/api/hooks/usePostUserAccount';
import BankSelectModal from '@/components/common/BankSelectModal';
import { useToast } from '@/hooks/useToast';

export default function PaymentSection() {
  const queryClient = useQueryClient();
  const { data: accountData, isLoading } = useGetAccount();
  const { mutate: registerAccount, isPending } = usePostUserAccount();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    bankCode: '',
    bankName: '',
    accountNum: '',
    accountName: '',
  });
  const [showBankModal, setShowBankModal] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.bankCode || !form.accountNum || !form.accountName) return;

    registerAccount(
      { bankCode: form.bankCode, accountNum: form.accountNum, accountName: form.accountName },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['account'] });
          setForm({ bankCode: '', bankName: '', accountNum: '', accountName: '' });
          setShowForm(false);
          showToast({ message: '계좌가 등록/변경되었습니다.' });
        },
        onError: () => {
          showToast({ message: '계좌 등록/변경에 실패했습니다.' });
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-neutral-700 border-t-gold-light" />
      </div>
    );
  }

  const hasAccount = accountData && accountData.bankName && accountData.accountNum;

  return (
    <div className="box-border w-full">
      <div className="mb-10 mt-2">
        <h2 className="mb-3 text-[22px] font-bold text-white">결제수단 관리</h2>
        <p className="text-[15px] text-neutral-600">카드 및 계좌를 간편하게 관리하세요.</p>
      </div>

      <div className="mb-12 flex items-center justify-between rounded-xl bg-surface-elevated p-8">
        <div className="flex items-center gap-6">
          <div className="flex items-center justify-center">
            <FaCreditCard size={32} className="text-neutral-300" />
          </div>
          {hasAccount ? (
            <div className="flex flex-col gap-2">
              <span className="text-[17px] font-bold text-white">{accountData.bankName}</span>
              <span className="text-[15px] text-neutral-400">{accountData.accountNum}</span>
              <span className="text-[15px] text-neutral-400">{accountData.accountName}</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <span className="text-[17px] font-bold text-white">등록된 계좌가 없습니다</span>
              <span className="text-[15px] text-neutral-400">계좌를 등록해 주세요</span>
            </div>
          )}
        </div>
        <button className="btn btn-gold" onClick={() => setShowForm((prev) => !prev)}>
          {hasAccount ? '계좌 변경' : '계좌 등록'}
        </button>
      </div>

      {showForm && (
        <div id="account-registration-form">
          <h3 className="mb-5 text-[17px] font-bold text-white">계좌 정보 입력</h3>
          <form onSubmit={handleSubmit} className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setShowBankModal(true)}
              className="flex h-[52px] w-[180px] cursor-pointer items-center justify-between rounded-lg border border-white/5 bg-transparent px-4 text-left outline-none transition-colors hover:border-gold-light"
            >
              <span className={form.bankCode ? 'text-white' : 'text-neutral-400'}>
                {form.bankCode ? form.bankName : '은행 선택'}
              </span>
              <span className="text-xs text-neutral-500">▼</span>
            </button>

            <input
              type="text"
              placeholder="계좌번호 - 없이 숫자만 입력"
              value={form.accountNum}
              onChange={(event) => setForm({ ...form, accountNum: event.target.value.replace(/[^0-9]/g, '') })}
              className="h-[52px] flex-1 rounded-lg border border-white/5 bg-transparent px-5 text-white outline-none transition-colors placeholder:text-neutral-500 focus:border-gold-light"
            />

            <input
              type="text"
              placeholder="예금주명"
              value={form.accountName}
              onChange={(event) => setForm({ ...form, accountName: event.target.value })}
              className="h-[52px] w-[140px] rounded-lg border border-white/5 bg-transparent px-5 text-white outline-none transition-colors placeholder:text-neutral-500 focus:border-gold-light"
            />

            <button
              type="submit"
              disabled={!form.bankCode || !form.accountNum || !form.accountName || isPending}
              className="ml-1 h-[52px] whitespace-nowrap rounded-full bg-neutral-100 px-8 font-semibold text-background transition-colors hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? '처리 중...' : '등록 하기'}
            </button>
          </form>
        </div>
      )}

      <BankSelectModal
        isOpen={showBankModal}
        selectedCode={form.bankCode}
        onClose={() => setShowBankModal(false)}
        onSelect={(selectedBank) => {
          setForm({ ...form, bankCode: selectedBank.code, bankName: selectedBank.name });
          setShowBankModal(false);
        }}
        activeTabClassName="border-gold-light text-gold-light"
        selectedItemClassName="bg-gold-light font-bold text-background"
      />
    </div>
  );
}
