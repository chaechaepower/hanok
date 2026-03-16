import { useState } from 'react';
import { FaCreditCard } from 'react-icons/fa';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/common/Toast';
import { useGetAccount } from '@/api/hooks/useGetAccount';
import { usePostUserAccount } from '@/api/hooks/usePostUserAccount';
import { BANKS } from '@/pages/SellerOnboarding/constants';

const BANK_LIST = BANKS.filter((b) => Number(b.code) < 200);
const STOCK_LIST = BANKS.filter((b) => Number(b.code) >= 200);

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
  const [bankTab, setBankTab] = useState<'bank' | 'stock'>('bank');
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-10 h-10 border-4 border-[#333] border-t-[#d9b36d] rounded-full animate-spin" />
      </div>
    );
  }

  const hasAccount = accountData && accountData.bankName && accountData.accountNum;

  return (
    <div className="w-full box-border">
      <div className="mb-10 mt-2">
        <h2 className="text-[22px] font-bold text-white mb-3">결제수단 관리</h2>
        <p className="text-[#888] text-[15px]">카드 및 계좌를 간편하게 관리하세요.</p>
      </div>

      <div className="border border-[#2e2e40] rounded-xl p-8 mb-12 flex items-center justify-between bg-transparent">
        <div className="flex items-center gap-6">
          <div className="flex items-center justify-center">
            <FaCreditCard size={32} className="text-[#ccc]" />
          </div>
          {hasAccount ? (
            <div className="flex flex-col gap-2">
              <span className="text-white text-[17px] font-bold">{accountData.bankName}</span>
              <span className="text-[#aaa] text-[15px]">{accountData.accountNum}</span>
              <span className="text-[#aaa] text-[15px]">{accountData.accountName}</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <span className="text-white text-[17px] font-bold">등록된 계좌가 없습니다</span>
              <span className="text-[#aaa] text-[15px]">계좌를 등록해 주세요</span>
            </div>
          )}
        </div>
        <button
          className="px-6 py-2 bg-white text-black text-[14px] font-semibold rounded-full hover:bg-gray-200 transition-colors"
          onClick={() => setShowForm((prev) => !prev)}
        >
          {hasAccount ? '계좌 변경' : '계좌 등록'}
        </button>
      </div>

      {showForm && (
        <div id="account-registration-form">
          <h3 className="text-[17px] font-bold text-white mb-5">계좌 정보 입력</h3>
          <form onSubmit={handleSubmit} className="flex gap-4 items-center">
            <button
              type="button"
              onClick={() => setShowBankModal(true)}
              className="w-[180px] h-[52px] bg-transparent border border-[#2e2e40] rounded-lg px-4 text-left outline-none cursor-pointer flex items-center justify-between hover:border-[#d9b36d] transition-colors"
            >
              <span className={form.bankCode ? 'text-white' : 'text-[#aaa]'}>
                {form.bankCode ? form.bankName : '은행 선택'}
              </span>
              <span className="text-[#555] text-xs">▼</span>
            </button>

            <input
              type="text"
              placeholder="계좌번호 - 없이 숫자만 입력"
              value={form.accountNum}
              onChange={(e) => setForm({ ...form, accountNum: e.target.value.replace(/[^0-9]/g, '') })}
              className="flex-1 h-[52px] bg-transparent border border-[#2e2e40] rounded-lg px-5 text-white placeholder-[#555] outline-none focus:border-[#d9b36d] transition-colors"
            />

            <input
              type="text"
              placeholder="예금주명"
              value={form.accountName}
              onChange={(e) => setForm({ ...form, accountName: e.target.value })}
              className="w-[140px] h-[52px] bg-transparent border border-[#2e2e40] rounded-lg px-5 text-white placeholder-[#555] outline-none focus:border-[#d9b36d] transition-colors"
            />

            <button
              type="submit"
              disabled={!form.bankCode || !form.accountNum || !form.accountName || isPending}
              className="h-[52px] px-8 bg-white text-black font-semibold rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors whitespace-nowrap ml-1"
            >
              {isPending ? '처리 중...' : '등록 하기'}
            </button>
          </form>
        </div>
      )}

      {showBankModal && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={() => setShowBankModal(false)}
        >
          <div
            className="w-full max-w-[430px] max-h-[70vh] bg-[#1C1C1E] rounded-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 pt-4 shrink-0">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[17px] font-bold text-white">은행/증권사 선택</h3>
                <button
                  type="button"
                  onClick={() => setShowBankModal(false)}
                  className="bg-transparent border-none text-[#8E8E93] text-2xl cursor-pointer p-0"
                >
                  &times;
                </button>
              </div>
              <div className="flex border-b border-[#2C2C2E]">
                {(['bank', 'stock'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setBankTab(tab)}
                    className={`flex-1 py-2.5 bg-transparent border-none text-sm font-semibold cursor-pointer ${
                      bankTab === tab
                        ? 'text-[#CEAF82] border-b-2 border-[#CEAF82]'
                        : 'text-[#8E8E93] border-b-2 border-transparent'
                    }`}
                  >
                    {tab === 'bank' ? '은행' : '증권사'}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-y-auto px-5 pt-2 pb-5">
              <div className="grid grid-cols-3 gap-2">
                {(bankTab === 'bank' ? BANK_LIST : STOCK_LIST).map((b) => (
                  <button
                    key={b.code}
                    type="button"
                    onClick={() => {
                      setForm({ ...form, bankCode: b.code, bankName: b.name });
                      setShowBankModal(false);
                    }}
                    className={`py-3 px-1 border-none rounded-lg text-[13px] cursor-pointer text-center whitespace-nowrap overflow-hidden text-ellipsis ${
                      form.bankCode === b.code
                        ? 'bg-[#CEAF82] text-[#0B0C10] font-bold'
                        : 'bg-[#2C2C2E] text-[#E5E5EA] font-normal'
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
    </div>
  );
}
