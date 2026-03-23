import { motion } from 'framer-motion';
import { STEPS } from '../../constants/sellerRegister';

export default function StepIndicator({ current }: { current: number }) {
  const progress = ((current - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="mb-8">
      {/* 스텝 라벨 — 한 줄 가로 배치 */}
      <div className="flex items-center mb-4">
        {STEPS.map((step, idx) => (
          <div key={step.id} className="flex items-center">
            {/* 번호 + 라벨 */}
            <div className="flex items-center gap-2">
              <div className="relative shrink-0">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors duration-300 ${
                    step.id === current
                      ? 'bg-ember text-white'
                      : step.id < current
                        ? 'bg-ember-dark text-neutral-100'
                        : 'bg-neutral-800 text-neutral-600'
                  }`}
                >
                  {step.id < current ? (
                    <svg
                      className="w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.id
                  )}
                </div>

                {step.id === current && (
                  <motion.div
                    className="absolute -inset-1 rounded-full border-2 border-ember/40"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </div>

              <span
                className={`text-base whitespace-nowrap transition-colors duration-300 ${
                  step.id === current
                    ? 'text-neutral-100 font-semibold'
                    : step.id < current
                      ? 'text-ember-light font-medium'
                      : 'text-neutral-600'
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* 구분 화살표 */}
            {idx < STEPS.length - 1 && (
              <svg
                className="w-5 h-5 mx-4 text-neutral-700 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            )}
          </div>
        ))}
      </div>

      {/* 프로그레스 바 */}
      <div className="progress-track">
        <motion.div
          className="progress-bar progress-bar-ember"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        />
      </div>
    </div>
  );
}
