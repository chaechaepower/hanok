export type NotificationType =
  | 'STREAM_STARTED'
  | 'STREAM_SCHEDULED'
  | 'AUCTION_WON'
  | 'AUCTION_LOST'
  | 'ESCROW_REQUESTED'
  | 'ESCROW_COMPLETED'
  | 'DELIVERY_REGISTERED'
  | 'DELIVERY_STARTED'
  | 'DELIVERY_COMPLETED'
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
