import { useState } from 'react';
import { FiPackage, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { useGetTracking } from '@/api/hooks/useGetTracking';
import { CARRIERS } from '@/constants/sellerRegister';
import type { PostTrackingInfoPayload } from '@/types';

const CARRIER_CODE_MAP = Object.fromEntries(CARRIERS.map((c) => [c.name, c.code]));

export default function DeliveryTracker({ carrierName, trackingNumber }: PostTrackingInfoPayload) {
  const [isOpen, setIsOpen] = useState(false);
  const carrierCode = CARRIER_CODE_MAP[carrierName] ?? '';
  const { data: tracking, isLoading, error } = useGetTracking(carrierCode, trackingNumber);

  if (!carrierCode) return null;

  const levelLabels = ['인수', '이동중', '배달중', '도착'];

  return (
    <div className="bg-surface rounded-xl border border-neutral-800 mb-4 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-6 py-4 bg-transparent border-none cursor-pointer text-left"
      >
        <div className="flex items-center gap-2 text-gold-light font-bold text-sm">
          <FiPackage size={16} />
          <span>배송 추적</span>
          {tracking?.complete && (
            <span className="ml-2 text-xs font-medium text-ember-light bg-ember/15 px-2 py-0.5 rounded-full">
              배송완료
            </span>
          )}
        </div>
        {isOpen ? (
          <FiChevronUp size={16} className="text-neutral-500" />
        ) : (
          <FiChevronDown size={16} className="text-neutral-500" />
        )}
      </button>

      {isOpen && (
        <div className="px-6 pb-5">
          {isLoading && (
            <div className="flex items-center justify-center py-6">
              <div className="w-6 h-6 border-3 border-neutral-700 border-t-gold-light rounded-full animate-spin" />
            </div>
          )}

          {error && <p className="text-neutral-500 text-sm text-center py-4">{(error as Error).message}</p>}

          {tracking && !isLoading && (
            <>
              <div className="flex items-center gap-1 mb-5">
                {levelLabels.map((label, idx) => {
                  const step = idx + 1;
                  const isActive = tracking.level >= step;
                  const isCurrent = tracking.level === step;
                  return (
                    <div key={label} className="flex-1 flex flex-col items-center gap-1.5">
                      <div
                        className={`w-full h-1 rounded-full transition-colors ${
                          isActive ? 'bg-gold' : 'bg-neutral-700'
                        }`}
                      />
                      <span
                        className={`text-[11px] font-medium ${
                          isCurrent ? 'text-gold-light' : isActive ? 'text-neutral-400' : 'text-neutral-600'
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {tracking.estimate && (
                <p className="text-[13px] text-neutral-400 mb-4">
                  도착 예정: <span className="text-gold-light font-medium">{tracking.estimate}</span>
                </p>
              )}

              {tracking.trackingDetails.length > 0 ? (
                <div className="flex flex-col gap-0">
                  {[...tracking.trackingDetails].reverse().map((detail, idx) => {
                    const isFirst = idx === 0;
                    return (
                      <div key={idx} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${isFirst ? 'bg-gold-light' : 'bg-neutral-600'}`}
                          />
                          {idx < tracking.trackingDetails.length - 1 && (
                            <div className="w-px flex-1 bg-neutral-700 my-1" />
                          )}
                        </div>
                        <div className={`flex-1 pb-4 ${isFirst ? '' : 'opacity-70'}`}>
                          <p
                            className={`m-0 text-[13px] font-medium ${isFirst ? 'text-neutral-100' : 'text-neutral-300'}`}
                          >
                            {detail.kind}
                          </p>
                          <p className="m-0 text-[12px] text-neutral-500 mt-0.5">{detail.where}</p>
                          <p className="m-0 text-[11px] text-neutral-600 mt-0.5">{detail.timeString}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-neutral-500 text-sm text-center py-2">배송 상세 정보가 없습니다.</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
