import { useState } from 'react';
import Button from '@/components/common/Button';
import { TERMS_CONTENT } from '../../pages/SellerOnboarding/constants';

export default function Step2({ onPrev, onNext }: { onPrev: () => void; onNext: () => void }) {
  const [agreed, setAgreed] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleTerm = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="contain-[inline-size]">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-3">
          경매 판매자 이용약관 동의
        </h2>
        <p className="text-base text-primary-light leading-[1.7] mb-1">
          한옥(한반도 옥션)에서 판매자로 활동하기 위해서는 아래 약관에 동의해야 합니다.
        </p>
        <p className="text-base text-primary-light leading-[1.7]">
          판매자는 플랫폼 내 경매 진행 및 상품 판매에 대한 책임을 지며, 본 약관을 준수해야 합니다.
        </p>
      </div>

      <div className="flex flex-col gap-4 mb-10">
        {TERMS_CONTENT.map((term, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="border border-neutral-800 rounded-xl overflow-hidden"
            >
              <button
                type="button"
                onClick={() => toggleTerm(idx)}
                className="w-full flex items-center justify-between px-6 py-5 bg-transparent border-none cursor-pointer text-white text-lg font-bold font-[inherit]"
              >
                <span>
                  {idx + 1}. {term.title}
                </span>
                <svg
                  className={`w-4 h-4 text-neutral-600 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isOpen && (
                <div className="px-6 pb-5">
                  <p className="text-base text-neutral-300 leading-[1.8]">{term.body}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <label className="flex items-center gap-3 cursor-pointer mb-12">
        <div
          className={`w-6 h-6 min-w-6 rounded border-2 flex items-center justify-center transition-all duration-150 relative ${
            agreed ? 'border-primary-light bg-primary-light' : 'border-neutral-600 bg-transparent'
          }`}
        >
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="appearance-none absolute inset-0 cursor-pointer"
          />
          {agreed && (
            <svg
              className="w-3 h-3 text-black pointer-events-none"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <span className="text-base text-neutral-200">
          판매자 이용약관 및 경매 정책을 모두 확인하고 동의합니다.
        </span>
      </label>

      <div className="flex justify-between sticky bottom-0 pt-8 pb-6 bg-background">
        <Button variant="outline" onClick={onPrev} className="w-32! h-12! rounded-xl! text-base!">
          이전
        </Button>
        <Button onClick={agreed ? onNext : undefined} disabled={!agreed} className="w-32! h-12! rounded-xl! text-base!">
          다음
        </Button>
      </div>
    </div>
  );
}
