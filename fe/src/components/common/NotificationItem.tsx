import type { Notification } from '@/types';

type NotificationItemProps = {
  notification: Notification;
  onClick: () => void;
};

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

export default function NotificationItem({ notification, onClick }: NotificationItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full px-4 py-3 text-left transition hover:bg-white/5 ${notification.isRead ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start gap-2">
        {!notification.isRead && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-accent" />}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{notification.title}</p>
          <p className="truncate text-xs text-neutral-400">{notification.body}</p>
          <p className="mt-1 text-xs text-neutral-500">{formatRelativeTime(notification.createdAt)}</p>
        </div>
      </div>
    </button>
  );
}
