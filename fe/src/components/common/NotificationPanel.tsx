import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { useGetNotifications } from '@/api/hooks/useGetNotifications';
import { usePatchNotificationRead } from '@/api/hooks/usePatchNotificationRead';
import { usePatchNotificationReadAll } from '@/api/hooks/usePatchNotificationReadAll';
import NotificationItem from '@/components/common/NotificationItem';
import NoItem from '@/components/common/NoItem';
import type { Notification } from '@/types';
import { getNotificationRoute } from '@/utils/getNotificationRoute';

interface NotificationPanelProps {
  onClose: () => void;
}

export default function NotificationPanel({ onClose }: NotificationPanelProps) {
  const navigate = useNavigate();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetNotifications();
  const { mutate: markAsRead } = usePatchNotificationRead();
  const { mutate: markAllAsRead } = usePatchNotificationReadAll();

  const notifications = data?.pages.flatMap((page) => page.items) ?? [];

  const observer = useRef<IntersectionObserver | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
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

    const route = getNotificationRoute(notification);
    if (route) {
      navigate(route);
    }

    onClose();
  };

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;

      if (!panelRef.current?.contains(target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [onClose]);

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div
        ref={panelRef}
        className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-white/10 bg-background shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <h3 className="text-sm font-bold text-white">알림</h3>
          {notifications.length > 0 && (
            <button
              type="button"
              onClick={() => markAllAsRead(undefined, { onSuccess: () => onClose() })}
              className="text-xs text-neutral-400 transition hover:text-white"
            >
              모두 읽음
            </button>
          )}
        </div>

        <div className="custom-scrollbar max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <NoItem message="알림이 없습니다" className="px-4 py-8" textClassName="text-sm text-neutral-500" />
          ) : (
            notifications.map((notification, index) => (
              <div key={notification.id} ref={index === notifications.length - 1 ? lastItemRef : undefined}>
                <NotificationItem notification={notification} onClick={() => handleClick(notification)} />
              </div>
            ))
          )}
          {isFetchingNextPage && <p className="px-4 py-3 text-center text-xs text-neutral-500">불러오는 중...</p>}
        </div>
      </div>
    </>
  );
}
