import type { Notification } from '@/types';

const isSellerEscrowNotification = (type: string) => type.endsWith('_FOR_SELLER') || type.endsWith('_FOR_SELELR');
const isBuyerEscrowNotification = (type: string) => type.endsWith('_FOR_BUYER');

export function getNotificationRoute(notification: Notification) {
  const routingField = notification.routingField;

  if (!routingField) {
    return null;
  }

  if (notification.type === 'STREAM_START' && routingField.streamId != null) {
    return `/live/${routingField.streamId}`;
  }

  if (notification.type === 'NOTICE_CREATE' && routingField.sellerId != null && routingField.noticeId != null) {
    return `/profile/${routingField.sellerId}?noticeId=${routingField.noticeId}`;
  }

  if (routingField.escrowId != null) {
    if (isSellerEscrowNotification(notification.type)) {
      return `/tracking?escrowId=${routingField.escrowId}`;
    }

    if (isBuyerEscrowNotification(notification.type)) {
      return `/settings?tab=order&escrowId=${routingField.escrowId}`;
    }
  }

  return null;
}
