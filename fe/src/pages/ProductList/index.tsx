import { useState } from 'react';
import { FaPlus } from 'react-icons/fa';
import type { Product } from '@/types';
import { useToast } from '@/components/common/Toast';
import ProductCard from '@/components/ProductList/ProductCard';
import ProductRegistrationModal from '@/components/ProductList/ProductRegistrationModal';
import { useDeleteItem } from '@/api/hooks/useDeleteItem';
import { useGetItems } from '@/api/hooks/useGetItems';
import SideBar from '@/components/common/layouts/SideBar';
import { sellerSidebarItems } from '@/components/common/layouts/sellerSidebarItems';

export default function ProductListPage() {
  const [activeMenu, setActiveMenu] = useState('inventory');
  const [activeTab, setActiveTab] = useState<'ALL' | 'READY' | 'PENDING' | 'SOLD'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editProductInitData, setEditProductInitData] = useState<Product | null>(null);
  const itemsPerPage = 7;

  const { data: fetchedProducts } = useGetItems();
  const products = fetchedProducts || [];

  const { mutateAsync: deleteItem } = useDeleteItem();
  const { showToast } = useToast();

  const handleDelete = async (id: number) => {
    if (confirm('품목을 정말 삭제하시겠습니까?')) {
      try {
        await deleteItem(id);
        showToast({ message: '삭제되었습니다.' });
      } catch (err) {
        console.error(err);
        showToast({ message: '삭제에 실패했습니다.' });
      }
    }
  };

  const filteredProducts = products.filter((p) => {
    if (activeTab === 'ALL') return true;
    return p.status === activeTab;
  });

  const countByStatus = {
    READY: products.filter((p) => p.status === 'READY').length,
    PENDING: products.filter((p) => p.status === 'PENDING').length,
    SOLD: products.filter((p) => p.status === 'SOLD').length,
  };

  const tabs = [
    { id: 'ALL', label: '전체' },
    { id: 'READY', label: `대기(${countByStatus.READY})` },
    { id: 'PENDING', label: `경매중(${countByStatus.PENDING})` },
    { id: 'SOLD', label: `판매 완료(${countByStatus.SOLD})` },
  ] as const;

  return (
    <div className="max-w-[1400px] flex mx-auto gap-10 py-10 px-4 min-h-screen text-white">
      <SideBar
        items={sellerSidebarItems}
        activeItemId={activeMenu}
        onItemClick={(item) => setActiveMenu(item.id)}
        className="shrink-0 !pr-4 !pl-0 !py-0 !max-w-none"
      />
      <div className="flex-1 flex flex-col gap-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-white leading-tight">내 인벤토리</h1>
            <p className="text-[#888] text-sm mt-1">라이브 경매를 위해 등록된 품목입니다.</p>
          </div>
          <button
            onClick={() => {
              setEditProductInitData(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 bg-[#F5F5F7] text-[#1C1C1E] border-none rounded-3xl px-6 py-2.5 text-sm font-semibold cursor-pointer"
          >
            <FaPlus size={12} />새 물품 등록
          </button>
        </div>

        <div className="bg-[#151517] rounded-2xl border border-[#2C2C2E] min-h-[600px] px-6 pb-6 flex flex-col">
          <div className="flex border-b border-[#2C2C2E] mb-6 pt-4">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as typeof activeTab);
                    setCurrentPage(1);
                  }}
                  className={`bg-transparent border-none px-6 py-3 text-sm cursor-pointer relative ${
                    isActive ? 'text-white font-bold' : 'text-[#8E8E93] font-normal'
                  }`}
                >
                  {tab.label}
                  {isActive && <div className="absolute -bottom-px left-0 right-0 h-0.5 bg-white" />}
                </button>
              );
            })}
          </div>

          {filteredProducts.length > 0 ? (
            <>
              <div className="flex flex-col">
                {filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((product) => (
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
              {Math.ceil(filteredProducts.length / itemsPerPage) > 1 && (
                <div className="flex items-center justify-center gap-2 py-4 mt-auto">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="px-3 py-1.5 bg-transparent border border-[#2C2C2E] text-[#aaa] text-[13px] rounded cursor-pointer hover:bg-[#2a2a3a] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    이전
                  </button>
                  {Array.from({ length: Math.ceil(filteredProducts.length / itemsPerPage) }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded text-[13px] border-none cursor-pointer transition-colors ${
                          currentPage === page
                            ? 'bg-[#d9b36d] text-[#111] font-bold'
                            : 'bg-transparent text-[#aaa] hover:bg-[#2a2a3a]'
                        }`}
                      >
                        {page}
                      </button>
                    ),
                  )}
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(Math.ceil(filteredProducts.length / itemsPerPage), p + 1))
                    }
                    disabled={currentPage >= Math.ceil(filteredProducts.length / itemsPerPage)}
                    className="px-3 py-1.5 bg-transparent border border-[#2C2C2E] text-[#aaa] text-[13px] rounded cursor-pointer hover:bg-[#2a2a3a] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    다음
                  </button>
                </div>
              )}
            </>
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
