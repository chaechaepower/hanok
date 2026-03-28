export type NotificationType =
  | 'STREAM_START'
  | 'ESCROW_STARTED_FOR_BUYER'
  | 'ESCROW_STARTED_FOR_SELLER'
  | 'ESCROW_SHIPPED_FOR_BUYER'
  | 'ESCROW_SHIPPED_FOR_SELLER'
  | 'ESCROW_COMPLETED_FOR_BUYER'
  | 'ESCROW_COMPLETED_FOR_SELLER'
  | 'ESCROW_COMPLETED_FOR_SELELR'
  | 'ESCROW_AUTO_COMPLETED_FOR_BUYER'
  | 'ESCROW_AUTO_COMPLETED_FOR_SELLER'
  | 'ESCROW_AUTO_COMPLETED_FOR_SELELR'
  | 'ESCROW_CANCELLED_FOR_BUYER'
  | 'ESCROW_CANCELLED_FOR_SELLER'
  | 'ESCROW_CANCELLED_FOR_SELELR'
  | 'NOTICE_CREATE'
  | string;

export type NotificationRoutingField = {
  streamId?: number;
  escrowId?: number;
  sellerId?: number;
  noticeId?: number;
};

export type Notification = {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  routingField?: NotificationRoutingField | null;
};

export type NotificationPage = {
  items: Notification[];
  unreadCount: number;
  hasNext: boolean;
  nextCursor: string | null;
};
