import { useMemo, useState } from 'react';

import { formatScheduledDateTime } from '@/utils/formatDateTime';
import { formatStreamScheduledAt } from '@/utils/streamDateTime';

import ScheduleCalendar from './ScheduleCalendar';
import ScheduleTimePicker from './ScheduleTimePicker';
import { getDefaultScheduleTime, getScheduleMaxDate, getScheduleToday, mergeDateAndTime } from '@/utils/schedule';

type Props = {
  onConfirm: (scheduledAt: string) => void;
  onClose: () => void;
  initialScheduledAt?: string;
};

export default function ScheduleModal({ onConfirm, onClose, initialScheduledAt }: Props) {
  const today = getScheduleToday();
  const maxDate = getScheduleMaxDate(today);

  const getInitialDateTime = () => {
    if (initialScheduledAt) {
      const d = new Date(initialScheduledAt);
      if (!isNaN(d.getTime())) return { date: d, hour: d.getHours(), minute: d.getMinutes() };
    }
    const defaultTime = getDefaultScheduleTime();
    return { date: new Date(today), hour: defaultTime.hour, minute: defaultTime.minute };
  };

  const initial = getInitialDateTime();
  const [selectedDate, setSelectedDate] = useState(initial.date);
  const [viewYear, setViewYear] = useState(initial.date.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.date.getMonth());
  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(initial.minute);

  const scheduledDate = useMemo(() => mergeDateAndTime(selectedDate, hour, minute), [selectedDate, hour, minute]);
  const isPast = scheduledDate <= new Date();
  const canPrev = viewYear > today.getFullYear() || viewMonth > today.getMonth();
  const canNext = new Date(viewYear, viewMonth + 1, 1) <= maxDate;

  const goPrev = () => {
    if (!canPrev) return;
    if (viewMonth === 0) {
      setViewYear((prev) => prev - 1);
      setViewMonth(11);
      return;
    }

    setViewMonth((prev) => prev - 1);
  };

  const goNext = () => {
    if (!canNext) return;
    if (viewMonth === 11) {
      setViewYear((prev) => prev + 1);
      setViewMonth(0);
      return;
    }

    setViewMonth((prev) => prev + 1);
  };

  const toggleAmPm = (toAm: boolean) => {
    if (toAm && hour >= 12) setHour((prev) => prev - 12);
    if (!toAm && hour < 12) setHour((prev) => prev + 12);
  };

  const handleConfirm = () => {
    if (isPast) return;
    onConfirm(formatStreamScheduledAt(scheduledDate));
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="w-full max-w-[480px] rounded-2xl border border-neutral-800 bg-surface-elevated p-6 shadow-2xl">
          <h2 className="mb-1 text-xl font-bold text-neutral-100">방송 예약 등록</h2>
          <p className="mb-5 text-xs text-neutral-500">현재 시점부터 최대 30일 이내 방송 일정을 설정할 수 있습니다</p>

          <div className="mb-5 rounded-xl bg-surface px-4 py-3 text-center">
            <span className="text-base font-semibold text-gold-light">{formatScheduledDateTime(scheduledDate)}</span>
          </div>

          <ScheduleCalendar
            selectedDate={selectedDate}
            today={today}
            maxDate={maxDate}
            viewYear={viewYear}
            viewMonth={viewMonth}
            canPrev={canPrev}
            canNext={canNext}
            onPrev={goPrev}
            onNext={goNext}
            onSelectDate={setSelectedDate}
          />

          <ScheduleTimePicker
            hour={hour}
            minute={minute}
            onHourChange={setHour}
            onMinuteChange={setMinute}
            onIncrementHour={() => setHour((prev) => (prev + 1) % 24)}
            onDecrementHour={() => setHour((prev) => (prev - 1 + 24) % 24)}
            onIncrementMinute={() => setMinute((prev) => (prev + 1) % 60)}
            onDecrementMinute={() => setMinute((prev) => (prev - 1 + 60) % 60)}
            onToggleAmPm={toggleAmPm}
          />

          {isPast && (
            <p className="mb-2 text-center text-xs text-accent-light">현재 시간 이후로 예약 시간을 선택해주세요</p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-neutral-700 py-3.5 text-sm font-semibold text-neutral-100 transition-colors hover:bg-warm/10"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isPast}
              className={`flex-1 rounded-2xl py-3.5 text-sm font-bold transition-colors ${
                isPast
                  ? 'cursor-not-allowed bg-neutral-700 text-neutral-500'
                  : 'bg-gold text-background hover:bg-gold-dark'
              }`}
            >
              예약하기
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
