import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

type Props = {
  hour: number;
  minute: number;
  onHourChange: (hour: number) => void;
  onMinuteChange: (minute: number) => void;
  onIncrementHour: () => void;
  onDecrementHour: () => void;
  onIncrementMinute: () => void;
  onDecrementMinute: () => void;
  onToggleAmPm: (toAm: boolean) => void;
};

export default function ScheduleTimePicker({
  hour,
  minute,
  onHourChange,
  onMinuteChange,
  onIncrementHour,
  onDecrementHour,
  onIncrementMinute,
  onDecrementMinute,
  onToggleAmPm,
}: Props) {
  const isAm = hour < 12;
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

  return (
    <div className="mb-6">
      <label className="mb-3 block text-sm font-medium text-neutral-100">시간 선택</label>

      <div className="flex items-center justify-center gap-4">
        <div className="flex flex-col gap-1.5">
          {(['오전', '오후'] as const).map((label) => {
            const targetAm = label === '오전';
            const active = targetAm === isAm;

            return (
              <button
                key={label}
                type="button"
                onClick={() => onToggleAmPm(targetAm)}
                className={`rounded-xl px-5 py-2 text-sm font-semibold transition-all ${
                  active ? 'bg-gold text-background' : 'bg-surface text-neutral-500 hover:bg-warm/10 hover:text-neutral-100'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={onIncrementHour}
            className="flex h-8 w-[72px] items-center justify-center rounded-lg bg-surface text-neutral-500 transition-colors hover:bg-warm/10 hover:text-neutral-100"
          >
            <FaChevronUp size={12} />
          </button>
          <input
            type="text"
            inputMode="numeric"
            value={displayHour}
            onChange={(event) => {
              const value = event.target.value.replace(/\D/g, '');
              if (value === '') return;

              let nextHour = Math.min(12, Math.max(1, Number(value)));
              if (nextHour === 12) nextHour = 0;
              onHourChange(isAm ? nextHour : nextHour + 12);
            }}
            onBlur={(event) => {
              const value = Number(event.target.value);
              if (Number.isNaN(value) || value < 1 || value > 12) {
                onHourChange(isAm ? 0 : 12);
              }
            }}
            className="h-[56px] w-[72px] rounded-xl border border-gold/30 bg-surface text-center text-2xl font-bold text-gold-light outline-none transition-colors focus:border-gold"
          />
          <button
            type="button"
            onClick={onDecrementHour}
            className="flex h-8 w-[72px] items-center justify-center rounded-lg bg-surface text-neutral-500 transition-colors hover:bg-warm/10 hover:text-neutral-100"
          >
            <FaChevronDown size={12} />
          </button>
        </div>

        <span className="text-2xl font-bold text-neutral-400">:</span>

        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={onIncrementMinute}
            className="flex h-8 w-[72px] items-center justify-center rounded-lg bg-surface text-neutral-500 transition-colors hover:bg-warm/10 hover:text-neutral-100"
          >
            <FaChevronUp size={12} />
          </button>
          <input
            type="text"
            inputMode="numeric"
            value={String(minute).padStart(2, '0')}
            onChange={(event) => {
              const value = event.target.value.replace(/\D/g, '');
              if (value === '') return;
              onMinuteChange(Math.min(59, Math.max(0, Number(value))));
            }}
            onBlur={(event) => {
              const value = Number(event.target.value);
              if (Number.isNaN(value) || value < 0 || value > 59) {
                onMinuteChange(0);
              }
            }}
            className="h-[56px] w-[72px] rounded-xl border border-gold/30 bg-surface text-center text-2xl font-bold text-gold-light outline-none transition-colors focus:border-gold"
          />
          <button
            type="button"
            onClick={onDecrementMinute}
            className="flex h-8 w-[72px] items-center justify-center rounded-lg bg-surface text-neutral-500 transition-colors hover:bg-warm/10 hover:text-neutral-100"
          >
            <FaChevronDown size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
