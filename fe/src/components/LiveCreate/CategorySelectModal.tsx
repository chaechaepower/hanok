import { CATEGORIES } from '@/constants/category';
import { useState, useRef, useEffect, useMemo } from 'react';import { FiChevronDown } from 'react-icons/fi';
import { getItems } from '@/api/hooks/useGetItems';
import { useQuery } from '@tanstack/react-query';


type Props = {
  onConfirm: (categoryId: string) => void;
  onClose: () => void;
};

export default function CategorySelectModal({ onConfirm, onClose }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: items = [] } = useQuery({
    queryKey: ['items', 'READY'],
    queryFn: () => getItems('READY'),
  });

  const availableCategories = useMemo(() => {
    const categorySet = new Set(items.map((item) => item.category));
    return CATEGORIES.filter((c) => categorySet.has(c.id));
  }, [items]);

  const [selectedId, setSelectedId] = useState<string>('');

  const effectiveSelectedId = selectedId || availableCategories[0]?.id || '';
  const selectedLabel = availableCategories.find((c) => c.id === effectiveSelectedId)?.label ?? '';

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
        <div className="w-full max-w-[480px] rounded-2xl border border-neutral-800 bg-surface-elevated p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-neutral-100 mb-2">방송 카테고리 설정</h2>
          <p className="text-neutral-500 text-sm whitespace-pre-line">{`방송의 카테고리를 설정해주세요`}</p>
          <p className="text-accent-light text-sm mb-8 whitespace-pre-line">{`카테고리에 일치하는 물품만 등록 가능합니다`}</p>

          <div className="flex flex-col gap-2 mb-8">
            <label className="text-neutral-100 text-sm font-medium">카테고리</label>
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => availableCategories.length > 0 && setIsOpen((prev) => !prev)}
                disabled={availableCategories.length === 0}
                className="w-full flex items-center justify-between bg-transparent border border-gold rounded-xl px-4 py-4 text-neutral-100 text-base outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{selectedLabel || (availableCategories.length === 0 ? '등록된 상품이 없습니다' : '선택')}</span>
                <span className={`text-gold transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                  <FiChevronDown size={20} />
                </span>
              </button>

              {isOpen && (
                <div className="absolute z-10 left-0 right-0 top-[calc(100%+8px)] bg-neutral-900 border border-neutral-700 rounded-xl overflow-hidden shadow-lg max-h-[280px] overflow-y-auto custom-scrollbar">
                  {availableCategories.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-neutral-500">등록된 상품이 없습니다.</p>
                  ) : (
                    availableCategories.map((cat) => {
                      const isSelected = cat.id === effectiveSelectedId;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setSelectedId(cat.id);
                            setIsOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 text-[15px] transition-colors cursor-pointer whitespace-nowrap ${
                            isSelected
                              ? 'bg-gold/15 text-gold-light font-semibold'
                              : 'text-neutral-300 hover:bg-warm/8 hover:text-neutral-100'
                          }`}
                        >
                          {cat.label}
                        </button>
                      );
                    })
                  )}
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
              onClick={() => onConfirm(effectiveSelectedId)}
              disabled={!effectiveSelectedId}
              className="flex-1 py-4 rounded-2xl bg-gold text-background text-base font-bold hover:bg-gold-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              방송 등록하기
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
