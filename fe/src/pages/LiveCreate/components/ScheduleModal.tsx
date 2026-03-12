import { useState } from 'react';
import { FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

type Props = {
  onConfirm: (scheduledAt: string) => void;
  onClose: () => void;
};

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

const today = new Date();
today.setHours(0, 0, 0, 0);

const maxDate = new Date(today);
maxDate.setDate(maxDate.getDate() + 30);

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
  const [hour, setHour] = useState(21);
  const [minute, setMinute] = useState(0);

  const calendarDays = getCalendarDays(viewYear, viewMonth);

  const canPrev = viewYear > today.getFullYear() || viewMonth > today.getMonth();
  const canNext = new Date(viewYear, viewMonth + 1, 1) <= maxDate;

  const goPrev = () => {
    if (!canPrev) return;
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11); }
    else setViewMonth(viewMonth - 1);
  };

  const goNext = () => {
    if (!canNext) return;
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0); }
    else setViewMonth(viewMonth + 1);
  };

  const isSelectable = (d: Date) => d >= today && d <= maxDate;

  const handleConfirm = () => {
    const scheduled = new Date(selectedDate);
    scheduled.setHours(hour, minute, 0, 0);
    onConfirm(scheduled.toISOString());
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="relative w-full max-w-[480px] bg-[#0f0f13] rounded-2xl p-6 shadow-2xl border border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
          >
            <FaTimes size={14} />
          </button>

          <h2 className="text-white text-xl font-bold mb-1">방송 예약 설정</h2>
          <p className="text-[#888] text-xs mb-5">오늘로부터 최대 30일 이내로 예약할 수 있습니다.</p>

          <div className="bg-[#1a1a20] rounded-xl px-4 py-3 mb-5 text-center">
            <span className="text-[#d9b36d] font-semibold text-base">
              {formatDisplay(selectedDate, hour, minute)}
            </span>
          </div>

          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={goPrev}
                disabled={!canPrev}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              >
                <FaChevronLeft size={12} />
              </button>
              <span className="text-white font-semibold text-sm">
                {viewYear}년 {viewMonth + 1}월
              </span>
              <button
                type="button"
                onClick={goNext}
                disabled={!canNext}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              >
                <FaChevronRight size={12} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {DAYS.map((d) => (
                <div
                  key={d}
                  className={`text-center text-xs font-medium py-1 ${d === '일' ? 'text-red-400' : d === '토' ? 'text-blue-400' : 'text-white/40'}`}
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
                      ${!selectable ? 'text-white/15 cursor-not-allowed' : 'hover:bg-white/10 cursor-pointer'}
                      ${isSelected ? 'bg-[#d9b36d] text-[#0f0f13] hover:bg-[#c9a35d] font-bold' : ''}
                      ${!isSelected && isToday ? 'ring-1 ring-[#d9b36d]/50 text-[#d9b36d]' : ''}
                      ${!isSelected && !isToday && selectable && dayOfWeek === 0 ? 'text-red-400' : ''}
                      ${!isSelected && !isToday && selectable && dayOfWeek === 6 ? 'text-blue-400' : ''}
                      ${!isSelected && !isToday && selectable && dayOfWeek !== 0 && dayOfWeek !== 6 ? 'text-white/80' : ''}
                    `}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-6">
            <label className="text-white text-sm font-medium mb-3 block">시간 선택</label>
            <div className="flex gap-2">
              <div className="flex flex-col gap-1">
                {(['오전', '오후'] as const).map((label) => {
                  const isAm = label === '오전';
                  const isActive = isAm ? hour < 12 : hour >= 12;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => {
                        if (isAm && hour >= 12) setHour(hour - 12);
                        if (!isAm && hour < 12) setHour(hour + 12);
                      }}
                      className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all
                        ${isActive
                          ? 'bg-[#d9b36d] text-[#0f0f13]'
                          : 'bg-[#1a1a20] text-white/40 hover:text-white hover:bg-white/10'
                        }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <div className="flex-1 bg-[#1a1a20] rounded-xl p-2">
                <div className="text-white/40 text-[10px] mb-1 text-center">시</div>
                <div className="grid grid-cols-4 gap-1">
                  {Array.from({ length: 12 }, (_, i) => {
                    const displayH = i + 1;
                    const h24 = displayH === 12 ? (hour < 12 ? 0 : 12) : (hour < 12 ? displayH : displayH + 12);
                    const actualH = h24;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setHour(actualH)}
                        className={`py-1.5 rounded-lg text-xs font-medium transition-all
                          ${hour === actualH
                            ? 'bg-[#d9b36d] text-[#0f0f13] font-bold'
                            : 'text-white/60 hover:bg-white/10 hover:text-white'
                          }`}
                      >
                        {displayH}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="w-[80px] bg-[#1a1a20] rounded-xl p-2">
                <div className="text-white/40 text-[10px] mb-1 text-center">분</div>
                <div className="grid grid-cols-2 gap-1">
                  {[0, 10, 20, 30, 40, 50].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMinute(m)}
                      className={`py-1.5 rounded-lg text-xs font-medium transition-all
                        ${minute === m
                          ? 'bg-[#d9b36d] text-[#0f0f13] font-bold'
                          : 'text-white/60 hover:bg-white/10 hover:text-white'
                        }`}
                    >
                      {m.toString().padStart(2, '0')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 rounded-2xl border border-white/20 text-white text-sm font-semibold hover:bg-white/10 transition-colors"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 py-3.5 rounded-2xl bg-[#f0e6c8] text-[#1a1a1a] text-sm font-bold hover:bg-[#e8d9b0] transition-colors"
            >
              예약확정
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
