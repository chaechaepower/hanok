import { useState } from 'react';

import { useDeleteWithdraw } from '@/api/hooks/useDeleteWithdraw';
import { useGetMe } from '@/api/hooks/useGetMe';
import { useGetNotification } from '@/api/hooks/useGetNotification';
import { usePatchNotification } from '@/api/hooks/usePatchNotification';
import { usePatchPassword } from '@/api/hooks/usePatchPassword';
import { useToast } from '@/hooks/useToast';

import AccountActionModal from './AccountActionModal';
import AccountInfoCard from './AccountInfoCard';
import DangerZoneCard from './DangerZoneCard';
import NotificationSettingsCard from './NotificationSettingsCard';

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

  const isPushEnabled = notiData?.notificationSetting ?? false;

  const handleTogglePush = () => {
    if (!notiData) {
      return;
    }

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
          showToast({ message: '회원 탈퇴가 요청되었습니다.' });
        },
        onError: () => {
          showToast({ message: '탈퇴가 불가능한 서비스입니다. 경매에 참여해주세용!' });
        },
      },
    );
  };

  return (
    <>
      <div className="mb-2 flex flex-col gap-2">
        <h2 className="m-0 text-2xl font-bold text-white">계정 관리</h2>
        <p className="m-0 text-[15px] text-neutral-400">계정과 알림 설정을 관리합니다</p>
      </div>

      <AccountInfoCard email={meData?.email} phone={meData?.phone} onOpenPasswordModal={handleOpenPasswordModal} />
      <NotificationSettingsCard isPushEnabled={isPushEnabled} onTogglePush={handleTogglePush} />
      <DangerZoneCard onOpenWithdrawModal={handleOpenWithdrawModal} />

      <AccountActionModal
        isOpen={isWithdrawModalOpen}
        title="회원 탈퇴 확인"
        description={
          <>
            회원 탈퇴 후에는 계정 복구가 불가능합니다.
            <br />
            비밀번호를 입력하여 본인 확인 후 탈퇴를 진행해 주세요.
          </>
        }
        error={withdrawError}
        confirmLabel="탈퇴 요청"
        isPending={isWithdrawPending}
        onClose={() => setIsWithdrawModalOpen(false)}
        onConfirm={handleSubmitWithdraw}
      >
        <div className="flex flex-col gap-2">
          <label className="text-[14px] font-medium text-neutral-400">비밀번호</label>
          <input
            type="password"
            value={withdrawPassword}
            onChange={(event) => setWithdrawPassword(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && handleSubmitWithdraw()}
            placeholder="현재 비밀번호를 입력하세요"
            className="w-full box-border rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3 text-[15px] text-white outline-none transition-colors focus:border-accent"
          />
        </div>
      </AccountActionModal>

      <AccountActionModal
        isOpen={isPasswordModalOpen}
        title="비밀번호 변경"
        error={passwordError}
        confirmLabel="변경"
        isPending={isPasswordPending}
        onClose={() => setIsPasswordModalOpen(false)}
        onConfirm={handleSubmitPassword}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-400">현재 비밀번호</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              placeholder="현재 비밀번호를 입력하세요"
              className="w-full box-border rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3 text-[15px] text-white outline-none transition-colors focus:border-gold-light"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-400">새 비밀번호</label>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="새 비밀번호를 입력하세요 (8자 이상)"
              className="w-full box-border rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3 text-[15px] text-white outline-none transition-colors focus:border-gold-light"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-400">새 비밀번호 확인</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && handleSubmitPassword()}
              placeholder="새 비밀번호를 다시 입력하세요"
              className="w-full box-border rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3 text-[15px] text-white outline-none transition-colors focus:border-gold-light"
            />
          </div>
        </div>
      </AccountActionModal>
    </>
  );
}
