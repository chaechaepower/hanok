import { useState } from 'react';
import { FiX, FiChevronDown } from 'react-icons/fi';
import { CATEGORIES } from './categories';

type Props = {
  onConfirm: (categoryId: string) => void;
  onClose: () => void;
};

export default function CategorySelectModal({ onConfirm, onClose }: Props) {
  const [selectedId, setSelectedId] = useState<string>(CATEGORIES[0]?.id ?? '');

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="relative w-full max-w-[480px] bg-[#0f0f13] rounded-2xl p-8 shadow-2xl border border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 text-white/50 hover:text-white transition-colors flex items-center justify-center"
          >
            <FiX size={24} />
          </button>

          <h2 className="text-2xl font-bold text-white mb-2">방송 카테고리 설정</h2>
          <p className="text-[#888] text-sm mb-8">
            방송의 카테고리를 설정해주세요. 카테고리에 일치하는 물품만 등록 가능합니다
          </p>

          <div className="flex flex-col gap-2 mb-10">
            <label className="text-white text-sm font-medium">카테고리</label>
            <div className="relative">
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full appearance-none bg-transparent border border-[#d9b36d] rounded-xl px-5 py-4 text-white text-base outline-none cursor-pointer pr-12"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-[#1a1a1a] text-white">
                    {cat.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#d9b36d]">
                <FiChevronDown size={20} />
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl border border-white/20 text-white text-base font-semibold hover:bg-white/10 transition-colors"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => onConfirm(selectedId)}
              className="flex-1 py-4 rounded-2xl bg-[#f0e6c8] text-[#1a1a1a] text-base font-bold hover:bg-[#e8d9b0] transition-colors"
            >
              방송 등록하기
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
