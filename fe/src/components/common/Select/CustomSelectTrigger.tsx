type CustomSelectTriggerProps = {
  open: boolean;
  disabled: boolean;
  selectedLabel?: string;
  placeholder: string;
  onToggle: () => void;
};

export default function CustomSelectTrigger({
  open,
  disabled,
  selectedLabel,
  placeholder,
  onToggle,
}: CustomSelectTriggerProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`flex h-10 w-full items-center justify-between rounded-lg border border-neutral-800 bg-background px-4 text-left text-sm transition-colors ${
        disabled ? 'cursor-not-allowed opacity-60' : 'hover:border-primary'
      }`}
    >
      <span className={`truncate ${selectedLabel ? 'text-neutral-100' : 'text-neutral-500'}`}>{selectedLabel || placeholder}</span>
      <span className={`text-sm text-gold transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
    </button>
  );
}
