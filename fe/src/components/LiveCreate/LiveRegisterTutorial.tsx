import { useEffect, useMemo, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';

export type LiveRegisterTutorialStepId = 'inventory' | 'introduce' | 'start';

type TutorialTargetRefs = {
  inventoryTargetRef: RefObject<HTMLElement | null>;
  introduceTargetRef: RefObject<HTMLElement | null>;
  startTargetRef: RefObject<HTMLElement | null>;
};

type TutorialRenderProps = {
  activeStepId: LiveRegisterTutorialStepId | null;
  shouldShowExampleItem: boolean;
  getTargetClassName: (stepId: LiveRegisterTutorialStepId) => string;
  reopenTutorial: () => void;
};

interface Props extends TutorialTargetRefs {
  selectedItemsCount: number;
  children: (props: TutorialRenderProps) => ReactNode;
}

const FOCUS_CLASS_NAME =
  "relative z-[60] before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border-2 before:border-gold-light before:content-[''] shadow-[0_0_0_1px_rgba(234,201,94,0.18),0_18px_50px_rgba(0,0,0,0.45)]";

export default function LiveRegisterTutorial({
  selectedItemsCount,
  inventoryTargetRef,
  introduceTargetRef,
  startTargetRef,
  children,
}: Props) {
  const [isOpen, setIsOpen] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  const [cardStyle, setCardStyle] = useState<CSSProperties>({});

  const steps = useMemo(
    () => [
      {
        id: 'inventory' as LiveRegisterTutorialStepId,
        title: '1단계. 상품 선택',
        description: '경매를 시작할 물품을 선택하세요.\n미선택 시 첫번째 물품부터 시작됩니다.',
        placement: 'right' as const,
        targetRef: inventoryTargetRef,
      },
      {
        id: 'introduce' as LiveRegisterTutorialStepId,
        title: '2단계. 설명 시작',
        description: '시청자에게 상품 소개를 시작합니다.',
        placement: 'top' as const,
        targetRef: introduceTargetRef,
      },
      {
        id: 'start' as LiveRegisterTutorialStepId,
        title: '3단계. 경매 시작',
        description: '실제 입찰을 시작합니다.\n준비 페이지에서는 버튼만 미리 체험합니다.',
        placement: 'top' as const,
        targetRef: startTargetRef,
      },
    ],
    [introduceTargetRef, inventoryTargetRef, startTargetRef],
  );

  const activeStep = isOpen ? steps[stepIndex] : null;
  const activeStepId = activeStep?.id ?? null;
  const shouldShowExampleItem = isOpen && activeStepId === 'inventory' && selectedItemsCount === 0;

  const closeTutorial = () => {
    setIsOpen(false);
  };

  const reopenTutorial = () => {
    setStepIndex(0);
    setIsOpen(true);
  };

  const nextStep = () => {
    setStepIndex((prev) => {
      if (prev >= steps.length - 1) {
        setIsOpen(false);
        return prev;
      }

      return prev + 1;
    });
  };

  const getTargetClassName = (stepId: LiveRegisterTutorialStepId) =>
    isOpen && activeStepId === stepId ? FOCUS_CLASS_NAME : '';

  useEffect(() => {
    if (!activeStep) {
      return;
    }

    const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

    const updateCardPosition = () => {
      const target = activeStep.targetRef.current;
      if (!target) {
        return;
      }

      const rect = target.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        return;
      }

      const isActionStep = activeStep.id === 'introduce' || activeStep.id === 'start';
      const width = Math.min(isActionStep ? 380 : 320, window.innerWidth - 32);
      const height = isActionStep ? 236 : 208;
      const gap = activeStep.id === 'inventory' ? 18 : 14;
      const topOffset = activeStep.id === 'introduce' ? 18 : 0;

      let left = activeStep.placement === 'right' ? rect.right + gap : rect.left + rect.width / 2 - width / 2;
      let top =
        activeStep.placement === 'right'
          ? rect.top + rect.height / 2 - height / 2
          : rect.top - height + topOffset;

      if (activeStep.placement === 'right' && left + width > window.innerWidth - 16) {
        left = rect.left - width - gap;
      }

      if (activeStep.placement === 'top' && top < 16) {
        top = rect.bottom + gap;
      }

      setCardStyle({
        left: clamp(left, 16, Math.max(16, window.innerWidth - width - 16)),
        top: clamp(top, 16, Math.max(16, window.innerHeight - height - 16)),
        width,
      });
    };

    // 타겟이 화면에 보이도록 스크롤 후 위치 계산을 여러 번 시도
    const target = activeStep.targetRef.current;
    if (target) {
      target.scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'nearest' });
    }

    // 즉시 + 지연 업데이트로 위치를 확실히 잡음
    updateCardPosition();
    const timers = [
      setTimeout(updateCardPosition, 50),
      setTimeout(updateCardPosition, 150),
      setTimeout(updateCardPosition, 300),
    ];

    window.addEventListener('resize', updateCardPosition);
    window.addEventListener('scroll', updateCardPosition, true);

    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener('resize', updateCardPosition);
      window.removeEventListener('scroll', updateCardPosition, true);
    };
  }, [activeStep, selectedItemsCount, shouldShowExampleItem]);

  return (
    <>
      {children({
        activeStepId,
        shouldShowExampleItem,
        getTargetClassName,
        reopenTutorial,
      })}

      {activeStep && (
        <>
          <div className="fixed inset-0 z-40 bg-black/72 backdrop-blur-[1px]" />
          <div
            className="fixed z-[70] rounded-3xl border border-gold/20 bg-[#111315] p-5 text-white shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
            style={cardStyle}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-gold-light/70">판매자 튜토리얼</p>
                <h3 className="mt-2 text-xl font-black text-neutral-100">{activeStep.title}</h3>
              </div>
              <button
                type="button"
                onClick={closeTutorial}
                className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-bold text-neutral-400 transition hover:border-white/20 hover:text-white"
              >
                SKIP
              </button>
            </div>

            <p className="text-base leading-7 whitespace-pre-line text-neutral-300">{activeStep.description}</p>

            <div className="mt-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {steps.map((step, index) => (
                  <span
                    key={step.id}
                    className={`h-2.5 rounded-full transition-all ${
                      stepIndex === index ? 'w-6 bg-gold' : 'w-2.5 bg-white/18'
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={nextStep}
                className="rounded-full bg-gold px-4 py-2.5 text-base font-black text-background transition hover:bg-gold-light"
              >
                {stepIndex === steps.length - 1 ? '튜토리얼 닫기' : '다음'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
