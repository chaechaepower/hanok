import { FaUserAlt } from 'react-icons/fa';
import { FiBell, FiAlertTriangle, FiX } from 'react-icons/fi';
import { useState } from 'react';
import { useGetMe } from '@/api/hooks/useGetMe';
import { useGetNotification } from '@/api/hooks/useGetNotification';
import { usePatchNotification } from '@/api/hooks/usePatchNotification';
import { useDeleteWithdraw } from '@/api/hooks/useDeleteWithdraw';
import { usePatchPassword } from '@/api/hooks/usePatchPassword';
import { useToast } from '@/hooks/useToast';

export default function AccountSection() {
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawPassword, setWithdrawPassword] = useState('');
  const [withdrawError, setWithdrawError] = useState('');

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const { data: meData } = useGetMe();
  const { data: notiData } = useGetNotification();
  const { mutate: patchNotification } = usePatchNotification();
  const { mutate: deleteWithdraw, isPending: isWithdrawPending } = useDeleteWithdraw();
  const { mutate: patchPassword, isPending: isPasswordPending } = usePatchPassword();
  const { showToast } = useToast();

  const user = meData;
  const isPushEnabled = notiData?.notificationSetting ?? false;

  const handleTogglePush = () => {
    if (!notiData) return;
    patchNotification({ notificationSetting: !notiData.notificationSetting });
  };

  const handleOpenPasswordModal = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setIsPasswordModalOpen(true);
  };

  const handleSubmitPassword = () => {
    if (!currentPassword.trim()) {
      setPasswordError('현재 비밀번호를 입력해주세요.');
      return;
    }
    if (!newPassword.trim()) {
      setPasswordError('새 비밀번호를 입력해주세요.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    patchPassword(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setIsPasswordModalOpen(false);
          showToast({ message: '비밀번호가 변경되었습니다.' });
        },
        onError: () => {
          setPasswordError('비밀번호 변경에 실패했습니다. 현재 비밀번호를 확인해주세요.');
        },
      },
    );
  };

  const handleOpenWithdrawModal = () => {
    setWithdrawPassword('');
    setWithdrawError('');
    setIsWithdrawModalOpen(true);
  };

  const handleSubmitWithdraw = () => {
    if (!withdrawPassword.trim()) {
      setWithdrawError('비밀번호를 입력해주세요.');
      return;
    }
    deleteWithdraw(
      { password: withdrawPassword },
      {
        onSuccess: () => {
          setIsWithdrawModalOpen(false);
          showToast({ message: '회원 탈퇴가 신청되었습니다.' });
        },
        onError: () => setWithdrawError('탈퇴 처리 중 오류가 발생했습니다. 다시 시도해주세요.'),
      },
    );
  };

  return (
    <>
      <div className="flex flex-col gap-2 mb-2">
        <h2 className="m-0 text-2xl font-bold text-white">계정 관리</h2>
        <p className="m-0 text-[15px] text-neutral-400">계정을 관리합니다.</p>
      </div>

      <div className="w-full box-border rounded-2xl p-8 bg-surface-elevated flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-3 m-0 text-lg font-bold text-white">
            <FaUserAlt size={18} className="text-neutral-400" />
            계정 관리
          </h3>
          <button onClick={handleOpenPasswordModal} className="btn btn-gold">
            비밀번호 수정
          </button>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-[15px] text-white font-medium">이메일(로그인 ID)</span>
            <span className="text-[15px] text-neutral-400">{user?.email}</span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[15px] text-white font-medium">비밀번호</span>
            <span className="text-[15px] text-neutral-400">********</span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[15px] text-white font-medium">휴대폰 번호</span>
            <span className="text-[15px] text-neutral-400">{user?.phone}</span>
          </div>
        </div>
      </div>

      <div className="w-full box-border rounded-2xl p-8 bg-surface-elevated flex flex-col gap-6">
        <h3 className="flex items-center gap-3 m-0 text-lg font-bold text-white">
          <FiBell size={20} className="text-gold-light" />
          알림 설정
        </h3>
        <div className="flex items-center justify-between mt-2">
          <div className="flex flex-col gap-2">
            <span className="text-[15px] text-white font-bold">팔로우 알림 설정</span>
            <p className="m-0 text-[14px] text-neutral-400">
              팔로우한 판매자의 경매 방송이 시작 시 푸시 알림을 받습니다.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={isPushEnabled} onChange={handleTogglePush} />
            <div className="w-12 h-6 rounded-full peer bg-neutral-700 peer-checked:bg-gold-light transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-6" />
          </label>
        </div>
      </div>

      <div className="w-full box-border rounded-2xl p-8 bg-surface-elevated flex flex-col gap-6">
        <h3 className="flex items-center gap-3 m-0 text-lg font-bold text-white">
          <FiAlertTriangle size={20} className="text-accent" />
          회원 탈퇴
        </h3>
        <div className="flex flex-col gap-6 mt-2">
          <div className="flex flex-col gap-3">
            <span className="text-[15px] text-white font-bold">탈퇴 전 주의사항</span>
            <p className="m-0 text-[14px] text-neutral-400 leading-relaxed">
              회원 탈퇴 시 모든 경매 내역과 평판 기록을 더 이상 플랫폼에서 확인할 수 없게 됩니다.
              <br />
              지갑에 보관된 잔여 가상머니가 0원이어야만 탈퇴 절차를 진행할 수 있습니다. 진행 중인 경매나 정산 대기금이
              있다면 모두 완료된 후 시도해 주세요.
            </p>
          </div>
          <button onClick={handleOpenWithdrawModal} className="btn btn-accent-outline self-start">
            회원 탈퇴 신청
          </button>
        </div>
      </div>

      {isWithdrawModalOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-[999] flex items-center justify-center"
          onClick={() => setIsWithdrawModalOpen(false)}
        >
          <div
            className="bg-background border border-white/5 rounded-2xl w-[460px] p-8 flex flex-col gap-6 shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="m-0 text-white text-xl font-bold flex items-center gap-2">
                <FiAlertTriangle size={20} className="text-accent" />
                회원 탈퇴 확인
              </h2>
              <button
                onClick={() => setIsWithdrawModalOpen(false)}
                className="bg-transparent border-none text-neutral-600 cursor-pointer hover:text-white transition-colors"
              >
                <FiX size={22} />
              </button>
            </div>

            <p className="m-0 text-[14px] text-neutral-400 leading-relaxed bg-accent/10 border border-accent/30 rounded-lg p-4">
              탈퇴 후에는 계정 복구가 불가능합니다.
              <br />
              비밀번호를 입력하여 본인 확인 후 탈퇴를 진행해 주세요.
            </p>

            <div className="flex flex-col gap-2">
              <label className="text-[14px] text-neutral-400 font-medium">비밀번호</label>
              <input
                type="password"
                value={withdrawPassword}
                onChange={(e) => setWithdrawPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmitWithdraw()}
                placeholder="현재 비밀번호를 입력하세요"
                className="w-full box-border bg-white/[0.02] text-white border border-white/5 rounded-lg px-4 py-3 text-[15px] outline-none focus:border-accent transition-colors"
              />
            </div>

            {withdrawError && <p className="m-0 text-[13px] text-accent-light">{withdrawError}</p>}

            <div className="flex justify-end gap-3 mt-2">
              <button onClick={() => setIsWithdrawModalOpen(false)} className="btn btn-primary-outline">
                취소
              </button>
              <button
                onClick={handleSubmitWithdraw}
                disabled={isWithdrawPending}
                className="btn btn-accent disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isWithdrawPending ? '처리 중…' : '탈퇴 신청'}
              </button>
            </div>
          </div>
        </div>
      )}
      {isPasswordModalOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-[999] flex items-center justify-center"
          onClick={() => setIsPasswordModalOpen(false)}
        >
          <div
            className="bg-background border border-white/5 rounded-2xl w-[460px] p-8 flex flex-col gap-6 shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="m-0 text-white text-xl font-bold">비밀번호 수정</h2>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="bg-transparent border-none text-neutral-600 cursor-pointer hover:text-white transition-colors"
              >
                <FiX size={22} />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[14px] text-neutral-400 font-medium">현재 비밀번호</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="현재 비밀번호를 입력하세요"
                className="w-full box-border bg-white/[0.02] text-white border border-white/5 rounded-lg px-4 py-3 text-[15px] outline-none focus:border-gold-light transition-colors"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[14px] text-neutral-400 font-medium">새 비밀번호</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="새 비밀번호를 입력하세요 (8자 이상)"
                className="w-full box-border bg-white/[0.02] text-white border border-white/5 rounded-lg px-4 py-3 text-[15px] outline-none focus:border-gold-light transition-colors"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[14px] text-neutral-400 font-medium">새 비밀번호 확인</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmitPassword()}
                placeholder="새 비밀번호를 다시 입력하세요"
                className="w-full box-border bg-white/[0.02] text-white border border-white/5 rounded-lg px-4 py-3 text-[15px] outline-none focus:border-gold-light transition-colors"
              />
            </div>

            {passwordError && <p className="m-0 text-[13px] text-accent-light">{passwordError}</p>}

            <div className="flex justify-end gap-3 mt-2">
              <button onClick={() => setIsPasswordModalOpen(false)} className="btn btn-primary-outline">
                취소
              </button>
              <button
                onClick={handleSubmitPassword}
                disabled={isPasswordPending}
                className="py-3 px-6 bg-gold-light text-background font-bold border-none rounded-lg cursor-pointer text-sm hover:bg-gold-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isPasswordPending ? '변경 중…' : '변경'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
