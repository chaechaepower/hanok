import { useState } from 'react';
import { FaBox, FaBroadcastTower, FaTruck, FaPlus } from 'react-icons/fa';
import type { Product, SideBarItem } from '@/types';
import ProductCard from './components/ProductCard';
import ProductRegistrationModal from './components/ProductRegistrationModal';
import { useDeleteItem } from '@/api/hooks/useDeleteItem';
import { useGetItems } from '@/api/hooks/useGetItems';
import SideBar from '@/components/common/layouts/SideBar';

const sidebarItems: SideBarItem[] = [
  { id: 'inventory', label: '내 인벤토리', icon: <FaBox size={18} />, path: '/products' },
  { id: 'live', label: '라이브 방송 관리', icon: <FaBroadcastTower size={18} />, path: '/live/new' },
  { id: 'delivery', label: '배송 관리', icon: <FaTruck size={18} />, path: '/tracking' },
];


export default function ProductListPage() {
  const [activeMenu, setActiveMenu] = useState('inventory');
  const [activeTab, setActiveTab] = useState<'ALL' | 'READY' | 'PENDING' | 'SOLD'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editProductInitData, setEditProductInitData] = useState<Product | null>(null);

  const { data: fetchedProducts } = useGetItems();
  const products = fetchedProducts || [];

  const { mutateAsync: deleteItem } = useDeleteItem();

  const handleDelete = async (id: number) => {
    if (confirm('품목을 정말 삭제하시겠습니까?')) {
      try {
        await deleteItem(id);
        alert('삭제되었습니다.');
      } catch (err) {
        console.error(err);
        alert('삭제 실패');
      }
    }
  };

  const filteredProducts = products.filter(p => {
    if (activeTab === 'ALL') return true;
    return p.status === activeTab;
  });

  const countByStatus = {
    READY: products.filter(p => p.status === 'READY').length,
    PENDING: products.filter(p => p.status === 'PENDING').length,
    SOLD: products.filter(p => p.status === 'SOLD').length,
  };

  const tabs = [
    { id: 'ALL', label: '전체' },
    { id: 'READY', label: `대기(${countByStatus.READY})` },
    { id: 'PENDING', label: `경매중(${countByStatus.PENDING})` },
    { id: 'SOLD', label: `판매 완료(${countByStatus.SOLD})` },
  ] as const;

  return (
    <div className="flex w-full max-w-[1200px] mx-auto gap-0 py-10 px-4 min-h-screen bg-[#0B0C10] text-white">
      <SideBar
        items={sidebarItems}
        activeItemId={activeMenu}
        onItemClick={(item) => setActiveMenu(item.id)}
        className="!w-[200px] shrink-0 !pr-4 !pl-0 !py-0 !max-w-none"
      />

      <div className="flex-1 flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold m-0 mb-2">내 인벤토리</h1>
            <p className="text-sm text-[#8E8E93] m-0">라이브 경매를 위해 등록된 품목입니다.</p>
          </div>
          <button
            onClick={() => {
              setEditProductInitData(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 bg-[#F5F5F7] text-[#1C1C1E] border-none rounded-3xl px-6 py-2.5 text-sm font-semibold cursor-pointer"
          >
            <FaPlus size={12} />
            새 물품 등록
          </button>
        </div>

        <div className="bg-[#151517] rounded-2xl border border-[#2C2C2E] min-h-[600px] px-6 pb-6 flex flex-col">
          <div className="flex border-b border-[#2C2C2E] mb-6 pt-4">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`bg-transparent border-none px-6 py-3 text-sm cursor-pointer relative ${
                    isActive ? 'text-white font-bold' : 'text-[#8E8E93] font-normal'
                  }`}
                >
                  {tab.label}
                  {isActive && (
                    <div className="absolute -bottom-px left-0 right-0 h-0.5 bg-white" />
                  )}
                </button>
              );
            })}
          </div>

          {filteredProducts.length > 0 ? (
            <div className="flex flex-col">
              {filteredProducts.map(product => (
                <ProductCard
                  key={product.itemId}
                  product={product}
                  onEdit={() => {
                    setEditProductInitData(product);
                    setIsModalOpen(true);
                  }}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-[28px] font-bold text-white">새 물품을 등록 해주세요.</p>
            </div>
          )}
        </div>
      </div>

      <ProductRegistrationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditProductInitData(null);
        }}
        initialData={editProductInitData}
      />
    </div>
  );
}
