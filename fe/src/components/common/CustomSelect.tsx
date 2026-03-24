import { useEffect, useRef, useState } from 'react';

import CustomSelectDescriptionPanel from './Select/CustomSelectDescriptionPanel';
import CustomSelectOptionList from './Select/CustomSelectOptionList';
import CustomSelectTrigger from './Select/CustomSelectTrigger';
import type { CustomSelectOption, CustomSelectProps, DescriptionPosition } from '@/types';

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
  const [descriptionPosition, setDescriptionPosition] = useState<DescriptionPosition | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedLabel = options.find((option) => option.value === value)?.label;
  const hoveredOption = options.find((option) => option.value === hoveredOptionValue) ?? null;

  const clearHoverState = () => {
    setHoveredOptionValue(null);
    setDescriptionPosition(null);
  };

  const updateDescriptionPosition = () => {
    const rect = rootRef.current?.getBoundingClientRect();

    if (!rect) {
      return;
    }

    setDescriptionPosition({
      top: rect.bottom + 4,
      left: rect.right + 8,
    });
  };

  const handleToggle = () => {
    if (disabled) {
      return;
    }

    setOpen((prev) => {
      const nextOpen = !prev;

      if (!nextOpen) {
        clearHoverState();
      }

      return nextOpen;
    });
  };

  const handleOptionHover = (option: CustomSelectOption | null) => {
    if (!option) {
      clearHoverState();
      return;
    }

    setHoveredOptionValue(option.value);

    if (descriptionPlacement === 'right' && option.description) {
      updateDescriptionPosition();
    }
  };

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setOpen(false);
    clearHoverState();
  };

  useEffect(() => {
    if (!open || disabled) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
        clearHoverState();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
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
    <div className="relative" ref={rootRef}>
      <CustomSelectTrigger
        open={open}
        disabled={disabled}
        selectedLabel={selectedLabel}
        placeholder={placeholder}
        onToggle={handleToggle}
      />

      {open && !disabled ? (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-[120] overflow-hidden rounded-xl border border-neutral-700 bg-neutral-900 shadow-lg">
          <CustomSelectOptionList
            options={options}
            value={value}
            onOptionHover={handleOptionHover}
            onSelect={handleSelect}
          />
          {hoveredOption?.description ? (
            <CustomSelectDescriptionPanel
              option={hoveredOption}
              placement={descriptionPlacement}
              position={descriptionPosition}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
