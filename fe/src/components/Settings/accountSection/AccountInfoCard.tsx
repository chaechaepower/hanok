import { FaUserAlt } from 'react-icons/fa';

type Props = {
  email?: string;
  phone?: string;
  onOpenPasswordModal: () => void;
};

export default function AccountInfoCard({ email, phone, onOpenPasswordModal }: Props) {
  return (
    <div className="flex w-full flex-col gap-8 rounded-2xl bg-surface-elevated p-8">
      <div className="flex items-center justify-between">
        <h3 className="m-0 flex items-center gap-3 text-lg font-bold text-white">
          <FaUserAlt size={18} className="text-neutral-400" />
          계정 관리
        </h3>
        <button onClick={onOpenPasswordModal} className="btn btn-gold">
          비밀번호 변경
        </button>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-[15px] font-medium text-white">이메일</span>
          <span className="text-[15px] text-neutral-400">{email}</span>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-[15px] font-medium text-white">비밀번호</span>
          <span className="text-[15px] text-neutral-400">********</span>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-[15px] font-medium text-white">휴대폰번호</span>
          <span className="text-[15px] text-neutral-400">{phone}</span>
        </div>
      </div>
    </div>
  );
}
