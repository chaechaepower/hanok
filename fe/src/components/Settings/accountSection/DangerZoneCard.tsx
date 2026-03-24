import { FiAlertTriangle } from 'react-icons/fi';

type Props = {
  onOpenWithdrawModal: () => void;
};

export default function DangerZoneCard({ onOpenWithdrawModal }: Props) {
  return (
    <div className="flex w-full flex-col gap-6 rounded-2xl bg-surface-elevated p-8">
      <h3 className="m-0 flex items-center gap-3 text-lg font-bold text-white">
        <FiAlertTriangle size={20} className="text-accent" />
        회원 탈퇴
      </h3>

      <div className="mt-2 flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <span className="text-[15px] font-bold text-white">탈퇴 전 주의사항</span>
          <p className="m-0 text-[14px] leading-relaxed text-neutral-400">
            회원 탈퇴 시 모든 경매 이력과 평판 기록은 더 이상 확인할 수 없습니다.
            <br />
            보유한 가상머니가 0원이어야만 탈퇴할 수 있습니다.
            <br />
            진행 중인 경매나 정산 대기금이 있다면 모두 완료한 뒤 다시 시도해 주세요.
          </p>
        </div>
        <button onClick={onOpenWithdrawModal} className="btn btn-accent-outline self-start">
          회원 탈퇴 요청
        </button>
      </div>
    </div>
  );
}
