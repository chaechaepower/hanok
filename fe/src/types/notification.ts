export type Notification = {
  id: number;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  actionUrl: string;
};

export type NotificationPage = {
  items: Notification[];
  unreadCount: number;
  hasNext: boolean;
  nextCursor: string | null;
};
