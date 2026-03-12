import { useState } from 'react';
import { FaCreditCard } from 'react-icons/fa';
import { useQueryClient } from '@tanstack/react-query';
import { useGetAccount } from '@/api/hooks/useGetAccount';
import { usePostUserAccount } from '@/api/hooks/usePostUserAccount';

export default function PaymentSection() {
  const queryClient = useQueryClient();
  const { data: accountData, isLoading } = useGetAccount();
  const { mutate: registerAccount, isPending } = usePostUserAccount();

  const [form, setForm] = useState({
    bankCode: '',
    bankName: '',
    accountNum: '',
    accountName: '',
  });

  const BANKS = [
    { code: '088', name: '신한' },
    { code: '035', name: '제주' },
    { code: '004', name: '국민' },
    { code: '003', name: '기업' },
    { code: '011', name: '농협' },
    { code: '002', name: '산업' },
    { code: '007', name: '수협' },
    { code: '048', name: '신협' },
    { code: '020', name: '우리' },
    { code: '081', name: '하나' },
    { code: '027', name: '한국씨티' },
    { code: '090', name: '카카오뱅크' },
    { code: '089', name: '케이뱅크' },
    { code: '092', name: '토스뱅크' },
    { code: '039', name: '경남' },
    { code: '034', name: '광주' },
    { code: '031', name: '대구' },
    { code: '032', name: '부산' },
    { code: '037', name: '전북' },
    { code: '045', name: '새마을' },
    { code: '071', name: '우체국' },
    { code: '050', name: '저축은행' },
    { code: '012', name: '지역농.축협' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.bankCode || !form.accountNum || !form.accountName) return;

    registerAccount(
      { bankCode: form.bankCode, bankName: form.bankName, accountNum: form.accountNum, accountName: form.accountName },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['account'] });
          setForm({ bankCode: '', bankName: '', accountNum: '', accountName: '' });
          alert('계좌가 등록/변경되었습니다.');
        },
        onError: () => {
          alert('계좌 등록/변경에 실패했습니다.');
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

  // Handle case where accountData might not exist or be empty
  const hasAccount = accountData && accountData.bankName && accountData.accountNumber;

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
              <span className="text-[#aaa] text-[15px]">{accountData.accountNumber}</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <span className="text-white text-[17px] font-bold">등록된 계좌가 없습니다</span>
              <span className="text-[#aaa] text-[15px]">계좌를 등록해 주세요</span>
            </div>
          )}
        </div>
        {!hasAccount ? (
          <button
            className="px-6 py-2 bg-white text-black text-[14px] font-semibold rounded-full hover:bg-gray-200 transition-colors"
            onClick={() => {
              const formElement = document.getElementById('account-registration-form');
              if (formElement) {
                formElement.scrollIntoView({ behavior: 'smooth' });
                const inputs = formElement.querySelectorAll('input');
                if (inputs.length > 0) {
                  (inputs[0] as HTMLElement).focus();
                }
              }
            }}
          >
            계좌 등록
          </button>
        ) : (
          <button
            className="px-6 py-2 bg-white text-black text-[14px] font-semibold rounded-full hover:bg-gray-200 transition-colors"
            onClick={() => {
              const formElement = document.getElementById('account-registration-form');
              if (formElement) {
                formElement.scrollIntoView({ behavior: 'smooth' });
                const inputs = formElement.querySelectorAll('input');
                if (inputs.length > 0) {
                  (inputs[0] as HTMLElement).focus();
                }
              }
            }}
          >
            계좌 변경
          </button>
        )}
      </div>

      <div id="account-registration-form">
        <h3 className="text-[17px] font-bold text-white mb-5">계좌 정보 입력</h3>
        <form onSubmit={handleSubmit} className="flex gap-4 items-center">
          <div className="relative">
            <select
              value={form.bankCode}
              onChange={(e) => {
                const selected = BANKS.find((b) => b.code === e.target.value);
                setForm({ ...form, bankCode: e.target.value, bankName: selected?.name ?? '' });
              }}
              className="w-[180px] h-[52px] bg-transparent border border-[#2e2e40] rounded-lg px-4 text-[#aaa] outline-none focus:border-[#d9b36d] transition-colors appearance-none cursor-pointer"
            >
              <option value="" disabled>
                은행 선택
              </option>
              {BANKS.map((bank) => (
                <option key={bank.code} value={bank.code}>
                  {bank.name}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#555] text-xs">▼</div>
          </div>

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
    </div>
  );
}
