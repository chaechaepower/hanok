import { useState } from 'react';
import { FiCheck, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

type SellerGuideOverlayProps = {
  defaultOpen?: boolean;
};

const guideSteps = [
  {
    title: '실시간 오디오 상태 체크',
    description: '마이크 음량과 잡음을 먼저 확인해주세요.',
  },
  {
    title: '전면과 후면 보여주기',
    description: '전체 상태가 자연스럽게 보이도록 비춰주세요.',
  },
  {
    title: '360도 회전 시연',
    description: '사각지대 없이 한 바퀴 돌려가며 보여주세요.',
  },
  {
    title: '작동 상태 보여주기',
    description: '전원, 버튼, 연결 등 실제 동작을 담아주세요.',
  },
  {
    title: '비교 물건과 크기 안내',
    description: '크기를 가늠할 수 있는 물건과 비교해주세요.',
  },
  {
    title: '세부 사항 클로즈업',
    description: '질감, 스크래치, 모서리 상태를 보여주세요.',
  },
] as const;

export default function SellerGuideOverlay({ defaultOpen = true }: SellerGuideOverlayProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [checkedSteps, setCheckedSteps] = useState<boolean[]>(() => guideSteps.map(() => false));

  const toggleStep = (index: number) => {
    setCheckedSteps((current) => current.map((value, currentIndex) => (currentIndex === index ? !value : value)));
  };

  return (
    <div className="pointer-events-none absolute left-4 top-[43%] z-20 -translate-y-1/2">
      <div className="pointer-events-auto flex items-center gap-1.5">
        <div className="group relative z-30">
          <div className="pointer-events-none absolute left-full top-1/2 z-40 ml-2 -translate-y-1/2 whitespace-nowrap rounded-full border border-neutral-700 bg-surface/92 px-3 py-1 text-[11px] font-medium text-neutral-300 opacity-0 shadow-[0_10px_24px_rgba(0,0,0,0.24)] transition duration-200 group-hover:opacity-100">
            판매가이드
          </div>

          <button
            type="button"
            onClick={() => setIsOpen((current) => !current)}
            className={`flex items-center justify-center rounded-[14px] border border-neutral-700 bg-surface/85 text-neutral-400 backdrop-blur-xl transition hover:border-gold-muted/45 hover:text-neutral-200 ${
              isOpen
                ? 'h-12 w-6 shadow-[0_10px_20px_rgba(0,0,0,0.16)]'
                : 'h-14 w-7 shadow-[0_12px_28px_rgba(0,0,0,0.28)]'
            }`}
            aria-label={isOpen ? '판매 가이드 닫기' : '판매 가이드 열기'}
          >
            {isOpen ? <FiChevronLeft className="h-3.5 w-3.5" /> : <FiChevronRight className="h-4 w-4" />}
          </button>
        </div>

        <div
          className={`relative w-[min(21rem,calc(100vw-4.5rem))] overflow-hidden rounded-[28px] border border-neutral-700 bg-surface/85 text-neutral-200 shadow-[0_24px_60px_rgba(0,0,0,0.34)] backdrop-blur-2xl transition-all duration-300 ${
            isOpen ? 'translate-x-0 opacity-100' : '-translate-x-6 opacity-0 pointer-events-none'
          }`}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(214,189,138,0.16),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(112,90,56,0.18),transparent_34%)]" />

          <div className="relative p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="mt-2 text-[20px] font-bold tracking-[-0.03em] text-neutral-100">진행 가이드</h2>
              </div>
            </div>

            <div className="mt-4 space-y-2.5">
              {guideSteps.map((step, index) => {
                const isChecked = checkedSteps[index];

                return (
                  <button
                    key={step.title}
                    type="button"
                    onClick={() => toggleStep(index)}
                    className={`flex w-full items-start gap-3 rounded-[18px] border px-3 py-3 text-left transition ${
                      isChecked
                        ? 'border-gold-light/40 bg-gold-light/10'
                        : 'border-neutral-700/50 bg-warm/3 hover:border-neutral-600 hover:bg-warm/5'
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border text-sm font-bold ${
                        isChecked
                          ? 'border-gold-light bg-gold-light text-background'
                          : 'border-neutral-600 bg-neutral-800 text-gold-light'
                      }`}
                    >
                      {isChecked ? <FiCheck className="h-4 w-4" /> : index + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-[13px] font-semibold leading-5 ${isChecked ? 'text-neutral-100' : 'text-neutral-300'}`}
                      >
                        {step.title}
                      </p>
                      <p className="mt-1 text-[10px] leading-4.5 text-neutral-500">{step.description}</p>
                    </div>

                    <div
                      className={`mt-1 h-5 w-5 shrink-0 rounded-md border transition ${
                        isChecked ? 'border-gold-light bg-gold-light/22' : 'border-neutral-600 bg-transparent'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
