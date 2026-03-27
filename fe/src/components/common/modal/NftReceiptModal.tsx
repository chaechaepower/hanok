import { useEffect } from 'react';

import NftReceiptDetailContent from '@/components/common/NftReceiptDetailContent';

type NftReceiptModalProps = {
  escrowId: string | number;
  onClose: () => void;
};

export default function NftReceiptModal({ escrowId, onClose }: NftReceiptModalProps) {
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/72 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="NFT 영수증"
        className="max-h-[92vh] w-full max-w-[720px] overflow-y-auto scrollbar-hide"
        onClick={(event) => event.stopPropagation()}
      >
        <NftReceiptDetailContent escrowId={escrowId} onClose={onClose} closeVariant="modal" />
      </div>
    </div>
  );
}
