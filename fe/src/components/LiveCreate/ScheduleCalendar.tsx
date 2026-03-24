import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

import { SCHEDULE_DAY_LABELS, getCalendarDays, isSameDay } from '@/utils/schedule';

type Props = {
  selectedDate: Date;
  today: Date;
  maxDate: Date;
  viewYear: number;
  viewMonth: number;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSelectDate: (date: Date) => void;
};

export default function ScheduleCalendar({
  selectedDate,
  today,
  maxDate,
  viewYear,
  viewMonth,
  canPrev,
  canNext,
  onPrev,
  onNext,
  onSelectDate,
}: Props) {
  const calendarDays = getCalendarDays(viewYear, viewMonth);
  const isSelectable = (date: Date) => date >= today && date <= maxDate;

  return (
    <div className="mb-5">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={onPrev}
          disabled={!canPrev}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-warm/10 hover:text-neutral-100 disabled:cursor-not-allowed disabled:opacity-20"
        >
          <FaChevronLeft size={12} />
        </button>
        <span className="text-sm font-semibold text-neutral-100">
          {viewYear}년 {viewMonth + 1}월
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={!canNext}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-warm/10 hover:text-neutral-100 disabled:cursor-not-allowed disabled:opacity-20"
        >
          <FaChevronRight size={12} />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-0.5">
        {SCHEDULE_DAY_LABELS.map((dayLabel) => (
          <div
            key={dayLabel}
            className={`py-1 text-center text-xs font-medium ${
              dayLabel === '일' ? 'text-accent-light' : dayLabel === '토' ? 'text-blue-400' : 'text-neutral-500'
            }`}
          >
            {dayLabel}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {calendarDays.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="h-9" />;
          }

          const selectable = isSelectable(date);
          const isSelected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, today);
          const dayOfWeek = date.getDay();

          return (
            <button
              key={date.toISOString()}
              type="button"
              disabled={!selectable}
              onClick={() => onSelectDate(new Date(date))}
              className={`h-9 rounded-lg text-sm font-medium transition-all
                ${!selectable ? 'cursor-not-allowed text-neutral-700' : 'cursor-pointer hover:bg-warm/10'}
                ${isSelected ? 'bg-gold font-bold text-background hover:bg-gold-dark' : ''}
                ${!isSelected && isToday ? 'ring-1 ring-gold/50 text-gold-light' : ''}
                ${!isSelected && !isToday && selectable && dayOfWeek === 0 ? 'text-accent-light' : ''}
                ${!isSelected && !isToday && selectable && dayOfWeek === 6 ? 'text-blue-400' : ''}
                ${!isSelected && !isToday && selectable && dayOfWeek !== 0 && dayOfWeek !== 6 ? 'text-neutral-200' : ''}
              `}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
