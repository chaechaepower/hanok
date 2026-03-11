import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { FaBox, FaBroadcastTower, FaTruck } from 'react-icons/fa';
import type { Live } from '@/types';
import CategorySelectModal from './components/CategorySelectModal';
import { getFetchInstance } from '@/api/instance';
import type { LiveListResponse, SideBarItem } from '@/types';
import SideBar from '@/components/common/layouts/SideBar';

const sidebarItems: SideBarItem[] = [
  { id: 'inventory', label: '내 인벤토리', icon: <FaBox size={18} /> },
  { id: 'live', label: '라이브 방송 관리', icon: <FaBroadcastTower size={18} /> },
  { id: 'delivery', label: '배송 관리', icon: <FaTruck size={18} /> },
];

const formatScheduledAt = (isoString: string | null): string => {
  if (!isoString) return '즉시 시작';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return isoString; // fallback
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export default function LiveCreatePage() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('live');
  const [lives, setLives] = useState<Live[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchLives = async () => {
      try {
        const res = await getFetchInstance().get<LiveListResponse>('/v1/lives');
        setLives(res.data.lives);
      } catch {
        console.error('방송 목록을 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchLives();
  }, []);

  const handleDelete = (id: number) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      setLives((prev) => prev.filter((live) => live.id !== id));
    }
  };

  const handleConfirmCategory = (categoryId: string) => {
    setShowModal(false);
    navigate('/live/register', { state: { categoryId } });
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto flex gap-0 py-10 px-4">
      <SideBar
        items={sidebarItems}
        activeItemId={activeMenu}
        onItemClick={(item) => setActiveMenu(item.id)}
        className="!w-[200px] shrink-0 !pr-4 !pl-0 !py-0 !max-w-none"
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white leading-tight">라이브 방송 관리</h1>
            <p className="text-[#888] text-sm mt-1">라이브 방송 예약 목록입니다.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="px-5 py-2 bg-transparent border border-white/60 text-white text-sm rounded-full hover:bg-white/10 transition-colors whitespace-nowrap"
          >
            라이브 방송 등록
          </button>
        </div>

        {/* Live List */}
        <div className="flex flex-col gap-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-[#333] border-t-[#d9b36d] rounded-full animate-spin" />
            </div>
          ) : lives.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-[#888] text-base border border-white/10 rounded-2xl">
              등록된 라이브 방송이 없습니다.
            </div>
          ) : (
            lives.map((live) => (
              <div
                key={live.id}
                className="flex items-center gap-5 border border-white/10 rounded-2xl p-4 bg-[#111] hover:bg-white/5 transition-colors"
              >
                {/* Thumbnail */}
                <div className="relative w-[130px] h-[100px] rounded-xl overflow-hidden shrink-0 bg-[#1a1a1a]">
                  {live.thumbnail ? (
                    <img
                      src={live.thumbnail}
                      alt={live.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#222]">
                      <FaBroadcastTower size={32} className="text-white/20" />
                    </div>
                  )}
                  {live.status && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-[#e74c3c] text-white text-xs font-bold rounded-md">
                      {live.status}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col gap-1.5">
                  <p className="text-[#888] text-sm">
                    방송시간&nbsp;&nbsp;{formatScheduledAt(live.scheduledAt)}
                  </p>
                  <p className="text-white text-base font-semibold">
                    방송 제목 : {live.title}
                  </p>
                  <p className="text-[#888] text-sm">
                    방송 카테고리 : {live.category}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4 shrink-0 pr-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/live/edit/${live.id}`)}
                    className="text-white/70 text-sm hover:text-white transition-colors"
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(live.id)}
                    className="text-white/70 text-sm hover:text-[#e74c3c] transition-colors"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Category Select Modal */}
      {showModal && (
        <CategorySelectModal
          onConfirm={handleConfirmCategory}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
