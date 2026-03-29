import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { FaBroadcastTower, FaPlus } from 'react-icons/fa';
import { MdLiveTv } from 'react-icons/md';
import { useDeleteStream } from '@/api/hooks/useDeleteStream';
import { useGetScheduledStreams } from '@/api/hooks/useGetScheduledStreams';
import { usePostStartStream } from '@/api/hooks/usePostStartStream';
import ConfirmModal from '@/components/common/modal/ConfirmModal';
import { getCategoryLabel } from '@/constants/category';
import SideBar from '@/components/common/layouts/SideBar';
import CategorySelectModal from '@/components/LiveCreate/CategorySelectModal';
import { useToast } from '@/hooks/useToast';
import { formatScheduledDateTime } from '@/utils/formatDateTime';
import { sellerSidebarItems } from '@/constants/sidebar';

export default function LiveCreatePage() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('live');
  const { data, isLoading } = useGetScheduledStreams();
  const streams = [...(data?.streams ?? [])].sort((a, b) => {
    const getPriority = (state: typeof a.state) => {
      if (state === 'LIVE') return 0;
      if (state === 'PAUSED') return 1;
      return 2;
    };

    return getPriority(a.state) - getPriority(b.state);
  });
  const deleteMutation = useDeleteStream();
  const startStreamMutation = usePostStartStream();
  const [showModal, setShowModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const { showToast } = useToast();

  const deleteTarget = streams.find((stream) => stream.streamId === deleteTargetId) ?? null;

  const handleQuickStart = async (stream: (typeof streams)[number]) => {
    try {
      await startStreamMutation.mutateAsync({
        streamId: stream.streamId,
        request: {
          title: stream.title,
          category: stream.category,
          startType: 'INSTANT',
          auctionItems: [],
        },
      });
      navigate(`/live/${stream.streamId}`);
    } catch {
      showToast({ type: 'error', message: '방송 시작에 실패했습니다. 다시 시도해주세요.' });
    }
  };

  const handleDelete = (id: number) => {
    setDeleteTargetId(id);
  };

  const handleConfirmDelete = async () => {
    if (deleteTargetId == null) return;

    try {
      await deleteMutation.mutateAsync(deleteTargetId);
      setDeleteTargetId(null);
    } catch (err) {
      console.error(err);
      showToast({ type: 'error', message: '삭제에 실패했습니다. 다시 시도해주세요.' });
    }
  };

  const handleConfirmCategory = (categoryId: string) => {
    setShowModal(false);
    navigate('/live/register', { state: { categoryId } });
  };

  const content = isLoading ? (
    <div className="flex items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-700 border-t-gold" />
    </div>
  ) : streams.length === 0 ? (
    <div className="flex items-center justify-center rounded-2xl border border-neutral-800 py-20 text-body-lg text-neutral-500">
      등록된 라이브 방송이 없습니다
    </div>
  ) : (
    streams.map((stream) => (
      <div
        key={stream.streamId}
        className="flex items-center gap-5 rounded-2xl border border-neutral-800 bg-surface p-4 transition-colors hover:bg-surface-elevated"
      >
        <div className="relative h-[100px] w-[130px] shrink-0 overflow-hidden rounded-xl bg-neutral-900">
          {stream.thumbnail ? (
            <img src={stream.thumbnail} alt={stream.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-neutral-800">
              <FaBroadcastTower size={32} className="text-neutral-600" />
            </div>
          )}
          {stream.state === 'LIVE' && (
            <span className="absolute left-2 top-2 rounded-md bg-accent px-2 py-0.5 text-xs font-bold text-white">
              LIVE
            </span>
          )}
          {stream.state === 'PAUSED' && (
            <span className="absolute left-2 top-2 rounded-md bg-ember/20 px-2 py-0.5 text-xs font-bold text-ember-light">
              일시정지
            </span>
          )}
          {stream.state === 'SCHEDULED' && (
            <span className="absolute left-2 top-2 rounded-md bg-gold/20 px-2 py-0.5 text-xs font-bold text-gold-light">
              예약
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1.5">
          <p className="text-sm text-neutral-500">{formatScheduledDateTime(stream.scheduledAt, '')}</p>
          <p className="text-base font-semibold text-neutral-100">{stream.title}</p>
          <p className="text-sm text-neutral-500">{getCategoryLabel(stream.category)}</p>
        </div>

        <div className="flex shrink-0 items-center gap-4 pr-2">
          {stream.state === 'LIVE' || stream.state === 'PAUSED' ? (
            <button
              type="button"
              onClick={() => navigate(`/live/${stream.streamId}`)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                stream.state === 'LIVE'
                  ? 'border border-accent/35 bg-accent/12 text-accent-light hover:bg-accent/25'
                  : 'border border-ember/35 bg-ember/12 text-ember-light hover:bg-ember/22'
              }`}
            >
              <MdLiveTv size={14} />
              입장
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleQuickStart(stream)}
                disabled={startStreamMutation.isPending}
                className="flex items-center gap-1.5 rounded-lg border border-accent/35 bg-accent/12 px-3 py-1.5 text-xs font-bold text-accent-light transition-colors hover:bg-accent/25 disabled:opacity-50"
              >
                <MdLiveTv size={14} />
                {startStreamMutation.isPending ? '시작 중...' : '바로 시작'}
              </button>
              <button
                type="button"
                onClick={() => navigate(`/live/register?streamId=${stream.streamId}`)}
                className="text-sm text-neutral-300 transition-colors hover:text-neutral-100"
              >
                수정
              </button>
              <button
                type="button"
                onClick={() => handleDelete(stream.streamId)}
                className="text-sm text-neutral-300 transition-colors hover:text-accent-light"
              >
                삭제
              </button>
            </>
          )}
        </div>
      </div>
    ))
  );

  return (
    <div className="w-350 mx-auto flex min-h-screen gap-10 px-4 py-10">
      <SideBar
        items={sellerSidebarItems}
        activeItemId={activeMenu}
        onItemClick={(item) => setActiveMenu(item.id)}
        className="shrink-0 !max-w-none !pr-4 !pl-0 !py-0"
      />

      <main className="flex flex-1 flex-col gap-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="m-0 mb-2 text-[24px] font-semibold leading-tight text-warm">라이브 방송 관리</h2>
            <p className="m-0 text-body-md text-neutral-500">예정된 방송을 확인하고 경매를 시작해보세요!</p>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="btn-primary-outline flex cursor-pointer items-center gap-1.5 rounded-(--radius-control) px-5 py-2.5 text-sm font-semibold"
          >
            <FaPlus size={12} />
            라이브 방송 등록
          </button>
        </div>

        <div className="flex flex-col gap-4">{content}</div>
      </main>

      {showModal && <CategorySelectModal onConfirm={handleConfirmCategory} onClose={() => setShowModal(false)} />}

      <ConfirmModal
        isOpen={deleteTarget !== null}
        badgeLabel="방송 삭제"
        title="라이브 방송을 삭제할까요?"
        description={'이 작업은 되돌릴 수 없습니다'}
        confirmLabel="삭제하기"
        cancelLabel="취소"
        isPending={deleteMutation.isPending}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
      />
    </div>
  );
}
