import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetWithdraws } from '@/api/hooks/useGetWithdraws';
import { usePostWithdrawComplete } from '@/api/hooks/usePostWithdrawComplete';
import { clearAdminRouteAuthenticated } from '@/constants/adminAccess';
import { BANKS } from '@/constants/sellerRegister';
import { useToast } from '@/hooks/useToast';
import Logo from '@/assets/Logo.png';
import type { WithdrawStatus, WithdrawItem } from '@/types';
import { formatDateTime } from '@/utils/formatDateTime';

const formatPrice = (price: number) => price.toLocaleString('ko-KR') + '원';

const getBankName = (bankCode: string) => BANKS.find((bank) => bank.code === bankCode)?.name ?? bankCode;

const STATUS_LABEL: Record<WithdrawStatus, string> = {
  PENDING: '대기',
  COMPLETED: '완료',
  REJECTED: '거절',
};

const STATUS_STYLE: Record<WithdrawStatus, string> = {
  PENDING: 'text-yellow-400 bg-yellow-400/10',
  COMPLETED: 'text-green-400 bg-green-400/10',
  REJECTED: 'text-red-400 bg-red-400/10',
};

const tabs: { id: WithdrawStatus | 'ALL'; label: string }[] = [
  { id: 'ALL', label: '전체' },
  { id: 'PENDING', label: '대기' },
  { id: 'COMPLETED', label: '완료' },
  { id: 'REJECTED', label: '거절' },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<WithdrawStatus | 'ALL'>('ALL');
  const [confirmTarget, setConfirmTarget] = useState<WithdrawItem | null>(null);
  const statusFilter = activeTab === 'ALL' ? undefined : activeTab;
  const { data: withdraws = [], isLoading } = useGetWithdraws(statusFilter);
  const { mutate: completeWithdraw, isPending } = usePostWithdrawComplete();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleLogout = () => {
    clearAdminRouteAuthenticated();
    navigate('/admin', { replace: true });
  };

  const handleComplete = () => {
    if (!confirmTarget) return;
    completeWithdraw(confirmTarget.id, {
      onSuccess: () => {
        showToast({ message: '출금 완료 처리되었습니다.' });
        setConfirmTarget(null);
      },
      onError: () => {
        showToast({ message: '출금 완료 처리에 실패했습니다.' });
        setConfirmTarget(null);
      },
    });
  };

  return (
    <div className="min-h-screen bg-background text-white">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between h-16 px-6 border-b border-neutral-800 bg-surface">
        <img
          src={Logo}
          alt="Logo"
          className="h-10 w-auto object-contain brightness-0 invert sepia saturate-50 hue-rotate-[350deg]"
        />
        <button
          onClick={handleLogout}
          className="bg-transparent border border-neutral-700 text-neutral-300 text-sm px-4 py-1.5 rounded-lg cursor-pointer hover:bg-white/5 hover:text-white transition-colors"
        >
          로그아웃
        </button>
      </header>

      <div className="w-350 mx-auto py-10 px-4">
        <div className="mb-8">
          <h2 className="text-[24px] font-semibold text-warm leading-tight m-0 mb-2">관리자 페이지</h2>
          <p className="text-body-md text-neutral-500 m-0">출금 요청을 관리합니다</p>
        </div>

        <div className="bg-surface-elevated rounded-2xl border border-neutral-800 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-neutral-800 pt-4 px-6">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`bg-transparent border-none px-6 py-3 text-sm cursor-pointer relative ${
                    isActive ? 'text-neutral-100 font-bold' : 'text-neutral-500 font-normal'
                  }`}
                >
                  {tab.label}
                  {isActive && <div className="absolute -bottom-px left-0 right-0 h-0.5 bg-neutral-100" />}
                </button>
              );
            })}
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-[80px_100px_1.4fr_140px_110px_160px_140px] gap-4 px-6 py-3 border-b border-neutral-800 text-neutral-500 text-xs font-semibold">
            <span>ID</span>
            <span>회원 ID</span>
            <span>계좌 정보</span>
            <span>금액</span>
            <span>상태</span>
            <span>요청일시</span>
            <span />
          </div>

          {/* List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin w-8 h-8 border-2 border-gold-light border-t-transparent rounded-full" />
            </div>
          ) : withdraws.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-neutral-500 text-sm">출금 요청이 없습니다</div>
          ) : (
            <div className="flex flex-col">
              {withdraws.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[80px_100px_1.4fr_140px_110px_160px_140px] gap-4 px-6 py-4 border-b border-neutral-800/50 items-center hover:bg-white/[0.02] transition-colors"
                >
                  <span className="text-neutral-400 text-sm">{item.id}</span>
                  <span className="text-white text-sm">{item.userId}</span>
                  <div className="flex flex-col">
                    <span className="text-neutral-300 text-sm">{item.accountName}</span>
                    <span className="text-neutral-500 text-xs">
                      {getBankName(item.bankCode)} {item.accountNum}
                    </span>
                  </div>
                  <span className="text-white font-semibold text-sm">{formatPrice(item.amount)}</span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full w-fit ${STATUS_STYLE[item.status]}`}>
                    {STATUS_LABEL[item.status]}
                  </span>
                  <span className="text-neutral-500 text-xs">{formatDateTime(item.requestedAt)}</span>
                  <div>
                    {item.status === 'PENDING' ? (
                      <button
                        onClick={() => setConfirmTarget(item)}
                        disabled={isPending}
                        className="btn-primary-outline rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        승인
                      </button>
                    ) : item.processedAt ? (
                      <span className="text-neutral-600 text-xs">{formatDateTime(item.processedAt)}</span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirm Modal */}
      {confirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-surface-elevated border border-neutral-800 rounded-2xl p-6 w-full max-w-[400px] mx-4">
            <h3 className="text-lg font-semibold text-warm m-0 mb-3">출금 완료 처리</h3>
            <p className="text-sm text-neutral-300 m-0 mb-1">
              회원 ID <span className="text-white font-semibold">{confirmTarget.userId}</span>의 출금 요청을 완료
              처리하시겠습니까?
            </p>
            <p className="text-sm text-neutral-400 m-0 mb-6">
              예금주: <span className="text-white font-semibold">{confirmTarget.accountName}</span>
            </p>
            <p className="text-sm text-neutral-400 m-0 mb-6">
              금액: <span className="text-gold-light font-semibold">{formatPrice(confirmTarget.amount)}</span>
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmTarget(null)}
                className="bg-transparent border border-neutral-700 text-neutral-300 text-sm px-5 py-2 rounded-lg cursor-pointer hover:bg-white/5 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleComplete}
                disabled={isPending}
                className="btn-primary-outline text-sm px-5 py-2 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? '처리 중...' : '확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
