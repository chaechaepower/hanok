import type { ReactNode } from 'react';
import { FaTruck } from 'react-icons/fa';
import { FiX } from 'react-icons/fi';

import type { EscrowDetailResponse } from '@/types';
import DeliveryTracker from '@/components/common/DeliveryTracker';

type EscrowDetailCardProps = {
  detail: EscrowDetailResponse['data'];
  onClose?: () => void;
  footer?: ReactNode;
  className?: string;
  counterpartyLabel?: string;
  minHeightClassName?: string;
};

const formatPrice = (price: number) => `${price.toLocaleString('ko-KR')}원`;
const formatDate = (dateStr: string) =>
  dateStr.replace(/T/, ' ').replace(/:\d{2}(\.\d+)?Z?$/, '').replace(/Z$/, '');

export default function EscrowDetailCard({
  detail,
  onClose,
  footer,
  className = '',
  counterpartyLabel = '판매자',
  minHeightClassName = 'min-h-[600px]',
}: EscrowDetailCardProps) {
  return (
    <div
      className={`bg-surface-elevated rounded-3xl p-8 border border-neutral-800 flex flex-col ${minHeightClassName} ${className}`}
    >
      {onClose && (
        <div className="flex justify-end mb-2">
          <button
            type="button"
            onClick={onClose}
            className="bg-transparent border-none text-neutral-500 cursor-pointer hover:text-neutral-100 transition-colors p-0"
          >
            <FiX size={22} />
          </button>
        </div>
      )}

      <div className="flex gap-5 mb-8">
        <div className="w-[120px] h-[120px] bg-neutral-800 rounded-2xl overflow-hidden shrink-0">
          {detail.winningInfo.imageUrl ? (
            <img
              src={detail.winningInfo.imageUrl}
              alt={detail.winningInfo.itemName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-500 text-sm">
              이미지 준비중
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center flex-1">
          <p className="text-xl font-bold mb-2 break-keep leading-[1.3] text-neutral-100">{detail.winningInfo.itemName}</p>
          <p className="text-neutral-500 text-[13px] mb-4">{formatDate(detail.winningInfo.wonAt)}</p>
          <div className="grid grid-cols-[60px_1fr] gap-[8px_12px] text-sm">
            <span className="text-neutral-400">낙찰가</span>
            <span className="text-right font-medium text-neutral-100">{formatPrice(detail.winningInfo.finalPrice)}</span>
            <span className="text-neutral-400">{counterpartyLabel}</span>
            <span className="text-right text-neutral-100">
              {detail.winningInfo.sellerName}({detail.winningInfo.sellerId})
            </span>
          </div>
        </div>
      </div>

      <div className="h-px bg-neutral-700 -mx-8 mb-8 w-[calc(100%+64px)]" />

      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2 text-gold-light font-bold text-base">
          <FaTruck size={18} />
          <span>배송지 정보</span>
        </div>
      </div>

      <div className="bg-surface rounded-xl p-6 border border-neutral-800 mb-4 text-sm text-neutral-200 flex flex-col gap-2">
        <p>{detail.shippingAddress.name}</p>
        <p>{detail.shippingAddress.phone}</p>
        <p>
          [{detail.shippingAddress.postalCode}] {detail.shippingAddress.address} {detail.shippingAddress.addressDetail}
        </p>
      </div>

      {detail.delivery && (
        <>
          <div className="bg-surface rounded-xl p-[16px_24px] border border-neutral-800 mb-4 text-sm text-neutral-200 flex justify-between items-center">
            <span className="text-neutral-400">택배 정보</span>
            <span className="font-semibold text-neutral-100">
              {detail.delivery.courierName} | {detail.delivery.trackingNumber}
            </span>
          </div>
          <DeliveryTracker courierName={detail.delivery.courierName} trackingNumber={detail.delivery.trackingNumber} />
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
