import type { ReactNode } from 'react';
import { FaTruck } from 'react-icons/fa';
import { FiX } from 'react-icons/fi';

import DeliveryTracker from '@/components/common/DeliveryTracker';
import type { EscrowDetailResponse } from '@/types';
import { formatDateTime } from '@/utils/formatDateTime';
import { formatPrice } from '@/utils/formatPrice';

type EscrowDetailCardProps = {
  detail: EscrowDetailResponse;
  onClose?: () => void;
  footer?: ReactNode;
  className?: string;
  minHeightClassName?: string;
  showHeaderCloseButton?: boolean;
};

export default function EscrowDetailCard({
  detail,
  onClose,
  footer,
  className = '',
  minHeightClassName = 'min-h-[600px]',
  showHeaderCloseButton = true,
}: EscrowDetailCardProps) {
  return (
    <div
      className={`bg-surface-elevated rounded-3xl border border-neutral-800 p-8 ${minHeightClassName} ${className} flex flex-col`}
    >
      {onClose && showHeaderCloseButton && (
        <div className="mb-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="border-none bg-transparent p-0 text-neutral-500 transition-colors hover:text-neutral-100"
          >
            <FiX size={22} />
          </button>
        </div>
      )}

      <div className="mb-8 flex gap-5">
        <div className="h-[120px] w-[120px] shrink-0 overflow-hidden rounded-2xl bg-neutral-800">
          {detail.winningInfo.image ? (
            <img
              src={detail.winningInfo.image}
              alt={detail.winningInfo.itemName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-neutral-500">이미지 준비중</div>
          )}
        </div>
        <div className="flex flex-1 flex-col justify-center">
          <p className="mb-2 break-keep text-xl leading-[1.3] font-bold text-neutral-100">
            {detail.winningInfo.itemName}
          </p>
          <p className="mb-4 text-[13px] text-neutral-500">{formatDateTime(detail.winningInfo.wonAt)}</p>
          <div className="grid grid-cols-[60px_1fr] gap-[8px_12px] text-sm">
            <span className="text-neutral-400">낙찰가</span>
            <span className="text-right font-medium text-neutral-100">
              {formatPrice(detail.winningInfo.finalPrice)}
            </span>
            <span className="text-neutral-400">판매자</span>
            <span className="text-right text-neutral-100">{detail.winningInfo.sellerName}</span>
          </div>
        </div>
      </div>

      <div className="mb-8 h-px w-[calc(100%+64px)] -mx-8 bg-neutral-700" />

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-base font-bold text-gold-light">
          <FaTruck size={18} />
          <span>배송지 정보</span>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-2 rounded-xl border border-neutral-800 bg-surface p-6 text-sm text-neutral-200">
        <p>{detail.shippingAddress.name}</p>
        <p>{detail.shippingAddress.phone}</p>
        <p>
          [{detail.shippingAddress.postalCode}] {detail.shippingAddress.address} {detail.shippingAddress.addressDetail}
        </p>
      </div>

      {detail.delivery && (
        <>
          <div className="mb-4 flex items-center justify-between rounded-xl border border-neutral-800 bg-surface p-[16px_24px] text-sm text-neutral-200">
            <span className="text-neutral-400">배송 정보</span>
            <span className="font-semibold text-neutral-100">
              {detail.delivery.carrierName} | {detail.delivery.trackingNumber}
            </span>
          </div>
          <DeliveryTracker carrierName={detail.delivery.carrierName} trackingNumber={detail.delivery.trackingNumber} />
        </>
      )}

      {footer ? (
        <>
          <div className="flex-1" />
          {footer}
        </>
      ) : null}
    </div>
  );
}
