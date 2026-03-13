import type { Product } from '@/types';
import { FaTimes, FaBox } from 'react-icons/fa';

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
        <div className="relative w-full max-w-[420px] bg-[#0f0f13] rounded-3xl overflow-hidden shadow-2xl flex flex-col"
          style={{ maxHeight: '85vh' }}
        >
          <div className="flex items-center justify-between px-6 pt-6 pb-4">
            <h2 className="text-white text-xl font-bold">내 인벤토리</h2>
            <div className="flex items-center gap-4">
              <span className="text-white/60 text-sm">카테고리 : {categoryLabel}</span>
              <button
                type="button"
                onClick={onClose}
                className="text-white/60 hover:text-white transition-colors"
              >
                <FaTimes size={16} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-3">
            {isLoading ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-4 border-[#333] border-t-[#d9b36d] rounded-full animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <p className="text-center text-[#888] py-16">해당 카테고리의 물품이 없습니다.</p>
            ) : (
              items.map((item) => {
                const selected = isSelected(item);
                return (
                  <button
                    key={item.itemId}
                    type="button"
                    onClick={() => onToggle(item)}
                    className={`flex items-center gap-4 w-full text-left p-4 rounded-2xl border transition-all ${
                      selected
                        ? 'border-[#d9b36d]/60 bg-[#d9b36d]/10'
                        : 'border-white/10 bg-[#1a1a1a] hover:border-white/25'
                    }`}
                  >
                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-[#222]">
                      {item.image1 ? (
                        <img
                          src={item.image1}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/20 text-2xl">
                          <FaBox />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-base truncate">{item.name}</p>
                      <p className="text-white/50 text-sm truncate mt-0.5">{item.description}</p>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                        selected
                          ? 'bg-[#d9b36d] border-[#d9b36d]'
                          : 'border-white/30 bg-transparent'
                      }`}
                    >
                      {selected && (
                        <svg className="w-3.5 h-3.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="px-4 py-4 border-t border-white/10">
            <button
              type="button"
              onClick={onConfirm}
              className="w-full py-4 rounded-2xl bg-[#f0e6c8] text-[#1a1a1a] text-base font-bold hover:bg-[#e8d9b0] transition-colors"
            >
              선택완료
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
