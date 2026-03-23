import { useState } from 'react';
import { FaPlus } from 'react-icons/fa';
import type { Product } from '@/types';
import ProductCard from '@/components/ProductList/ProductCard';
import ProductRegistrationModal from '@/components/ProductList/ProductRegistrationModal';
import ConfirmModal from '@/components/common/ConfirmModal';
import { useDeleteItem } from '@/api/hooks/useDeleteItem';
import { useGetItems } from '@/api/hooks/useGetItems';
import SideBar from '@/components/common/layouts/SideBar';
import { sellerSidebarItems } from '@/components/common/layouts/sellerSidebarItems';
import { useToast } from '@/hooks/useToast';

export default function ProductListPage() {
  const [activeMenu, setActiveMenu] = useState('inventory');
  const [activeTab, setActiveTab] = useState<'ALL' | 'READY' | 'PENDING' | 'SOLD'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editProductInitData, setEditProductInitData] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const itemsPerPage = 7;

  const { data: allProducts = [] } = useGetItems(undefined, activeTab === 'ALL');
  const { data: readyProducts = [] } = useGetItems('READY');
  const { data: scheduledProducts = [] } = useGetItems('SCHEDULED');
  const { data: pendingProducts = [] } = useGetItems('PENDING');
  const { data: soldProducts = [] } = useGetItems('SOLD');
  const productsByTab = {
    ALL: allProducts,
    READY: [...readyProducts, ...scheduledProducts],
    PENDING: pendingProducts,
    SOLD: soldProducts,
  } as const;

  const { mutateAsync: deleteItem, isPending: isDeletePending } = useDeleteItem();
  const { showToast } = useToast();

  const filteredProducts = productsByTab[activeTab];

  const handleDelete = (id: number) => {
    const target =
      filteredProducts.find((product) => product.itemId === id) ??
      allProducts.find((product) => product.itemId === id) ??
      readyProducts.find((product) => product.itemId === id) ??
      scheduledProducts.find((product) => product.itemId === id) ??
      pendingProducts.find((product) => product.itemId === id) ??
      soldProducts.find((product) => product.itemId === id) ??
      null;

    setDeleteTarget(target);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteItem(deleteTarget.itemId);
      showToast({ message: '품목이 삭제되었습니다.' });
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
      showToast({ message: '품목 삭제에 실패했습니다.' });
    }
  };

  const countByStatus = {
    READY: readyProducts.length + scheduledProducts.length,
    PENDING: pendingProducts.length,
    SOLD: soldProducts.length,
  };

  const tabs = [
    { id: 'ALL', label: '전체' },
    { id: 'READY', label: `대기(${countByStatus.READY})` },
    { id: 'PENDING', label: `거래중(${countByStatus.PENDING})` },
    { id: 'SOLD', label: `판매 완료(${countByStatus.SOLD})` },
  ] as const;

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  return (
    <div className="w-350 mx-auto flex min-h-screen gap-10 px-4 py-10 text-white">
      <SideBar
        items={sellerSidebarItems}
        activeItemId={activeMenu}
        onItemClick={(item) => setActiveMenu(item.id)}
        className="shrink-0 !max-w-none !pr-4 !pl-0 !py-0"
      />
      <div className="flex flex-1 flex-col gap-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="m-0 mb-2 text-[24px] font-semibold leading-tight text-warm">내 인벤토리</h2>
            <p className="m-0 text-body-md text-neutral-500">판매하고 싶은 물건을 마음껏 등록해보세요!</p>
          </div>
          <button
            onClick={() => {
              setEditProductInitData(null);
              setIsModalOpen(true);
            }}
            className="btn-primary-outline flex cursor-pointer items-center gap-1.5 rounded-[10px] px-5 py-2.5 text-sm font-semibold"
          >
            <FaPlus size={12} />새 물품 등록
          </button>
        </div>

        <div className="flex flex-col rounded-2xl border border-neutral-800 bg-surface-elevated px-6 pb-6">
          <div className="mb-6 flex border-b border-neutral-800 pt-4">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as typeof activeTab);
                    setCurrentPage(1);
                  }}
                  className={`relative cursor-pointer border-none bg-transparent px-6 py-3 text-sm ${
                    isActive ? 'font-bold text-neutral-100' : 'font-normal text-neutral-500'
                  }`}
                >
                  {tab.label}
                  {isActive && <div className="absolute -bottom-px left-0 right-0 h-0.5 bg-neutral-100" />}
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
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2 py-4">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="cursor-pointer rounded-lg border border-neutral-700 bg-transparent px-3 py-1.5 text-[13px] text-neutral-400 transition-colors hover:bg-warm/10 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    이전
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`h-8 w-8 cursor-pointer rounded-lg border-none text-[13px] transition-colors ${
                        currentPage === page
                          ? 'bg-primary font-bold text-neutral-100'
                          : 'bg-transparent text-neutral-400 hover:bg-warm/10'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="cursor-pointer rounded-lg border border-neutral-700 bg-transparent px-3 py-1.5 text-[13px] text-neutral-400 transition-colors hover:bg-warm/10 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    다음
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center py-16">
              <p className="text-body-lg text-neutral-500">새 물품을 등록 해주세요.</p>
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

      <ConfirmModal
        isOpen={deleteTarget !== null}
        badgeLabel="물품 삭제"
        title="품목을 삭제할까요?"
        description={'이 작업은 되돌릴 수 없습니다.'}
        confirmLabel="삭제하기"
        cancelLabel="취소"
        isPending={isDeletePending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
      />
    </div>
  );
}
