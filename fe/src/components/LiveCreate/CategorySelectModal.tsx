import { CATEGORIES } from '@/constants/category';
import { useState, useRef, useEffect } from 'react';
import { FiX, FiChevronDown } from 'react-icons/fi';

type Props = {
  onConfirm: (categoryId: string) => void;
  onClose: () => void;
};

export default function CategorySelectModal({ onConfirm, onClose }: Props) {
  const [selectedId, setSelectedId] = useState<string>(CATEGORIES[0]?.id ?? '');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedLabel = CATEGORIES.find((c) => c.id === selectedId)?.label ?? '';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="relative w-full max-w-[480px] bg-surface-elevated rounded-2xl p-8 shadow-2xl border border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-6 right-6 text-neutral-500 hover:text-neutral-100 transition-colors flex items-center justify-center"
          >
            <FiX size={24} />
          </button>

          <h2 className="text-2xl font-bold text-neutral-100 mb-2">방송 카테고리 설정</h2>
          <p className="text-neutral-500 text-sm whitespace-pre-line">{`방송의 카테고리를 설정해주세요`}</p>
          <p className="text-accent-light text-sm mb-8 whitespace-pre-line">{`카테고리에 일치하는 물품만 등록 가능합니다`}</p>

          <div className="flex flex-col gap-2 mb-8">
            <label className="text-neutral-100 text-sm font-medium">카테고리</label>
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className="w-full flex items-center justify-between bg-transparent border border-gold rounded-xl px-4 py-4 text-neutral-100 text-base outline-none cursor-pointer"
              >
                <span>{selectedLabel}</span>
                <span className={`text-gold transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                  <FiChevronDown size={20} />
                </span>
              </button>

              {isOpen && (
                <div className="absolute z-10 left-0 right-0 top-[calc(100%+8px)] bg-neutral-900 border border-neutral-700 rounded-xl overflow-hidden shadow-lg max-h-[280px] overflow-y-auto custom-scrollbar">
                  {CATEGORIES.map((cat) => {
                    const isSelected = cat.id === selectedId;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setSelectedId(cat.id);
                          setIsOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-[15px] transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-gold/15 text-gold-light font-semibold'
                            : 'text-neutral-300 hover:bg-warm/8 hover:text-neutral-100'
                        }`}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl border border-neutral-700 text-neutral-100 text-base font-semibold hover:bg-warm/10 transition-colors"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => onConfirm(selectedId)}
              className="flex-1 py-4 rounded-2xl bg-gold text-background text-base font-bold hover:bg-gold-dark transition-colors"
            >
              방송 등록하기
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
