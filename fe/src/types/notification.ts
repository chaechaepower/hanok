export type NotificationType =
  | 'STREAM_START'
  | 'ESCROW_STARTED_FOR_BUYER'
  | 'ESCROW_STARTED_FOR_SELLER'
  | 'ESCROW_SHIPPED_FOR_BUYER'
  | 'ESCROW_SHIPPED_FOR_SELLER'
  | 'ESCROW_COMPLETED'
  | 'ESCROW_AUTO_COMPLETED'
  | 'ESCROW_CANCELLED'
  | 'NOTICE_CREATE'
  | string;

export type Notification = {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  actionUrl: string | null;
};

export type NotificationPage = {
  items: Notification[];
  unreadCount: number;
  hasNext: boolean;
  nextCursor: string | null;
};
