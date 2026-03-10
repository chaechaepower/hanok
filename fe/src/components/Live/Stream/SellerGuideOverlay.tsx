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
      <div className="pointer-events-auto flex items-center">
        <div className="group relative z-30">
          <div className="pointer-events-none absolute left-1/2 top-0 z-40 -translate-x-1/2 -translate-y-[calc(100%+0.5rem)] whitespace-nowrap rounded-full border border-white/10 bg-[rgba(10,10,16,0.92)] px-3 py-1 text-[11px] font-medium text-[#f3e7ca] opacity-0 shadow-[0_10px_24px_rgba(0,0,0,0.24)] transition duration-200 group-hover:opacity-100">
            판매가이드
          </div>

          <button
            type="button"
            onClick={() => setIsOpen((current) => !current)}
            className={`flex items-center justify-center border border-white/12 bg-[linear-gradient(180deg,rgba(20,18,26,0.88),rgba(11,11,16,0.78))] text-[#e9dcc2] backdrop-blur-xl transition hover:border-[#ccb78a]/45 hover:text-white ${
              isOpen
                ? 'h-15 w-7 rounded-l-[18px] rounded-r-[10px] border-r-0 shadow-[0_10px_20px_rgba(0,0,0,0.16)]'
                : 'h-18 w-9 rounded-[18px] shadow-[0_12px_28px_rgba(0,0,0,0.28)]'
            }`}
            aria-label={isOpen ? '판매 가이드 닫기' : '판매 가이드 열기'}
          >
            {isOpen ? <FiChevronLeft className="h-4 w-4" /> : <FiChevronRight className="h-5 w-5" />}
          </button>
        </div>

        <div
          className={`relative ${isOpen ? '-ml-px' : '-ml-1'} w-[min(21rem,calc(100vw-4.5rem))] overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(16,15,21,0.8),rgba(12,13,18,0.52))] text-white shadow-[0_24px_60px_rgba(0,0,0,0.34)] backdrop-blur-2xl transition-all duration-300 ${
            isOpen ? 'translate-x-0 opacity-100' : '-translate-x-6 opacity-0'
          }`}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(214,189,138,0.16),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(112,90,56,0.18),transparent_34%)]" />

          <div className="relative p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="mt-2 text-[20px] font-bold tracking-[-0.03em] text-[#f7f0e2]">진행 가이드</h2>
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
                        ? 'border-[#d7c08f]/40 bg-[#d7c08f]/10'
                        : 'border-white/7 bg-white/3 hover:border-white/15 hover:bg-white/5'
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border text-sm font-bold ${
                        isChecked
                          ? 'border-[#d7c08f] bg-[#d7c08f] text-[#11131a]'
                          : 'border-white/16 bg-black/18 text-[#cab78f]'
                      }`}
                    >
                      {isChecked ? <FiCheck className="h-4 w-4" /> : index + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-[13px] font-semibold leading-5 ${isChecked ? 'text-[#fbf5e7]' : 'text-white/88'}`}
                      >
                        {step.title}
                      </p>
                      <p className="mt-1 text-[10px] leading-4.5 text-white/50">{step.description}</p>
                    </div>

                    <div
                      className={`mt-1 h-5 w-5 shrink-0 rounded-md border transition ${
                        isChecked ? 'border-[#d7c08f] bg-[#d7c08f]/22' : 'border-white/15 bg-transparent'
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
