import { STEPS } from '../../pages/SellerOnboarding/constants';

export default function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((step, idx) => (
        <div key={step.id} className="flex items-center">
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                step.id === current
                  ? 'bg-gold text-background'
                  : step.id < current
                    ? 'bg-[#CEAF8299] text-background'
                    : 'bg-[#2C2C2E] text-[#636366]'
              }`}
            >
              {step.id < current ? (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                step.id
              )}
            </div>
            <span
              className={`text-sm whitespace-nowrap ${
                step.id === current
                  ? 'text-white font-semibold'
                  : step.id < current
                    ? 'text-point font-semibold'
                    : 'text-[#636366]'
              }`}
            >
              {step.label}
            </span>
          </div>
          {idx < STEPS.length - 1 && (
            <svg
              className="w-5 h-5 mx-3 text-[#3A3A3C] shrink-0"
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
  );
}
