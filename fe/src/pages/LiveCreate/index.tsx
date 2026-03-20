import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { FaBroadcastTower, FaPlus } from 'react-icons/fa';
import { MdLiveTv } from 'react-icons/md';
import { useToast } from '@/components/common/Toast';
import { useDeleteStream } from '@/api/hooks/useDeleteStream';
import { useGetScheduledStreams } from '@/api/hooks/useGetScheduledStreams';
import { usePostStartStream } from '@/api/hooks/usePostStartStream';
import { getCategoryLabel } from '@/constants/category';
import SideBar from '@/components/common/layouts/SideBar';
import { sellerSidebarItems } from '@/components/common/layouts/sellerSidebarItems';
import CategorySelectModal from '@/components/LiveCreate/CategorySelectModal';

const formatScheduledAt = (isoString: string | null): string => {
  if (!isoString) return '방송 중';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return isoString;
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export default function LiveCreatePage() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('live');
  const { data, isLoading } = useGetScheduledStreams();
  const streams = [...(data?.streams ?? [])].sort((a, b) => {
    if (a.state === 'LIVE' && b.state !== 'LIVE') return -1;
    if (a.state !== 'LIVE' && b.state === 'LIVE') return 1;
    return 0;
  });
  const deleteMutation = useDeleteStream();
  const startStreamMutation = usePostStartStream();
  const [showModal, setShowModal] = useState(false);
  const { showToast } = useToast();

  const handleQuickStart = async (stream: (typeof streams)[number]) => {
    try {
      await startStreamMutation.mutateAsync({
        streamId: stream.streamId,
        request: {
          title: stream.title,
          category: stream.category,
          startType: 'IMMEDIATE',
          itemIds: [],
        },
      });
      navigate(`/live/${stream.streamId}`);
    } catch {
      showToast({ message: '방송 시작에 실패했습니다. 다시 시도해주세요.' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await deleteMutation.mutateAsync(id);
    } catch (err) {
      console.error(err);
      showToast({ message: '삭제에 실패했습니다. 다시 시도해주세요.' });
    }
  };

  const handleConfirmCategory = (categoryId: string) => {
    setShowModal(false);
    navigate('/live/register', { state: { categoryId } });
  };

  const content = isLoading ? (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-neutral-700 border-t-gold rounded-full animate-spin" />
    </div>
  ) : streams.length === 0 ? (
    <div className="flex items-center justify-center py-20 text-neutral-500 text-body-lg border border-neutral-800 rounded-2xl">
      등록된 라이브 방송이 없습니다.
    </div>
  ) : (
    streams.map((stream) => (
      <div
        key={stream.streamId}
        className="flex items-center gap-5 border border-neutral-800 rounded-2xl p-4 bg-surface hover:bg-surface-elevated transition-colors"
      >
        <div className="relative w-[130px] h-[100px] rounded-xl overflow-hidden shrink-0 bg-neutral-900">
          {stream.thumbnail ? (
            <img src={stream.thumbnail} alt={stream.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-neutral-800">
              <FaBroadcastTower size={32} className="text-neutral-600" />
            </div>
          )}
          {stream.state === 'LIVE' && (
            <span className="absolute top-2 left-2 px-2 py-0.5 bg-accent text-white text-xs font-bold rounded-md">
              방송중
            </span>
          )}
          {stream.state === 'SCHEDULED' && (
            <span className="absolute top-2 left-2 px-2 py-0.5 bg-gold/20 text-gold-light text-xs font-bold rounded-md">
              예약
            </span>
          )}
        </div>

        <div className="flex-1 flex flex-col gap-1.5">
          <p className="text-neutral-500 text-sm">{formatScheduledAt(stream.scheduledAt)}</p>
          <p className="text-neutral-100 text-base font-semibold">{stream.title}</p>
          <p className="text-neutral-500 text-sm">방송 카테고리 : {getCategoryLabel(stream.category)}</p>
        </div>

        <div className="flex items-center gap-4 shrink-0 pr-2">
          {stream.state === 'LIVE' ? (
            <button
              type="button"
              onClick={() => navigate(`/live/${stream.streamId}`)}
              className="flex items-center gap-1.5 rounded-lg border border-accent/35 bg-accent/12 px-3 py-1.5 text-xs font-bold text-accent-light transition-colors hover:bg-accent/25"
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
                {startStreamMutation.isPending ? '시작 중...' : '즉시 시작'}
              </button>
              <button
                type="button"
                onClick={() => navigate(`/live/register?streamId=${stream.streamId}`)}
                className="text-sm transition-colors text-neutral-300 hover:text-neutral-100"
              >
                수정
              </button>
              <button
                type="button"
                onClick={() => handleDelete(stream.streamId)}
                className="text-neutral-300 text-sm hover:text-accent-light transition-colors"
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
    <div className="w-350 mx-auto flex gap-10 py-10 px-4 min-h-screen ">
      <SideBar
        items={sellerSidebarItems}
        activeItemId={activeMenu}
        onItemClick={(item) => setActiveMenu(item.id)}
        className="shrink-0 !pr-4 !pl-0 !py-0 !max-w-none"
      />

      <main className="flex-1 flex flex-col gap-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[24px] font-semibold text-warm leading-tight m-0 mb-2">라이브 방송 관리</h2>
            <p className="text-body-md text-neutral-500 m-0">내가 바로 경매의 왕이다!</p>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="btn-primary-outline flex items-center gap-1.5 rounded-[10px] px-5 py-2.5 text-sm font-semibold cursor-pointer"
          >
            <FaPlus size={12} />
            라이브 방송 등록
          </button>
        </div>

        <div className="flex flex-col gap-4">{content}</div>
      </main>

      {showModal && <CategorySelectModal onConfirm={handleConfirmCategory} onClose={() => setShowModal(false)} />}
    </div>
  );
}
