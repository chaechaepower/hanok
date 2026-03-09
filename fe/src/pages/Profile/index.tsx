import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGetSellerProfile } from '@/api/hooks/useGetSellerProfile';
import { useGetSellerNotice } from '@/api/hooks/useGetSellerNotice';
import { usePostSellerNotice } from '@/api/hooks/usePostSellerNotice';
import { usePatchSellerNotice } from '@/api/hooks/usePatchSellerNotice';
import { useDeleteSellerNotice } from '@/api/hooks/useDeleteSellerNotice';
import { useGetSellerStatus } from '@/api/hooks/useGetSellerStatus';
import { useGetSellerReputation } from '@/api/hooks/useGetSellerReputation';
import { usePatchFollow } from '@/api/hooks/usePatchFollow';
import { useDeleteFollow } from '@/api/hooks/useDeleteFollow';
import { FaInstagram, FaYoutube, FaTiktok } from 'react-icons/fa';
import { FiBell, FiCalendar, FiClock, FiGift, FiTruck } from 'react-icons/fi';

const InstagramIcon = () => (
  <>
    <svg width="0" height="0">
      <linearGradient id="insta-grad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#f09433" />
        <stop offset="25%" stopColor="#e6683c" />
        <stop offset="50%" stopColor="#dc2743" />
        <stop offset="75%" stopColor="#cc2366" />
        <stop offset="100%" stopColor="#bc1888" />
      </linearGradient>
    </svg>
    <FaInstagram size={20} fill="url(#insta-grad)" />
  </>
);

const YoutubeIcon = () => <FaYoutube size={20} color="#FF0000" />;
const TiktokIcon = () => <FaTiktok size={20} color="#FFFFFF" />;

const BellIcon = () => <FiBell size={20} color="#D9B36D" />;
const CalendarIcon = () => <FiCalendar size={16} color="#888" />;
const HistoryIcon = () => <FiClock size={18} color="currentColor" />;
const GiftIcon = () => <FiGift size={32} color="#D9B36D" />;
const TruckIcon = () => <FiTruck size={24} color="#D9B36D" />;
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
      return { label: '배송중', badgeClass: 'self-start bg-[#1b4a3c] text-[#4ade80] px-2 py-1 text-[11px] font-bold rounded-[20px]' };
    case 'COMPLETED':
      return { label: '배송완료', badgeClass: 'self-start bg-[#183b5f] text-[#60a5fa] px-2 py-1 text-[11px] font-bold rounded-[20px]' };
    case 'CANCELLED':
      return { label: '취소됨', badgeClass: 'self-start bg-[#333] text-[#999] px-2 py-1 text-[11px] font-bold rounded-[20px]' };
    case 'DEPOSITED':
    default:
      return { label: '결제완료', badgeClass: 'self-start bg-[#3a2b16] text-[#d9b36d] px-2 py-1 text-[11px] font-bold rounded-[20px]' };
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
  const { data: reputationData } = useGetSellerReputation(sellerId);
  
  const { data: noticeData } = useGetSellerNotice(sellerId, { page: noticePage, limit: 10 });
  const { mutate: postNotice } = usePostSellerNotice(sellerId);
  const { mutate: patchNotice } = usePatchSellerNotice(sellerId);
  const { mutate: deleteNotice } = useDeleteSellerNotice(sellerId);

  const { mutate: patchFollow, isPending: isFollowPending } = usePatchFollow();
  const { mutate: deleteFollow, isPending: isUnfollowPending } = useDeleteFollow();

  const [isFollowing, setIsFollowing] = useState(false);

  const isOwner = mySellerStatus?.isSeller || true; 

  const handleFollowToggle = () => {
    if (isFollowing) {
      deleteFollow({ userId: sellerId }, {
        onSuccess: (res) => setIsFollowing(res.following)
      });
    } else {
      patchFollow({ userId: sellerId }, {
        onSuccess: (res) => setIsFollowing(res.following)
      });
    }
  };

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
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-[#333] border-t-[#d9b36d] rounded-full animate-spin" />
        <p className="text-[#aaa] mt-3">판매자 정보를 불러오는 중…</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-red-400 text-base">판매자 정보를 불러오지 못했습니다.</p>
      </div>
    );
  }

  const { nickname, intro, profile_image, instagramUrl, youtubeUrl, tiktokUrl } = data;
  const reputation = reputationData?.data;
  const notices = noticeData?.items || [];

  return (
    <div className="w-full box-border max-w-[1200px] mx-auto py-10 px-5 flex flex-col gap-8">
      <div className="w-full box-border border border-[#2e2e40] rounded-2xl py-11 px-14 bg-[#0c0c14]">
        <div className="flex items-start gap-10">
          <div>
            {profile_image ? (
              <img src={profile_image} alt={nickname} className="w-[140px] h-[140px] rounded-full object-cover" />
            ) : (
              <div className="w-[140px] h-[140px] rounded-full bg-[#1e1e2d] text-[#d9b36d] text-[48px] flex items-center justify-center font-bold">
                {nickname.charAt(0)}
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <h1 className="m-0 text-[26px] font-bold text-white">{nickname}상점</h1>
              <button 
                className={`py-2 px-[22px] rounded-3xl bg-white text-gray-900 text-sm font-bold border-none cursor-pointer ${(isFollowPending || isUnfollowPending) ? 'opacity-70' : 'opacity-100'}`}
                onClick={handleFollowToggle}
                disabled={isFollowPending || isUnfollowPending}
              >
                {isFollowing ? '언팔로우' : '팔로우'}
              </button>
              <div className="text-[15px] text-[#bbb] ml-2">
                팔로워 <strong className="text-white">{reputation?.followerCount ?? 0}</strong>
              </div>
              <div className="ml-auto flex gap-4">
                {/* TODO: 수정api연결 필요 */}
                <button className="border-none bg-transparent text-[#888] text-sm cursor-pointer">수정</button>
                <button className="border-none bg-transparent text-[#888] text-sm cursor-pointer">신고</button>
              </div>
            </div>

            <p className="m-0 text-[15px] text-[#ddd] leading-relaxed">{intro}</p>

            <div className="flex gap-5 mt-1">
              {instagramUrl && (
                <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-[6px] text-white no-underline text-base font-semibold">
                  <InstagramIcon />
                  <span>{instagramUrl.replace('https://instagram.com/', '@')}</span>
                </a>
              )}
              {youtubeUrl && (
                <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-[6px] text-white no-underline text-base font-semibold">
                  <YoutubeIcon />
                  <span>YouTube</span>
                </a>
              )}
              {tiktokUrl && (
                <a href={tiktokUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-[6px] text-white no-underline text-base font-semibold">
                  <TiktokIcon />
                  <span>TikTok</span>
                </a>
              )}
            </div>

            {isOwner && reputation?.totalTrades !== undefined && (
              <div className="mt-3 border border-[#2e2e40] rounded-xl py-6 flex items-center w-[420px]">
                <div className="flex-1 flex flex-col items-center gap-[6px]">
                  <span className="text-[22px] font-bold text-white">{reputation.totalTrades}</span>
                  <span className="text-[13px] text-[#888]">총 거래</span>
                </div>
                <div className="w-[1px] h-10 bg-[#2e2e40]" />
                <div className="flex-1 flex flex-col items-center gap-[6px]">
                  <span className="text-[22px] font-bold text-white">{reputation.cancelCount}</span>
                  <span className="text-[13px] text-[#888]">취소</span>
                </div>
                <div className="w-[1px] h-10 bg-[#2e2e40]" />
                <div className="flex-1 flex flex-col items-center gap-[6px]">
                  <span className="text-[22px] font-bold text-white">{reputation.completionRate}%</span>
                  <span className="text-[13px] text-[#888]">성사율</span>
                </div>
                <div className="w-[1px] h-10 bg-[#2e2e40]" />
                <div className="flex-1 flex flex-col items-center gap-[6px]">
                  <span className="text-[22px] font-bold text-white">{reputation.avgShipDays}일</span>
                  <span className="text-[13px] text-[#888]">평균 배송일</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-full box-border border border-[#2e2e40] rounded-2xl py-11 px-14 bg-[#0c0c14]">
        <div className="flex gap-6 border-b border-[#2e2e40] mb-8">
          <button
            className={`flex items-center gap-[6px] bg-transparent border-none border-b-2 px-2 pb-4 text-base font-bold cursor-pointer transition-colors duration-200 -mb-[1px] ${
              activeTab === 'posts' ? 'text-[#d9b36d] border-[#d9b36d]' : 'text-[#888] border-transparent'
            }`}
            onClick={() => setActiveTab('posts')}
          >
            # 공지사항
          </button>
          
          <button
            className={`flex items-center gap-[6px] bg-transparent border-none border-b-2 px-2 pb-4 text-base font-bold cursor-pointer transition-colors duration-200 -mb-[1px] ${
              activeTab === 'sales' ? 'text-[#d9b36d] border-[#d9b36d]' : 'text-[#888] border-transparent'
            }`}
            onClick={() => setActiveTab('sales')}
          >
            <HistoryIcon />
            낙찰 이력
          </button>
        </div>

        {activeTab === 'posts' && (
          <div className="flex flex-col gap-5">
            <div className="flex justify-end mb-2">
              <button className="py-2 px-4 bg-[#d9b36d] text-[#111] border-none rounded-lg font-bold text-sm cursor-pointer" onClick={handleOpenCreateModal}>
                공지사항 등록
              </button>
            </div>
            {notices.length === 0 ? (
              <p className="text-center text-[#888] py-[60px] text-[15px]">등록된 공지사항이 없습니다.</p>
            ) : (
              notices.map((post) => (
                <div key={post.postId} className="border border-[#2e2e40] rounded-xl py-7 px-8 bg-[#0f0f16] flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-[10px]">
                        <BellIcon />
                        <h3 className="m-0 text-lg font-bold text-white">{post.title}</h3>
                      </div>
                      <p className="m-0 mt-1 ml-[30px] text-sm text-[#aaa] leading-relaxed">{post.content}</p>
                      <div className="flex items-center gap-[6px] mt-2 ml-[30px]">
                        <CalendarIcon />
                        <span className="text-[13px] text-[#666]">{formatDate(post.createdAt).split(' ')[0]}</span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        className="bg-transparent border-none text-[#888] text-[13px] cursor-pointer underline" 
                        onClick={() => handleOpenEditModal(post.postId, post.title, post.content)}
                      >
                        수정
                      </button>
                      <button 
                        className="bg-transparent border-none text-red-400 text-[13px] cursor-pointer underline" 
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
          <div className="flex flex-col gap-5">


            {escrows.length === 0 ? (
              <p className="text-center text-[#888] py-[60px] text-[15px]">낙찰 이력이 없습니다.</p>
            ) : (
              escrows.map((sale, index) => {
                const ui = getEscrowStateUI(sale.escrowState);
                return (
                  <div key={sale.escrowId} className={`flex py-4 items-center justify-between ${index > 0 ? 'border-t border-[#1a1a26] mt-4 pt-8' : ''} ${isOwner ? 'cursor-pointer' : 'cursor-default'}`} onClick={() => isOwner && setSelectedEscrowId(sale.escrowId!)}>
                    <div className="flex items-center gap-6 flex-1">
                      <div className="w-16 h-16 rounded-full bg-[#1c1c28] border-[1.5px] border-[#d9b36d] flex items-center justify-center">
                        <GiftIcon />
                      </div>

                      <div className="flex flex-col gap-[6px]">
                        <span className={ui.badgeClass}>{ui.label}</span>
                        <h4 className="m-0 mt-[2px] text-base font-bold text-white">{sale.itemName}</h4>
                        <p className="m-0 text-[13px] text-[#888]">{formatDate(sale.createdAt)}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-[6px] w-[140px]">
                      <span className="text-base font-bold text-white">- {formatPrice(sale.amount)}</span>
                      <span className="text-[13px] text-[#888]">{ui.label}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/70 z-[999] flex items-center justify-center">
          <div className="bg-[#1a1a28] border border-[#2e2e40] rounded-2xl w-[500px] p-8 flex flex-col gap-5 shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
            <h2 className="m-0 text-white text-xl font-bold">
              {modalMode === 'create' ? '공지사항 등록' : '공지사항 수정'}
            </h2>
            <input 
              className="w-full box-border bg-[#0f0f16] text-white border border-[#2e2e40] rounded-lg p-[14px] text-[15px]"
              placeholder="제목을 입력하세요"
              value={noticeTitle}
              onChange={(e) => setNoticeTitle(e.target.value)}
            />
            <textarea 
              className="w-full box-border bg-[#0f0f16] text-white border border-[#2e2e40] rounded-lg p-[14px] text-[15px] min-h-[140px] resize-none"
              placeholder="내용을 입력하세요"
              value={noticeContent}
              onChange={(e) => setNoticeContent(e.target.value)}
            />
            <div className="flex justify-end gap-3 mt-[10px]">
              <button className="py-[10px] px-6 bg-[#333] text-[#ddd] border-none rounded-lg cursor-pointer text-sm font-semibold" onClick={() => setIsModalOpen(false)}>취소</button>
              <button className="py-[10px] px-6 bg-[#d9b36d] text-[#111] font-bold border-none rounded-lg cursor-pointer text-sm" onClick={handleSubmitNotice}>
                {modalMode === 'create' ? '등록' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedEscrowId !== null && escrowDetail && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/70 z-[999] flex items-center justify-center" onClick={() => setSelectedEscrowId(null)}>
          <div className="bg-[#0c0c14] border border-[#2e2e40] rounded-2xl w-[480px] py-9 px-10 flex flex-col gap-8 shadow-[0_8px_30px_rgba(0,0,0,0.5)]" onClick={(e) => e.stopPropagation()}>
            <h2 className="m-0 text-white text-[22px] font-bold">낙찰 상세</h2>
            
            <div className="flex gap-6 items-stretch">
              <img 
                src={escrowDetail.data.winningInfo.imageUrl || 'https://via.placeholder.com/150'} 
                alt="Product" 
                className="w-[140px] h-[140px] rounded-xl object-cover bg-white" 
              />
              <div className="flex-1 flex flex-col justify-center gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-[15px] text-[#ccc] font-medium">상품명</span>
                  <span className="text-base text-white font-bold">{escrowDetail.data.winningInfo.itemName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[15px] text-[#ccc] font-medium">낙찰가</span>
                  <span className="text-base text-[#d9b36d] font-bold">{formatPrice(escrowDetail.data.winningInfo.finalPrice)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[15px] text-[#ccc] font-medium">판매자</span>
                  <span className="text-base text-white font-bold">{escrowDetail.data.winningInfo.sellerName}({escrowDetail.data.winningInfo.sellerId})</span>
                </div>
                <span className="mt-auto self-start text-sm text-[#888]">{formatDate(escrowDetail.data.winningInfo.wonAt)}</span>
              </div>
            </div>

            <div className="border border-[#2e2e40] rounded-xl py-5 px-6 flex flex-col gap-3">
              <div className="flex justify-between items-center mb-3">
                <h3 className="flex items-center gap-2 text-lg font-bold text-white m-0"><TruckIcon /> 배송 조회</h3>
                {escrowDetail.data.delivery && (
                  <span className="text-sm text-[#d9b36d] underline">
                    {escrowDetail.data.delivery.courierName} {escrowDetail.data.delivery.trackingNumber}
                  </span>
                )}
              </div>
              <div className="flex justify-between text-[15px]"><span className="text-[#ccc]">남양주 물류 센터</span><span className="text-white">집하</span></div>
              <div className="flex justify-between text-[15px]"><span className="text-[#ccc]">곤지암 센터</span><span className="text-white">집하</span></div>
              <div className="flex justify-between text-[15px]"><span className="text-[#ccc]">대전 허브</span><span className="text-white">집하</span></div>
              <div className="flex justify-between text-[15px]"><span className="text-[#ccc]">구미 물류센터</span><span className="text-white">이동중</span></div>
            </div>

            <div className="border border-[#2e2e40] rounded-xl py-5 px-6 flex flex-col gap-3">
              <div className="flex justify-between items-center mb-3">
                <h3 className="flex items-center gap-2 text-lg font-bold text-white m-0"><TruckIcon /> 배송지 정보</h3>
              </div>
              <p className="m-0 text-[15px] text-[#ccc] leading-relaxed">{escrowDetail.data.shippingAddress.name}</p>
              <p className="m-0 text-[15px] text-[#ccc] leading-relaxed">{escrowDetail.data.shippingAddress.phone}</p>
              <p className="m-0 text-[15px] text-[#ccc] leading-relaxed">{escrowDetail.data.shippingAddress.postalCode}</p>
              <p className="m-0 text-[15px] text-[#ccc] leading-relaxed">{escrowDetail.data.shippingAddress.address} {escrowDetail.data.shippingAddress.addressDetail}</p>
            </div>

            <div className="flex justify-center mt-2">
              <button className="py-3 px-12 bg-[#f5f5f5] text-[#111] border-none rounded-[24px] text-base font-bold cursor-pointer" onClick={() => setSelectedEscrowId(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
