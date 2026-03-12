import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { FaBox, FaBroadcastTower, FaTruck, FaPlus } from 'react-icons/fa';
import CategorySelectModal from './components/CategorySelectModal';
import { useDeleteStream } from '@/api/hooks/useDeleteStream';
import { useGetScheduledStreams } from '@/api/hooks/useGetScheduledStreams';
import type { SideBarItem } from '@/types';
import SideBar from '@/components/common/layouts/SideBar';
import { MAIN_CATEGORY_ITEMS } from '@/components/Main/SideBar';

const sidebarItems: SideBarItem[] = [
  { id: 'inventory', label: '내 인벤토리', icon: <FaBox size={18} />, path: '/products' },
  { id: 'live', label: '라이브 방송 관리', icon: <FaBroadcastTower size={18} />, path: '/live/new' },
  { id: 'delivery', label: '배송 관리', icon: <FaTruck size={18} />, path: '/tracking' },
];

const getCategoryLabel = (categoryId: string): string =>
  MAIN_CATEGORY_ITEMS.find((c) => c.id === categoryId)?.label ?? categoryId;

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
  const streams = data?.streams ?? [];
  const deleteMutation = useDeleteStream();
  const [showModal, setShowModal] = useState(false);

  const handleDelete = async (id: number) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await deleteMutation.mutateAsync(id);
    } catch (err) {
      console.error(err);
      alert('삭제에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleConfirmCategory = (categoryId: string) => {
    setShowModal(false);
    navigate('/live/register', { state: { categoryId } });
  };

  const content = isLoading ? (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-[#333] border-t-[#d9b36d] rounded-full animate-spin" />
    </div>
  ) : streams.length === 0 ? (
    <div className="flex items-center justify-center py-20 text-[#888] text-base border border-white/10 rounded-2xl">
      등록된 라이브 방송이 없습니다.
    </div>
  ) : (
    streams.map((stream) => (
      <div
        key={stream.streamId}
        className="flex items-center gap-5 border border-white/10 rounded-2xl p-4 bg-[#111] hover:bg-white/5 transition-colors"
      >
        <div className="relative w-[130px] h-[100px] rounded-xl overflow-hidden shrink-0 bg-[#1a1a1a]">
          {stream.thumbnail ? (
            <img
              src={stream.thumbnail}
              alt={stream.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#222]">
              <FaBroadcastTower size={32} className="text-white/20" />
            </div>
          )}
          {stream.state === 'LIVE' && (
            <span className="absolute top-2 left-2 px-2 py-0.5 bg-[#e74c3c] text-white text-xs font-bold rounded-md">
              방송중
            </span>
          )}
          {stream.state === 'SCHEDULED' && (
            <span className="absolute top-2 left-2 px-2 py-0.5 bg-[#3498db] text-white text-xs font-bold rounded-md">
              예약
            </span>
          )}
        </div>

        <div className="flex-1 flex flex-col gap-1.5">
          <p className="text-[#888] text-sm">
            {formatScheduledAt(stream.scheduledAt)}
          </p>
          <p className="text-white text-base font-semibold">
            방송 제목 : {stream.title}
          </p>
          <p className="text-[#888] text-sm">
            방송 카테고리 : {getCategoryLabel(stream.category)}
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0 pr-2">
          <button
            type="button"
            onClick={() => navigate(`/live/edit/${stream.streamId}`)}
            className="text-sm transition-colors text-white/70 hover:text-white"
          >
            수정
          </button>
          <button
            type="button"
            onClick={() => handleDelete(stream.streamId)}
            className="text-white/70 text-sm hover:text-[#e74c3c] transition-colors"
          >
            삭제
          </button>
        </div>
      </div>
    ))
  );

  return (
    <div className="w-full max-w-[1200px] mx-auto flex gap-0 py-10 px-4">
      <SideBar
        items={sidebarItems}
        activeItemId={activeMenu}
        onItemClick={(item) => setActiveMenu(item.id)}
        className="!w-[200px] shrink-0 !pr-4 !pl-0 !py-0 !max-w-none"
      />

      <main className="flex-1 flex flex-col gap-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white leading-tight">라이브 방송 관리</h1>
            <p className="text-[#888] text-sm mt-1">라이브 방송 예약 목록입니다.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-[24px] py-[10px] bg-[#F5F5F7] text-[#1C1C1E] border-none rounded-[24px] text-[14px] font-semibold cursor-pointer whitespace-nowrap hover:opacity-90 transition-opacity"
          >
            <FaPlus size={12} />
            라이브 방송 등록
          </button>
        </div>

        <div className="flex flex-col gap-4">{content}</div>
      </main>

      {showModal && (
        <CategorySelectModal
          onConfirm={handleConfirmCategory}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
