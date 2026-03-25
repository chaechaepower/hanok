type Props = {
  label: string;
  className?: string;
  placement?: 'bottom' | 'left';
};

export default function HoverTooltip({ label, className = '', placement = 'bottom' }: Props) {
  const placementClassName =
    placement === 'left'
      ? 'right-full top-1/2 mr-2 -translate-y-1/2'
      : 'top-full mt-2';

  return (
    <span
      className={`pointer-events-none absolute z-10 whitespace-nowrap rounded-lg bg-neutral-800 px-2.5 py-1 text-xs text-neutral-200 opacity-0 shadow-lg transition duration-150 group-hover:opacity-100 group-focus-within:opacity-100 ${placementClassName} ${className}`.trim()}
    >
      {label}
    </span>
  );
}
