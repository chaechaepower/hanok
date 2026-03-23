import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export type CustomSelectOption = {
  value: string;
  label: string;
  description?: string;
};

type CustomSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  descriptionPlacement?: 'bottom' | 'right';
};

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = '선택',
  disabled = false,
  descriptionPlacement = 'bottom',
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const [hoveredOptionValue, setHoveredOptionValue] = useState<string | null>(null);
  const [descriptionPosition, setDescriptionPosition] = useState<{ top: number; left: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const selectedLabel = options.find((option) => option.value === value)?.label;
  const hoveredOption = options.find((option) => option.value === hoveredOptionValue) ?? null;
  const updateDescriptionPosition = () => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    setDescriptionPosition({
      top: rect.bottom + 4,
      left: rect.right + 8,
    });
  };

  useEffect(() => {
    if (!open || disabled) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
        setHoveredOptionValue(null);
        setDescriptionPosition(null);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [disabled, open]);

  useEffect(() => {
    if (!open || disabled || descriptionPlacement !== 'right' || !hoveredOption?.description) {
      return;
    }

    window.addEventListener('resize', updateDescriptionPosition);
    window.addEventListener('scroll', updateDescriptionPosition, true);

    return () => {
      window.removeEventListener('resize', updateDescriptionPosition);
      window.removeEventListener('scroll', updateDescriptionPosition, true);
    };
  }, [descriptionPlacement, disabled, hoveredOption?.description, open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          if (!disabled) {
            setOpen((prev) => {
              const nextOpen = !prev;
              if (!nextOpen) {
                setHoveredOptionValue(null);
                setDescriptionPosition(null);
              }
              return nextOpen;
            });
          }
        }}
        disabled={disabled}
        className={`w-full h-12 bg-background border border-neutral-800 rounded-lg text-sm px-4 text-left flex items-center justify-between transition-colors ${
          disabled ? 'cursor-not-allowed opacity-60' : 'hover:border-primary'
        }`}
      >
        <span className={selectedLabel ? 'text-neutral-100' : 'text-neutral-500'}>{selectedLabel || placeholder}</span>
        <span className={`text-gold text-sm transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {open && !disabled ? (
        descriptionPlacement === 'right' ? (
          <>
            <div className="absolute z-[120] left-0 right-0 top-[calc(100%+4px)] bg-neutral-900 border border-neutral-700 rounded-xl overflow-hidden shadow-lg">
              <div className="scrollbar-hide max-h-[240px] overflow-y-auto">
                {options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onMouseEnter={() => {
                      setHoveredOptionValue(option.value);
                      if (descriptionPlacement === 'right' && option.description) {
                        updateDescriptionPosition();
                      }
                    }}
                    onMouseLeave={() => {
                      setHoveredOptionValue((prev) => (prev === option.value ? null : prev));
                      setDescriptionPosition((prev) => (prev ? null : prev));
                    }}
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                      setHoveredOptionValue(null);
                      setDescriptionPosition(null);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-[14px] transition-colors ${
                      value === option.value
                        ? 'bg-gold/15 text-gold-light font-semibold'
                        : 'text-neutral-300 hover:bg-warm/8 hover:text-neutral-100'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {hoveredOption?.description && descriptionPosition && typeof document !== 'undefined'
              ? createPortal(
                  <div
                    className="fixed z-[9999] w-62 rounded-xl border border-neutral-800 bg-background/95 px-4 py-3 shadow-lg backdrop-blur-sm"
                    style={{
                      top: descriptionPosition.top,
                      left: descriptionPosition.left,
                    }}
                  >
                    <p className="mb-2 text-sm font-semibold text-gold-light">{hoveredOption.label}</p>
                    <p className="whitespace-pre-line text-[13px] leading-5 text-neutral-300">
                      {hoveredOption.description}
                    </p>
                  </div>,
                  document.body,
                )
              : null}
          </>
        ) : (
          <div className="absolute z-[120] left-0 right-0 top-[calc(100%+4px)] bg-neutral-900 border border-neutral-700 rounded-xl overflow-hidden shadow-lg">
            <div className="scrollbar-hide max-h-[240px] overflow-y-auto">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onMouseEnter={() => setHoveredOptionValue(option.value)}
                  onMouseLeave={() => setHoveredOptionValue((prev) => (prev === option.value ? null : prev))}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                    setHoveredOptionValue(null);
                    setDescriptionPosition(null);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-[14px] transition-colors ${
                    value === option.value
                      ? 'bg-gold/15 text-gold-light font-semibold'
                      : 'text-neutral-300 hover:bg-warm/8 hover:text-neutral-100'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {hoveredOption?.description ? (
              <div className="border-t border-neutral-800 bg-background/80 px-4 py-3">
                <p className="mb-2 text-sm font-semibold text-gold-light">{hoveredOption.label}</p>
                <p className="whitespace-pre-line text-[13px] leading-5 text-neutral-300">
                  {hoveredOption.description}
                </p>
              </div>
            ) : null}
          </div>
        )
      ) : null}
    </div>
  );
}
