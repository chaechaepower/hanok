import { formatStreamScheduledAt } from '@/utils/streamDateTime';
import { useState } from 'react';
import { FaTimes, FaChevronLeft, FaChevronRight, FaChevronUp, FaChevronDown } from 'react-icons/fa';

type Props = {
  onConfirm: (scheduledAt: string) => void;
  onClose: () => void;
};

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

const today = new Date();
today.setHours(0, 0, 0, 0);

const maxDate = new Date(today);
maxDate.setDate(maxDate.getDate() + 30);

const defaultTime = (() => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 10);
  return { hour: now.getHours(), minute: now.getMinutes() };
})();

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const getCalendarDays = (year: number, month: number) => {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days: (Date | null)[] = [];

  for (let i = 0; i < first.getDay(); i++) days.push(null);
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
  while (days.length % 7 !== 0) days.push(null);

  return days;
};

const formatDisplay = (date: Date, hour: number, minute: number) => {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const day = DAYS[date.getDay()];
  const ampm = hour < 12 ? '오전' : '오후';
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${m}월 ${d}일 (${day}) ${ampm} ${h12}:${minute.toString().padStart(2, '0')}`;
};

export default function ScheduleModal({ onConfirm, onClose }: Props) {
  const [selectedDate, setSelectedDate] = useState(new Date(today));
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [hour, setHour] = useState(defaultTime.hour);
  const [minute, setMinute] = useState(defaultTime.minute);

  const calendarDays = getCalendarDays(viewYear, viewMonth);

  const canPrev = viewYear > today.getFullYear() || viewMonth > today.getMonth();
  const canNext = new Date(viewYear, viewMonth + 1, 1) <= maxDate;

  const goPrev = () => {
    if (!canPrev) return;
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else setViewMonth(viewMonth - 1);
  };

  const goNext = () => {
    if (!canNext) return;
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else setViewMonth(viewMonth + 1);
  };

  const isSelectable = (d: Date) => d >= today && d <= maxDate;

  const getScheduled = () => {
    const d = new Date(selectedDate);
    d.setHours(hour, minute, 0, 0);
    return d;
  };

  const isPast = getScheduled() <= new Date();

  const handleConfirm = () => {
    if (isPast) return;
    onConfirm(formatStreamScheduledAt(getScheduled()));
  };

  const isAm = hour < 12;
  const displayH = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

  const incHour = () => setHour((h) => (h + 1) % 24);
  const decHour = () => setHour((h) => (h - 1 + 24) % 24);
  const incMinute = () => setMinute((m) => (m + 1) % 60);
  const decMinute = () => setMinute((m) => (m - 1 + 60) % 60);

  const toggleAmPm = (toAm: boolean) => {
    if (toAm && hour >= 12) setHour(hour - 12);
    if (!toAm && hour < 12) setHour(hour + 12);
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="relative w-full max-w-[480px] bg-surface-elevated rounded-2xl p-6 shadow-2xl border border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-neutral-500 hover:text-neutral-100 transition-colors"
          >
            <FaTimes size={14} />
          </button>

          <h2 className="text-neutral-100 text-xl font-bold mb-1">방송 예약 설정</h2>
          <p className="text-neutral-500 text-xs mb-5">오늘로부터 최대 30일 이내로 예약할 수 있습니다</p>

          <div className="bg-surface rounded-xl px-4 py-3 mb-5 text-center">
            <span className="text-gold-light font-semibold text-base">{formatDisplay(selectedDate, hour, minute)}</span>
          </div>

          {/* ── Calendar ── */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={goPrev}
                disabled={!canPrev}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-500 hover:text-neutral-100 hover:bg-warm/10 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              >
                <FaChevronLeft size={12} />
              </button>
              <span className="text-neutral-100 font-semibold text-sm">
                {viewYear}년 {viewMonth + 1}월
              </span>
              <button
                type="button"
                onClick={goNext}
                disabled={!canNext}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-500 hover:text-neutral-100 hover:bg-warm/10 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              >
                <FaChevronRight size={12} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {DAYS.map((d) => (
                <div
                  key={d}
                  className={`text-center text-xs font-medium py-1 ${d === '일' ? 'text-accent-light' : d === '토' ? 'text-blue-400' : 'text-neutral-500'}`}
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5">
              {calendarDays.map((d, i) => {
                if (!d) return <div key={`empty-${i}`} className="h-9" />;

                const selectable = isSelectable(d);
                const isSelected = isSameDay(d, selectedDate);
                const isToday = isSameDay(d, today);
                const dayOfWeek = d.getDay();

                return (
                  <button
                    key={d.toISOString()}
                    type="button"
                    disabled={!selectable}
                    onClick={() => setSelectedDate(new Date(d))}
                    className={`h-9 rounded-lg text-sm font-medium transition-all
                      ${!selectable ? 'text-neutral-700 cursor-not-allowed' : 'hover:bg-warm/10 cursor-pointer'}
                      ${isSelected ? 'bg-gold text-background hover:bg-gold-dark font-bold' : ''}
                      ${!isSelected && isToday ? 'ring-1 ring-gold/50 text-gold-light' : ''}
                      ${!isSelected && !isToday && selectable && dayOfWeek === 0 ? 'text-accent-light' : ''}
                      ${!isSelected && !isToday && selectable && dayOfWeek === 6 ? 'text-blue-400' : ''}
                      ${!isSelected && !isToday && selectable && dayOfWeek !== 0 && dayOfWeek !== 6 ? 'text-neutral-200' : ''}
                    `}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Time Picker (Stepper) ── */}
          <div className="mb-6">
            <label className="text-neutral-100 text-sm font-medium mb-3 block">시간 선택</label>

            <div className="flex items-center justify-center gap-4">
              {/* AM / PM */}
              <div className="flex flex-col gap-1.5">
                {(['오전', '오후'] as const).map((label) => {
                  const targetAm = label === '오전';
                  const active = targetAm === isAm;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => toggleAmPm(targetAm)}
                      className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all
                        ${active ? 'bg-gold text-background' : 'bg-surface text-neutral-500 hover:text-neutral-100 hover:bg-warm/10'}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Hour stepper */}
              <div className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={incHour}
                  className="w-[72px] h-8 flex items-center justify-center rounded-lg bg-surface text-neutral-500 hover:text-neutral-100 hover:bg-warm/10 transition-colors"
                >
                  <FaChevronUp size={12} />
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  value={displayH}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '');
                    if (v === '') return;
                    let n = Math.min(12, Math.max(1, Number(v)));
                    if (n === 12) n = 0;
                    setHour(isAm ? n : n + 12);
                  }}
                  onBlur={(e) => {
                    const v = Number(e.target.value);
                    if (isNaN(v) || v < 1 || v > 12) {
                      setHour(isAm ? 0 : 12);
                    }
                  }}
                  className="w-[72px] h-[56px] rounded-xl bg-surface border border-gold/30 text-gold-light text-2xl font-bold text-center outline-none focus:border-gold transition-colors"
                />
                <button
                  type="button"
                  onClick={decHour}
                  className="w-[72px] h-8 flex items-center justify-center rounded-lg bg-surface text-neutral-500 hover:text-neutral-100 hover:bg-warm/10 transition-colors"
                >
                  <FaChevronDown size={12} />
                </button>
              </div>

              {/* Colon */}
              <span className="text-neutral-400 text-2xl font-bold">:</span>

              {/* Minute stepper */}
              <div className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={incMinute}
                  className="w-[72px] h-8 flex items-center justify-center rounded-lg bg-surface text-neutral-500 hover:text-neutral-100 hover:bg-warm/10 transition-colors"
                >
                  <FaChevronUp size={12} />
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  value={minute.toString().padStart(2, '0')}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '');
                    if (v === '') return;
                    const n = Math.min(59, Math.max(0, Number(v)));
                    setMinute(n);
                  }}
                  onBlur={(e) => {
                    const v = Number(e.target.value);
                    if (isNaN(v) || v < 0 || v > 59) setMinute(0);
                  }}
                  className="w-[72px] h-[56px] rounded-xl bg-surface border border-gold/30 text-gold-light text-2xl font-bold text-center outline-none focus:border-gold transition-colors"
                />
                <button
                  type="button"
                  onClick={decMinute}
                  className="w-[72px] h-8 flex items-center justify-center rounded-lg bg-surface text-neutral-500 hover:text-neutral-100 hover:bg-warm/10 transition-colors"
                >
                  <FaChevronDown size={12} />
                </button>
              </div>
            </div>
          </div>

          {isPast && <p className="text-accent-light text-xs text-center mb-2">현재 시간 이후로 선택해 주세요.</p>}

          {/* ── Actions ── */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 rounded-2xl border border-neutral-700 text-neutral-100 text-sm font-semibold hover:bg-warm/10 transition-colors"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isPast}
              className={`flex-1 py-3.5 rounded-2xl text-sm font-bold transition-colors
                ${isPast ? 'bg-neutral-700 text-neutral-500 cursor-not-allowed' : 'bg-gold text-background hover:bg-gold-dark'}`}
            >
              예약확정
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
