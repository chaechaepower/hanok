import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGetSellerProfile } from '@/api/hooks/useGetSellerProfile';
import { useGetSellerNotice } from '@/api/hooks/useGetSellerNotice';
import { usePostSellerNotice } from '@/api/hooks/usePostSellerNotice';
import { usePatchSellerNotice } from '@/api/hooks/usePatchSellerNotice';
import { useDeleteSellerNotice } from '@/api/hooks/useDeleteSellerNotice';
import { useGetSellerStatus } from '@/api/hooks/useGetSellerStatus';
import { styles } from './styles';
import { 
  InstagramIcon, 
  YoutubeIcon, 
  TiktokIcon,
  BellIcon, 
  CalendarIcon, 
  HistoryIcon, 
  GiftIcon,
  TruckIcon
} from './components/Icons';
import { useGetEscrows } from '@/api/hooks/useGetEscrows';
import { useGetEscrowDetail } from '@/api/hooks/useGetEscrowDetail';
import type { EscrowState } from '@/types';

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${min}`;
};

const formatPrice = (price: number) => price.toLocaleString('ko-KR') + '원';

const getEscrowStateUI = (state: EscrowState) => {
  switch (state) {
    case 'INVOICE_SUBMITTED':
      return { label: '배송중', badgeStyle: styles.badgeGreen };
    case 'COMPLETED':
      return { label: '배송완료', badgeStyle: styles.badgeBlue };
    case 'CANCELLED':
      return { label: '취소됨', badgeStyle: { ...styles.badgeBlue, backgroundColor: '#333', color: '#999' } };
    case 'DEPOSITED':
    default:
      return { label: '결제완료', badgeStyle: { ...styles.badgeGreen, backgroundColor: '#3a2b16', color: '#d9b36d' } };
  }
};

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const sellerId = Number(id);
  const [activeTab, setActiveTab] = useState<'posts' | 'sales'>('posts');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editPostId, setEditPostId] = useState<number | null>(null);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticePage] = useState(1); 
  
  const [selectedEscrowId, setSelectedEscrowId] = useState<string | number | null>(null);

  const { data: escrowsData } = useGetEscrows();
  const escrows = escrowsData?.data || [];
  
  const { data: escrowDetail } = useGetEscrowDetail(selectedEscrowId);

  const { data, isLoading, isError } = useGetSellerProfile(sellerId);
  const { data: mySellerStatus } = useGetSellerStatus();
  
  const { data: noticeData } = useGetSellerNotice(sellerId, { page: noticePage, limit: 10 });
  const { mutate: postNotice } = usePostSellerNotice(sellerId);
  const { mutate: patchNotice } = usePatchSellerNotice(sellerId);
  const { mutate: deleteNotice } = useDeleteSellerNotice(sellerId);

  const isOwner = mySellerStatus?.isSeller || true; 

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setNoticeTitle('');
    setNoticeContent('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (postId: number, title: string, content: string) => {
    setModalMode('edit');
    setEditPostId(postId);
    setNoticeTitle(title);
    setNoticeContent(content);
    setIsModalOpen(true);
  };

  const handleDeleteNotice = (postId: number) => {
    if (confirm('공지사항을 정말 삭제하시겠습니까?')) {
      deleteNotice(postId);
    }
  };

  const handleSubmitNotice = () => {
    if (!noticeTitle.trim() || !noticeContent.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }
    if (modalMode === 'create') {
      postNotice(
        { title: noticeTitle, content: noticeContent },
        { onSuccess: () => setIsModalOpen(false) }
      );
    } else if (modalMode === 'edit' && editPostId) {
      patchNotice(
        { postId: editPostId, payload: { title: noticeTitle, content: noticeContent } },
        { onSuccess: () => setIsModalOpen(false) }
      );
    }
  };

  if (isLoading) {
    return (
      <div style={styles.center}>
        <div style={styles.spinner} />
        <p style={{ color: '#aaa', marginTop: 12 }}>판매자 정보를 불러오는 중…</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div style={styles.center}>
        <p style={{ color: '#f87171', fontSize: 16 }}>판매자 정보를 불러오지 못했습니다.</p>
      </div>
    );
  }

  const { nickname, intro, profile_image, instagramUrl, youtubeUrl, tiktokUrl, stats } = data;
  const notices = noticeData?.items || [];

  return (
    <div style={styles.page}>
      <div style={styles.sectionBox}>
        <div style={styles.profileRow}>
          <div style={styles.avatarWrapper}>
            {profile_image ? (
              <img src={profile_image} alt={nickname} style={styles.avatar} />
            ) : (
              <div style={styles.avatarFallback}>{nickname.charAt(0)}</div>
            )}
          </div>

          <div style={styles.profileInfo}>
            <div style={styles.nameRow}>
              <h1 style={styles.nickname}>{nickname}상점</h1>
              <button style={styles.followBtn}>팔로우</button>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 16 }}>
                <button style={styles.textBtn}>수정</button>
                <button style={styles.textBtn}>신고</button>
              </div>
            </div>

            <p style={styles.intro}>{intro}</p>

            <div style={styles.snsRow}>
              {instagramUrl && (
                <a href={instagramUrl} target="_blank" rel="noopener noreferrer" style={styles.snsLink}>
                  <InstagramIcon />
                  <span>{instagramUrl.replace('https://instagram.com/', '@')}</span>
                </a>
              )}
              {youtubeUrl && (
                <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" style={styles.snsLink}>
                  <YoutubeIcon />
                  <span>YouTube</span>
                </a>
              )}
              {tiktokUrl && (
                <a href={tiktokUrl} target="_blank" rel="noopener noreferrer" style={styles.snsLink}>
                  <TiktokIcon />
                  <span>TikTok</span>
                </a>
              )}
            </div>

            <div style={styles.statsBox}>
              <div style={styles.statItem}>
                <span style={styles.statValue}>{stats.followerCount}</span>
                <span style={styles.statLabel}>팔로워</span>
              </div>
              <div style={styles.statDivider} />
              <div style={styles.statItem}>
                <span style={styles.statValue}>{stats.rating.toFixed(1)}</span>
                <span style={styles.statLabel}>평점</span>
              </div>
              <div style={styles.statDivider} />
              <div style={styles.statItem}>
                <span style={styles.statValue}>{stats.avgShipDays.toFixed(1)}일</span>
                <span style={styles.statLabel}>평균 배송일</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.sectionBox}>
        <div style={styles.tabsHeader}>
          <button
            style={{ ...styles.tabBtn, ...(activeTab === 'posts' ? styles.tabActive : {}) }}
            onClick={() => setActiveTab('posts')}
          >
            # 공지사항
          </button>
          
          <button
            style={{ ...styles.tabBtn, ...(activeTab === 'sales' ? styles.tabActive : {}) }}
            onClick={() => setActiveTab('sales')}
          >
            <HistoryIcon />
            낙찰 이력
          </button>
        </div>

        {activeTab === 'posts' && (
          <div style={styles.listContainer}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
              <button style={styles.createNoticeBtn} onClick={handleOpenCreateModal}>
                공지사항 등록
              </button>
            </div>
            {notices.length === 0 ? (
              <p style={styles.empty}>등록된 공지사항이 없습니다.</p>
            ) : (
              notices.map((post) => (
                <div key={post.postId} style={styles.noticeCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    
                    <div style={{ flex: 1 }}>
                      <div style={styles.noticeIconRow}>
                        <BellIcon />
                        <h3 style={styles.noticeTitle}>{post.title}</h3>
                      </div>
                      <p style={styles.noticeContent}>{post.content}</p>
                      <div style={styles.noticeMeta}>
                        <CalendarIcon />
                        <span style={styles.dateText}>{formatDate(post.createdAt).split(' ')[0]}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button 
                        style={styles.actionBtn} 
                        onClick={() => handleOpenEditModal(post.postId, post.title, post.content)}
                      >
                        수정
                      </button>
                      <button 
                        style={{ ...styles.actionBtn, color: '#f87171' }} 
                        onClick={() => handleDeleteNotice(post.postId)}
                      >
                        삭제
                      </button>
                    </div>

                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'sales' && (
          <div style={styles.listContainer}>


            {escrows.length === 0 ? (
              <p style={styles.empty}>낙찰 이력이 없습니다.</p>
            ) : (
              escrows.map((sale, index) => {
                const ui = getEscrowStateUI(sale.escrowState);
                return (
                  <div key={sale.escrowId} style={{ ...styles.saleRow, borderTop: index > 0 ? '1px solid #1a1a26' : 'none', marginTop: index > 0 ? 16 : 0, paddingTop: index > 0 ? 32 : 16, cursor: isOwner ? 'pointer' : 'default' }} onClick={() => isOwner && setSelectedEscrowId(sale.escrowId!)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flex: 1 }}>
                      <div style={styles.saleIconCircle}>
                        <GiftIcon />
                      </div>

                      <div style={styles.saleInfoBlock}>
                        <span style={ui.badgeStyle}>{ui.label}</span>
                        <h4 style={styles.saleTitleLine}>{sale.itemName}</h4>
                        <p style={styles.saleDateLine}>{formatDate(sale.createdAt)}</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, width: 140 }}>
                      <span style={styles.salePriceText}>- {formatPrice(sale.amount)}</span>
                      <span style={styles.saleStatusText}>{ui.label}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h2 style={styles.modalTitle}>
              {modalMode === 'create' ? '공지사항 등록' : '공지사항 수정'}
            </h2>
            <input 
              style={styles.input}
              placeholder="제목을 입력하세요"
              value={noticeTitle}
              onChange={(e) => setNoticeTitle(e.target.value)}
            />
            <textarea 
              style={styles.textarea}
              placeholder="내용을 입력하세요"
              value={noticeContent}
              onChange={(e) => setNoticeContent(e.target.value)}
            />
            <div style={styles.modalBtnRow}>
              <button style={styles.btnCancel} onClick={() => setIsModalOpen(false)}>취소</button>
              <button style={styles.btnSubmit} onClick={handleSubmitNotice}>
                {modalMode === 'create' ? '등록' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedEscrowId !== null && escrowDetail && (
        <div style={styles.modalOverlay} onClick={() => setSelectedEscrowId(null)}>
          <div style={styles.escrowDetailModal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.escrowDetailTitle}>낙찰 상세</h2>
            
            <div style={styles.escrowProductBlock}>
              <img 
                src={escrowDetail.data.winningInfo.imageUrl || 'https://via.placeholder.com/150'} 
                alt="Product" 
                style={styles.escrowProductImage} 
              />
              <div style={styles.escrowProductInfo}>
                <div style={styles.escrowRowInfo}>
                  <span style={styles.escrowLabel}>상품명</span>
                  <span style={styles.escrowValue}>{escrowDetail.data.winningInfo.itemName}</span>
                </div>
                <div style={styles.escrowRowInfo}>
                  <span style={styles.escrowLabel}>낙찰가</span>
                  <span style={styles.escrowValueGold}>{formatPrice(escrowDetail.data.winningInfo.finalPrice)}</span>
                </div>
                <div style={styles.escrowRowInfo}>
                  <span style={styles.escrowLabel}>판매자</span>
                  <span style={styles.escrowValue}>{escrowDetail.data.winningInfo.sellerName}({escrowDetail.data.winningInfo.sellerId})</span>
                </div>
                <span style={styles.escrowDateStr}>{formatDate(escrowDetail.data.winningInfo.wonAt)}</span>
              </div>
            </div>

            <div style={styles.escrowInnerBox}>
              <div style={styles.escrowSectionTitleBlock}>
                <h3 style={styles.escrowSectionTitle}><TruckIcon /> 배송 조회</h3>
                {escrowDetail.data.delivery && (
                  <span style={styles.escrowTrackingText}>
                    {escrowDetail.data.delivery.courierName} {escrowDetail.data.delivery.trackingNumber}
                  </span>
                )}
              </div>
              <div style={styles.escrowInnerRow}><span style={styles.escrowInnerLeft}>남양주 물류 센터</span><span style={styles.escrowInnerRight}>집하</span></div>
              <div style={styles.escrowInnerRow}><span style={styles.escrowInnerLeft}>곤지암 센터</span><span style={styles.escrowInnerRight}>집하</span></div>
              <div style={styles.escrowInnerRow}><span style={styles.escrowInnerLeft}>대전 허브</span><span style={styles.escrowInnerRight}>집하</span></div>
              <div style={styles.escrowInnerRow}><span style={styles.escrowInnerLeft}>구미 물류센터</span><span style={styles.escrowInnerRight}>이동중</span></div>
            </div>

            <div style={styles.escrowInnerBox}>
              <div style={styles.escrowSectionTitleBlock}>
                <h3 style={styles.escrowSectionTitle}><TruckIcon /> 배송지 정보</h3>
              </div>
              <p style={styles.escrowInnerText}>{escrowDetail.data.shippingAddress.name}</p>
              <p style={styles.escrowInnerText}>{escrowDetail.data.shippingAddress.phone}</p>
              <p style={styles.escrowInnerText}>{escrowDetail.data.shippingAddress.postalCode}</p>
              <p style={styles.escrowInnerText}>{escrowDetail.data.shippingAddress.address} {escrowDetail.data.shippingAddress.addressDetail}</p>
            </div>

            <div style={styles.escrowCloseBtnBlock}>
              <button style={styles.escrowCloseBtn} onClick={() => setSelectedEscrowId(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


