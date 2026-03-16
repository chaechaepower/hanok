import { useState } from 'react';
import { FaPlus } from 'react-icons/fa';
import type { Product } from '@/types';
import { useToast } from '@/components/common/Toast';
import ProductCard from './components/ProductCard';
import ProductRegistrationModal from './components/ProductRegistrationModal';
import { useDeleteItem } from '@/api/hooks/useDeleteItem';
import { useGetItems } from '@/api/hooks/useGetItems';
import SideBar from '@/components/common/layouts/SideBar';
import { sellerSidebarItems } from '@/components/common/layouts/sellerSidebarItems';

export default function ProductListPage() {
  const [activeMenu, setActiveMenu] = useState('inventory');
  const [activeTab, setActiveTab] = useState<'ALL' | 'WAITING' | 'AUCTION' | 'SOLD'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editProductInitData, setEditProductInitData] = useState<Product | null>(null);

  const { data: fetchedProducts } = useGetItems();
  const products = fetchedProducts || [];

  const { mutateAsync: deleteItem } = useDeleteItem();
  const { showToast } = useToast();

  const handleDelete = async (id: number) => {
    if (confirm('품목을 정말 삭제하시겠습니까?')) {
      try {
        await deleteItem(id);
        showToast({ message: '삭제되었습니다.' });
        // TODO: Refetch product list
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
    WAITING: products.filter((p) => p.status === 'WAITING').length,
    AUCTION: products.filter((p) => p.status === 'AUCTION').length,
    SOLD: products.filter((p) => p.status === 'SOLD').length,
  };

  const tabs = [
    { id: 'ALL', label: '전체' },
    { id: 'WAITING', label: `대기(${countByStatus.WAITING})` },
    { id: 'AUCTION', label: `경매중(${countByStatus.AUCTION})` },
    { id: 'SOLD', label: `판매 완료(${countByStatus.SOLD})` },
  ] as const;

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        gap: '0px',
        padding: '40px 16px',
        minHeight: '100vh',
        backgroundColor: '#0B0C10',
        color: 'white',
      }}
    >
      <SideBar
        items={sellerSidebarItems}
        activeItemId={activeMenu}
        onItemClick={(item) => setActiveMenu(item.id)}
        className="!w-[200px] shrink-0 !pr-4 !pl-0 !py-0 !max-w-none"
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}
        >
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 8px 0' }}>내 인벤토리</h1>
            <p style={{ fontSize: '14px', color: '#8E8E93', margin: 0 }}>라이브 경매를 위해 등록된 품목입니다.</p>
          </div>
          <button
            onClick={() => {
              setEditProductInitData(null);
              setIsModalOpen(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#F5F5F7',
              color: '#1C1C1E',
              border: 'none',
              borderRadius: '24px',
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            <FaPlus size={12} />새 물품 등록
          </button>
        </div>

        <div
          style={{
            backgroundColor: '#151517',
            borderRadius: '16px',
            border: '1px solid #2C2C2E',
            minHeight: '600px',
            padding: '0 24px 24px 24px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid #2C2C2E',
              marginBottom: '24px',
              paddingTop: '16px',
            }}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '12px 24px',
                    color: isActive ? 'white' : '#8E8E93',
                    fontSize: '14px',
                    fontWeight: isActive ? '700' : '400',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                >
                  {tab.label}
                  {isActive && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '-1px',
                        left: 0,
                        right: 0,
                        height: '2px',
                        backgroundColor: 'white',
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {filteredProducts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
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
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <p
                style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  color: 'white',
                }}
              >
                새 물품을 등록 해주세요.
              </p>
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
