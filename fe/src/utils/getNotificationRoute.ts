import type { Notification } from '@/types';

const isSellerEscrowNotification = (type: string) => type.endsWith('_FOR_SELLER') || type.endsWith('_FOR_SELELR');
const isBuyerEscrowNotification = (type: string) => type.endsWith('_FOR_BUYER');

export function getNotificationRoute(notification: Notification) {
  const payload = notification.routingPayload;

  if (!payload) {
    return null;
  }

  if (notification.type === 'STREAM_START' && payload.streamId != null) {
    return `/live/${payload.streamId}`;
  }

  if (notification.type === 'NOTICE_CREATE' && payload.sellerId != null && payload.noticeId != null) {
    return `/profile/${payload.sellerId}?noticeId=${payload.noticeId}`;
  }

  if (payload.escrowId != null) {
    if (isSellerEscrowNotification(notification.type)) {
      return `/tracking?escrowId=${payload.escrowId}`;
    }

    if (isBuyerEscrowNotification(notification.type)) {
      return `/settings?tab=order&escrowId=${payload.escrowId}`;
    }
  }

  return null;
}
