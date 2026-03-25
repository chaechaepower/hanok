import { FiBell, FiCalendar } from 'react-icons/fi';

import EditDeleteActions from '@/components/common/EditDeleteActions';
import NoItem from '@/components/common/NoItem';
import type { NoticeItem } from '@/types';

interface NoticeListProps {
  notices: NoticeItem[];
  isMyProfile: boolean;
  onOpenNotice: (noticeId: number) => void;
  onEditNotice: (notice: NoticeItem) => void;
  onDeleteNotice: (noticeId: number) => void;
}

const formatNoticeDate = (iso: string) => {
  const date = new Date(iso);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const splitNoticeContent = (content: string) => {
  const streamMatch = content.match(/\[방송 안내\]\s*([\s\S]+)$/);

  return {
    mainContent: streamMatch ? content.slice(0, content.indexOf('[방송 안내]')).trim() : content,
    streamInfo: streamMatch ? streamMatch[1].trim() : null,
  };
};

export default function NoticeList({
  notices,
  isMyProfile,
  onOpenNotice,
  onEditNotice,
  onDeleteNotice,
}: NoticeListProps) {
  if (notices.length === 0) {
    return <NoItem message="등록된 공지사항이 없습니다" textClassName="text-subtitle-lg text-neutral-600" />;
  }

  return (
    <div className="flex flex-col gap-5">
      {notices.map((notice) => {
        const { mainContent, streamInfo } = splitNoticeContent(notice.content);

        return (
          <div
            key={notice.noticeId}
            className="flex cursor-pointer flex-col gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-8 py-7 transition-colors hover:border-gold-light/40"
            onClick={() => onOpenNotice(notice.noticeId)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <FiBell size={20} className="text-gold-light" />
                  <h3 className="m-0 text-neutral-100">{notice.title}</h3>
                </div>
                {mainContent && (
                  <p className="m-0 mt-1 ml-8 text-body-md leading-relaxed text-neutral-400">{mainContent}</p>
                )}
                {streamInfo && (
                  <p className="m-0 mt-1 ml-8 text-body-md leading-relaxed text-neutral-400">{streamInfo}</p>
                )}
                <div className="mt-2 ml-8 flex items-center gap-2">
                  <FiCalendar size={16} className="text-neutral-600" />
                  <span className="text-body-md text-neutral-600">{formatNoticeDate(notice.createdAt)}</span>
                </div>
              </div>

              {isMyProfile && (
                <EditDeleteActions
                  onEdit={(event) => {
                    event.stopPropagation();
                    onEditNotice(notice);
                  }}
                  onDelete={(event) => {
                    event.stopPropagation();
                    onDeleteNotice(notice.noticeId);
                  }}
                  containerClassName="flex gap-3"
                  editClassName="btn-ghost px-2 py-1 text-body-md"
                  deleteClassName="rounded-md bg-transparent px-2 py-1 text-body-md text-accent-light/70 transition-colors hover:bg-accent/10 hover:text-accent-light"
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
