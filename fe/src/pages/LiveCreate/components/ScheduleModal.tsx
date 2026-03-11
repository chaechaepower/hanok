import { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { BsCalendarPlus, BsClock } from 'react-icons/bs';

type Props = {
  onConfirm: (scheduledAt: string) => void;
  onClose: () => void;
};

const toDateString = (d: Date) => d.toISOString().split('T')[0];

const today = new Date();
const maxDate = new Date(today);
maxDate.setDate(maxDate.getDate() + 30);

const formatTime = (time: string): string => {
  if (!time) return '';
  const [hStr, mStr] = time.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const ampm = h < 12 ? '오전' : '오후';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${ampm} ${h}시 ${m.toString().padStart(2, '0')}분`;
};

export default function ScheduleModal({ onConfirm, onClose }: Props) {
  const [date, setDate] = useState(toDateString(today));
  const [time, setTime] = useState('21:30');

  const handleConfirm = () => {
    if (!date || !time) {
      alert('날짜와 시간을 모두 입력해주세요.');
      return;
    }
    const scheduledAt = new Date(`${date}T${time}:00`).toISOString();
    onConfirm(scheduledAt);
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="relative w-full max-w-[500px] bg-[#0f0f13] rounded-2xl p-8 shadow-2xl border border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 text-white/40 hover:text-white transition-colors"
          >
            <FaTimes size={14} />
          </button>

          <h2 className="text-white text-2xl font-bold mb-1">방송 예약 설정</h2>
          <p className="text-[#888] text-sm mb-8">예약은 오늘로부터 최대 1달(30일) 이내로만 가능합니다.</p>

          <div className="flex flex-col gap-2 mb-6">
            <label className="text-white text-sm font-medium">예약 날짜</label>
            <div className="relative">
              <input
                type="date"
                value={date}
                min={toDateString(today)}
                max={toDateString(maxDate)}
                onChange={(e) => setDate(e.target.value)}
                className="w-full appearance-none bg-transparent border border-[#d9b36d] rounded-2xl px-5 py-4 text-white text-base outline-none cursor-pointer pr-14
                  [color-scheme:dark]"
              />
              <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-[#d9b36d] text-lg">
                <BsCalendarPlus />
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 mb-10">
            <label className="text-white text-sm font-medium">예약 시간</label>
            <div className="relative">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white text-base pointer-events-none">
                {formatTime(time)}
              </div>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full appearance-none bg-transparent border border-[#d9b36d] rounded-2xl px-5 py-4 text-transparent text-base outline-none cursor-pointer pr-14
                  [color-scheme:dark]"
              />
              <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-[#d9b36d] text-lg">
                <BsClock />
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl border border-white/20 text-white text-base font-semibold hover:bg-white/10 transition-colors"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 py-4 rounded-2xl bg-[#f0e6c8] text-[#1a1a1a] text-base font-bold hover:bg-[#e8d9b0] transition-colors"
            >
              예약확정
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
