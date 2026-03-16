import { useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { useGetNotifications } from '@/api/hooks/useGetNotifications';
import { usePatchNotificationRead } from '@/api/hooks/usePatchNotificationRead';
import { usePatchNotificationReadAll } from '@/api/hooks/usePatchNotificationReadAll';
import type { Notification } from '@/types';

interface NotificationPanelProps {
  onClose: () => void;
}

function formatRelativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

function NotificationItem({
  notification,
  onClick,
}: {
  notification: Notification;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3 transition hover:bg-white/5 ${
        notification.isRead ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start gap-2">
        {!notification.isRead && (
          <span className="mt-1.5 size-2 shrink-0 rounded-full bg-accent" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white truncate">{notification.title}</p>
          <p className="text-xs text-neutral-400 truncate">{notification.body}</p>
          <p className="mt-1 text-xs text-neutral-500">{formatRelativeTime(notification.createdAt)}</p>
        </div>
      </div>
    </button>
  );
}

export default function NotificationPanel({ onClose }: NotificationPanelProps) {
  const navigate = useNavigate();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetNotifications();
  const { mutate: markAsRead } = usePatchNotificationRead();
  const { mutate: markAllAsRead } = usePatchNotificationReadAll();

  const notifications = data?.pages.flatMap((page) => page.items) ?? [];

  const observer = useRef<IntersectionObserver | null>(null);
  const lastItemRef = useCallback(
    (node: HTMLElement | null) => {
      if (isFetchingNextPage) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });
      if (node) observer.current.observe(node);
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage],
  );

  const handleClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
    onClose();
  };

  return (
    <>
      {/* backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* panel */}
      <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-white/10 bg-background shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <h3 className="text-sm font-bold text-white">알림</h3>
          {notifications.length > 0 && (
            <button
              type="button"
              onClick={() => markAllAsRead()}
              className="text-xs text-neutral-400 transition hover:text-white"
            >
              모두 읽음
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-neutral-500">알림이 없습니다</p>
          ) : (
            notifications.map((n, i) => (
              <div key={n.id} ref={i === notifications.length - 1 ? lastItemRef : undefined}>
                <NotificationItem notification={n} onClick={() => handleClick(n)} />
              </div>
            ))
          )}
          {isFetchingNextPage && (
            <p className="px-4 py-3 text-center text-xs text-neutral-500">불러오는 중...</p>
          )}
        </div>
      </div>
    </>
  );
}
