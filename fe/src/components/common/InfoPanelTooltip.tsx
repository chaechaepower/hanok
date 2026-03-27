import type { ReactNode } from 'react';

type Props = {
  title?: string;
  children: ReactNode;
  className?: string;
  placementClassName?: string;
  widthClassName?: string;
};

export default function InfoPanelTooltip({
  title,
  children,
  className = '',
  placementClassName = 'bottom-full mb-2 left-0',
  widthClassName = 'w-72',
}: Props) {
  return (
    <div
      className={`pointer-events-none absolute ${placementClassName} ${widthClassName} rounded-lg border border-white/10 bg-neutral-900 p-3 text-xs text-neutral-300 opacity-0 invisible shadow-xl transition-all duration-200 z-50 group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible ${className}`.trim()}
    >
      {title ? <p className="mb-1.5 font-semibold text-white">{title}</p> : null}
      {children}
    </div>
  );
}
