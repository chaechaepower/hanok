import type { CustomSelectOption, DescriptionPlacement, DescriptionPosition } from '@/types';
import { createPortal } from 'react-dom';

type CustomSelectDescriptionPanelProps = {
  option: CustomSelectOption;
  placement: DescriptionPlacement;
  position: DescriptionPosition | null;
};

export default function CustomSelectDescriptionPanel({
  option,
  placement,
  position,
}: CustomSelectDescriptionPanelProps) {
  const content = (
    <>
      <p className="mb-2 text-sm font-semibold text-gold-light">{option.label}</p>
      <p className="whitespace-pre-line text-[13px] leading-5 text-neutral-300">{option.description}</p>
    </>
  );

  if (placement === 'bottom') {
    return <div className="border-t border-neutral-800 bg-background/80 px-4 py-3">{content}</div>;
  }

  if (!position || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      className="fixed z-[9999] w-62 rounded-xl border border-neutral-800 bg-background/95 px-4 py-2 shadow-lg backdrop-blur-sm"
      style={{ top: position.top, left: position.left }}
    >
      {content}
    </div>,
    document.body,
  );
}
