import { FiBell } from 'react-icons/fi';

type Props = {
  isPushEnabled: boolean;
  onTogglePush: () => void;
};

export default function NotificationSettingsCard({ isPushEnabled, onTogglePush }: Props) {
  return (
    <div className="flex w-full flex-col gap-6 rounded-2xl bg-surface-elevated p-8">
      <h3 className="m-0 flex items-center gap-3 text-lg font-bold text-white">
        <FiBell size={20} className="text-gold-light" />
        알림 설정
      </h3>

      <div className="mt-2 flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <span className="text-[15px] font-bold text-white">팔로우 방송 알림 설정</span>
          <p className="m-0 text-[14px] text-neutral-400">
            팔로우한 판매자의 경매 방송이 시작될 때 실시간 알림을 받습니다
          </p>
        </div>
        <label className="relative inline-flex cursor-pointer items-center">
          <input type="checkbox" className="peer sr-only" checked={isPushEnabled} onChange={onTogglePush} />
          <div className="peer h-6 w-12 rounded-full bg-neutral-700 transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-white after:bg-white after:transition-all after:content-[''] peer-checked:bg-gold-light peer-checked:after:translate-x-6" />
        </label>
      </div>
    </div>
  );
}
