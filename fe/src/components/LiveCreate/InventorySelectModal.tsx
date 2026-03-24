import type { Product } from '@/types';
import { FaBox } from 'react-icons/fa';
import NoItem from '@/components/common/NoItem';

type Props = {
  categoryLabel: string;
  items: Product[];
  isLoading: boolean;
  selectedItems: Product[];
  onToggle: (item: Product) => void;
  onConfirm: () => void;
  onClose: () => void;
};

export default function InventorySelectModal({
  categoryLabel,
  items,
  isLoading,
  selectedItems,
  onToggle,
  onConfirm,
  onClose,
}: Props) {
  const isSelected = (item: Product) => selectedItems.some((s) => s.itemId === item.itemId);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="w-full max-w-[420px] max-h-[85vh] overflow-hidden rounded-3xl border border-neutral-800 bg-surface-elevated shadow-2xl flex flex-col">
          <div className="flex items-center justify-between px-6 pt-6 pb-4">
            <h2 className="text-neutral-100 text-xl font-bold">내 인벤토리</h2>
            <div className="flex items-center gap-4">
              <span className="text-neutral-500 text-sm">카테고리 : {categoryLabel}</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-3">
            {isLoading ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-4 border-neutral-700 border-t-gold rounded-full animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <NoItem message="해당 카테고리의 물품이 없습니다" />
            ) : (
              items.map((item) => {
                const selected = isSelected(item);
                return (
                  <button
                    key={item.itemId}
                    type="button"
                    onClick={() => onToggle(item)}
                    className={`flex items-center gap-4 w-full text-left p-4 rounded-2xl border transition-all ${
                      selected ? 'border-gold/60 bg-gold/10' : 'border-neutral-800 bg-surface hover:border-neutral-600'
                    }`}
                  >
                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-neutral-800">
                      {item.images && item.images.length > 0 ? (
                        <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-600 text-2xl">
                          <FaBox />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-neutral-100 font-semibold text-base truncate">{item.name}</p>
                      <p className="text-neutral-500 text-sm truncate mt-0.5">{item.description}</p>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                        selected ? 'bg-gold border-gold' : 'border-neutral-600 bg-transparent'
                      }`}
                    >
                      {selected && (
                        <svg
                          className="w-3.5 h-3.5 text-background"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="border-t border-neutral-800 px-4 py-4">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-2xl border border-neutral-700 py-4 text-base font-semibold text-neutral-100 transition-colors hover:bg-warm/10"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="w-full rounded-2xl bg-gold py-4 text-base font-bold text-background transition-colors hover:bg-gold-dark"
              >
                선택
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
