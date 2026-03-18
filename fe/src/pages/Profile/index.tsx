import { useState, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from '@/components/common/Toast';
import { useGetSellerProfile } from '@/api/hooks/useGetSellerProfile';
import { useGetSellerNotice } from '@/api/hooks/useGetSellerNotice';
import { usePostSellerNotice } from '@/api/hooks/usePostSellerNotice';
import { usePatchSellerNotice } from '@/api/hooks/usePatchSellerNotice';
import { useDeleteSellerNotice } from '@/api/hooks/useDeleteSellerNotice';
import { useGetSellerNoticeDetail } from '@/api/hooks/useGetSellerNoticeDetail';
import { useGetSellerStatus } from '@/api/hooks/useGetSellerStatus';
import { useGetMe } from '@/api/hooks/useGetMe';
import { usePostFollow } from '@/api/hooks/usePostFollow';
import { useGetFollowedStores } from '@/api/hooks/useGetFollowedStores';
import { FaInstagram, FaYoutube, FaTiktok } from 'react-icons/fa';
import ReportModal from '@/components/Profile/ReportModal';
import { useGetSoldAuctions } from '@/api/hooks/useGetSoldAuctions';
import { usePatchSellerProfile } from '@/api/hooks/usePatchSellerProfile';
import { usePatchProfileImage } from '@/api/hooks/usePatchProfileImage';
import type { EscrowState, ScheduledStream } from '@/types';
import { FiBell, FiCalendar, FiClock, FiGift, FiEdit2, FiX, FiCamera, FiTv, FiChevronDown } from 'react-icons/fi';
import { useGetScheduledStreams } from '@/api/hooks/useGetScheduledStreams';
import React from 'react';

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

const BellIcon = () => <FiBell size={20} className="text-gold-light" />;
const CalendarIcon = () => <FiCalendar size={16} className="text-neutral-600" />;
const HistoryIcon = () => <FiClock size={18} color="currentColor" />;
const GiftIcon = () => <FiGift size={32} className="text-gold-light" />;

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
      return {
        label: '배송중',
        badgeClass: 'self-start badge badge-ember-outline',
      };
    case 'COMPLETED':
      return {
        label: '배송완료',
        badgeClass: 'self-start badge badge-primary-outline',
      };
    case 'CANCELLED':
      return {
        label: '취소됨',
        badgeClass: 'self-start badge badge-neutral',
      };
    case 'DEPOSITED':
    default:
      return {
        label: '결제완료',
        badgeClass: 'self-start badge badge-gold-outline',
      };
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

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    nickname: '',
    intro: '',
    instaUrl: '',
    youtubeUrl: '',
    tiktokUrl: '',
  });

  const { data: soldAuctions = [] } = useGetSoldAuctions(sellerId);

  const { data, isLoading, isError } = useGetSellerProfile(sellerId);
  const { data: mySellerStatus } = useGetSellerStatus();
  const { data: meData } = useGetMe();
  const { mutate: patchProfile, isPending: isProfilePending } = usePatchSellerProfile(sellerId);
  const { mutate: patchProfileImage } = usePatchProfileImage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProfileImageClick = () => {
    if (isMyProfile) fileInputRef.current?.click();
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    patchProfileImage(file, {
      onSuccess: () => {
        showToast({ message: '프로필 이미지가 변경되었습니다.' });
      },
      onError: () => {
        showToast({ message: '프로필 이미지 변경에 실패했습니다.' });
      },
    });
  };

  const { data: notices = [] } = useGetSellerNotice(sellerId);
  const { mutate: postNotice } = usePostSellerNotice(sellerId);
  const { mutate: patchNotice } = usePatchSellerNotice(sellerId);
  const { mutate: deleteNotice } = useDeleteSellerNotice(sellerId);

  const [viewNoticeId, setViewNoticeId] = useState<number | null>(null);
  const { data: noticeDetail } = useGetSellerNoticeDetail(sellerId, viewNoticeId);

  const [selectedStream, setSelectedStream] = useState<ScheduledStream | null>(null);
  const [streamDropdownOpen, setStreamDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!streamDropdownOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setStreamDropdownOpen(false);
    };
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setStreamDropdownOpen(false);
      }
    };
    document.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [streamDropdownOpen]);
  const { data: scheduledStreamsData } = useGetScheduledStreams(0, 50);

  const { mutate: postFollow, isPending: isFollowPending } = usePostFollow();
  const { data: followedData } = useGetFollowedStores();

  const { showToast } = useToast();

  const initialFollowing = useMemo(() => {
    if (!followedData?.pages) return false;
    return followedData.pages.some((page) => page.content.some((item) => item.seller.sellerId === sellerId));
  }, [followedData, sellerId]);

  const [isFollowing, setIsFollowing] = useState(false);
  const [followInitialized, setFollowInitialized] = useState(false);

  React.useEffect(() => {
    if (!followInitialized && followedData) {
      setIsFollowing(initialFollowing);
      setFollowInitialized(true);
    }
  }, [initialFollowing, followedData, followInitialized]);

  const mySellerId = meData?.sellerId ?? mySellerStatus?.sellerId ?? null;
  const isMyProfile = mySellerId != null && mySellerId === sellerId;
  const isOwner = mySellerStatus?.isSeller || true;

  const handleFollowToggle = () => {
    postFollow(
      { targetSellerId: sellerId },
      {
        onSuccess: (res) => setIsFollowing(res.following),
      },
    );
  };

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setNoticeTitle('');
    setNoticeContent('');
    setSelectedStream(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (postId: number, title: string, content: string) => {
    setModalMode('edit');
    setEditPostId(postId);
    setNoticeTitle(title);

    const streamMatch = content.match(/\[방송 안내\]\s*([\s\S]+)$/);
    if (streamMatch) {
      setNoticeContent(content.slice(0, content.indexOf('[방송 안내]')).trim());
      const infoText = streamMatch[1].trim();
      const matched = scheduledStreamsData?.streams.find((s) => infoText.includes(s.title)) ?? null;
      setSelectedStream(matched);
    } else {
      setNoticeContent(content);
      setSelectedStream(null);
    }

    setIsModalOpen(true);
  };

  const handleOpenProfileEdit = () => {
    if (!data) return;
    setProfileForm({
      nickname: data.nickname,
      intro: data.intro,
      instaUrl: data.instagramUrl ?? '',
      youtubeUrl: data.youtubeUrl ?? '',
      tiktokUrl: data.tiktokUrl ?? '',
    });
    setIsProfileEditOpen(true);
  };

  const handleSubmitProfileEdit = () => {
    if (!profileForm.nickname.trim()) {
      showToast({ message: '닉네임을 입력해주세요.' });
      return;
    }
    patchProfile(profileForm, {
      onSuccess: () => {
        setIsProfileEditOpen(false);
        showToast({ message: '프로필이 수정되었습니다.' });
      },
      onError: () => {
        showToast({ message: '프로필 수정에 실패했습니다.' });
      },
    });
  };

  const handleDeleteNotice = (postId: number) => {
    if (confirm('공지사항을 정말 삭제하시겠습니까?')) {
      deleteNotice(postId);
    }
  };

  const buildNoticeContent = () => {
    let content = noticeContent;
    if (selectedStream) {
      const dateStr = selectedStream.scheduledAt
        ? new Date(selectedStream.scheduledAt).toLocaleDateString('ko-KR', {
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : '';
      content += `\n\n[방송 안내] ${selectedStream.title}${dateStr ? ` (${dateStr})` : ''}`;
    }
    return content;
  };

  const handleSubmitNotice = () => {
    if (!noticeTitle.trim() || !noticeContent.trim()) {
      showToast({ message: '제목과 내용을 모두 입력해주세요.' });
      return;
    }
    const finalContent = buildNoticeContent();
    if (modalMode === 'create') {
      postNotice({ title: noticeTitle, content: finalContent }, { onSuccess: () => setIsModalOpen(false) });
    } else if (modalMode === 'edit' && editPostId) {
      patchNotice(
        { noticeId: editPostId, payload: { title: noticeTitle, content: finalContent } },
        { onSuccess: () => setIsModalOpen(false) },
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-neutral-700 border-t-gold-light rounded-full animate-spin" />
        <p className="text-neutral-400 mt-3">판매자 정보를 불러오는 중…</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-accent-light text-base">판매자 정보를 불러오지 못했습니다.</p>
      </div>
    );
  }

  const { nickname, intro, profileImage, instagramUrl, youtubeUrl, tiktokUrl } = data;

  return (
    <div className="w-full box-border max-w-[1200px] mx-auto py-10 px-5 flex flex-col gap-8">
      <div className="w-full box-border border border-gold-light/30 rounded-2xl py-12 px-12 bg-surface">
        <div className="flex items-center justify-between gap-12">
          {/* 좌측: 프로필 이미지 + 정보 */}
          <div className="flex items-center gap-8 flex-1 min-w-0">
            <div className={`relative group ${isMyProfile ? 'cursor-pointer' : ''}`} onClick={handleProfileImageClick}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProfileImageChange}
              />
              {profileImage ? (
                <>
                  <img
                    src={profileImage}
                    alt={nickname}
                    className="w-[120px] h-[120px] min-w-[120px] min-h-[120px] flex-shrink-0 rounded-full object-contain object-center bg-surface"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      (e.target as HTMLImageElement).nextElementSibling?.classList.add('flex');
                    }}
                  />
                  <div className="hidden w-[120px] h-[120px] min-w-[120px] min-h-[120px] flex-shrink-0 rounded-full bg-surface text-gold-light text-[44px] items-center justify-center font-bold">
                    {nickname.charAt(0)}
                  </div>
                </>
              ) : (
                <div className="w-[120px] h-[120px] min-w-[120px] min-h-[120px] flex-shrink-0 rounded-full bg-surface text-gold-light text-[44px] flex items-center justify-center font-bold">
                  {nickname.charAt(0)}
                </div>
              )}
              {isMyProfile && (
                <div className="absolute inset-0 w-[120px] h-[120px] rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <FiCamera size={24} className="text-white" />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 min-w-0">
              <h2 className="m-0 text-neutral-100">{nickname}상점</h2>
              <p className="m-0 text-body-lg text-neutral-300 leading-relaxed">{intro}</p>

              <div className="flex gap-2 mt-1">
                {instagramUrl && (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
                    title="Instagram"
                  >
                    <InstagramIcon />
                  </a>
                )}
                {youtubeUrl && (
                  <a
                    href={youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
                    title="YouTube"
                  >
                    <YoutubeIcon />
                  </a>
                )}
                {tiktokUrl && (
                  <a
                    href={tiktokUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
                    title="TikTok"
                  >
                    <TiktokIcon />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* 우측: 수정/신고 + 통계 + 팔로우 */}
          <div className="flex flex-col items-center gap-2 shrink-0 -mt-4">
            {isMyProfile && (
              <button
                onClick={handleOpenProfileEdit}
                className="self-end border-none bg-transparent text-neutral-500 text-body-sm cursor-pointer rounded-lg px-3 py-1 hover:bg-white/5 hover:text-neutral-200 transition-colors"
              >
                수정
              </button>
            )}
            {!isMyProfile && (
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="self-end border-none bg-transparent text-neutral-600 text-body-sm cursor-pointer rounded-lg px-3 py-1 hover:bg-white/5 hover:text-neutral-400 transition-colors"
              >
                신고
              </button>
            )}

            {isOwner && data?.stats !== undefined && (
              <div className="grid grid-cols-3 gap-[1px] bg-neutral-800 border border-white/5 rounded-xl overflow-hidden">
                <div className="flex flex-col items-center gap-2 py-5 px-8 bg-surface-elevated">
                  <span className="text-subtitle-sm text-neutral-500">팔로워</span>
                  <span className="text-price-lg text-white">{data.stats.followerCount ?? '-'}</span>
                </div>
                <div className="flex flex-col items-center gap-2 py-5 px-8 bg-surface-elevated">
                  <span className="text-subtitle-sm text-neutral-500">평점</span>
                  <span className="text-price-lg text-white">{data.stats.rating ?? '-'}</span>
                </div>
                <div className="flex flex-col items-center gap-2 py-5 px-8 bg-surface-elevated">
                  <span className="text-subtitle-sm text-neutral-500">평균 배송</span>
                  <span className="text-price-lg text-white">
                    {data.stats.avgShipDays != null ? `${data.stats.avgShipDays}일` : '-'}
                  </span>
                </div>
              </div>
            )}

            {!isMyProfile && (
              <button
                className={`w-full py-3 rounded-xl bg-neutral-100 text-background text-subtitle-sm border-none cursor-pointer hover:bg-neutral-200 transition-colors ${isFollowPending ? 'opacity-70' : 'opacity-100'}`}
                onClick={handleFollowToggle}
                disabled={isFollowPending}
              >
                {isFollowing ? '언팔로우' : '팔로우'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="w-full box-border border border-gold-light/30 rounded-2xl py-11 px-14 bg-surface min-h-[calc(100vh-320px)]">
        <div className="flex items-center gap-6 border-b border-white/5 mb-8">
          <button
            className={`flex items-center gap-2 bg-transparent border-0 border-solid border-b-2 px-2 pb-4 text-subtitle-lg cursor-pointer transition-colors duration-200 -mb-[1px] relative z-10 ${
              activeTab === 'posts' ? 'text-gold-light border-gold-light' : 'text-neutral-600 border-transparent'
            }`}
            onClick={() => setActiveTab('posts')}
          >
            # 공지사항
          </button>

          <button
            className={`flex items-center gap-2 bg-transparent border-0 border-solid border-b-2 px-2 pb-4 text-subtitle-lg cursor-pointer transition-colors duration-200 -mb-[1px] relative z-10 ${
              activeTab === 'sales' ? 'text-gold-light border-gold-light' : 'text-neutral-600 border-transparent'
            }`}
            onClick={() => setActiveTab('sales')}
          >
            <HistoryIcon />
            판매 내역
          </button>

          {isMyProfile && activeTab === 'posts' ? (
            <button
              className="ml-auto bg-transparent text-gold-light border-none cursor-pointer rounded-lg w-8 h-8 flex items-center justify-center hover:bg-white/5 transition-colors -mb-[1px]"
              onClick={handleOpenCreateModal}
              aria-label="공지사항 등록"
            >
              <FiEdit2 size={18} />
            </button>
          ) : null}
        </div>

        {activeTab === 'posts' && (
          <div className="flex flex-col gap-5">
            {notices.length === 0 ? (
              <p className="text-center text-neutral-600 py-16 text-subtitle-lg">등록된 공지사항이 없습니다.</p>
            ) : (
              notices.map((post) => {
                const streamMatch = post.content.match(/\[방송 안내\]\s*([\s\S]+)$/);
                const mainContent = streamMatch
                  ? post.content.slice(0, post.content.indexOf('[방송 안내]')).trim()
                  : post.content;
                const streamInfo = streamMatch ? streamMatch[1].trim() : null;

                return (
                  <div
                    key={post.noticeId}
                    className="border border-white/[0.06] rounded-xl py-7 px-8 bg-white/[0.02] flex flex-col gap-3 cursor-pointer hover:border-gold-light/40 transition-colors"
                    onClick={() => setViewNoticeId(post.noticeId)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <BellIcon />
                          <h3 className="m-0 text-neutral-100">{post.title}</h3>
                        </div>
                        {mainContent && (
                          <p className="m-0 mt-1 ml-8 text-body-md text-neutral-400 leading-relaxed">{mainContent}</p>
                        )}
                        {streamInfo && (
                          <p className="m-0 mt-1 ml-8 text-body-md text-neutral-400 leading-relaxed">{streamInfo}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 ml-8">
                          <CalendarIcon />
                          <span className="text-body-md text-neutral-600">
                            {formatDate(post.createdAt).split(' ')[0]}
                          </span>
                        </div>
                      </div>
                      {isMyProfile && (
                        <div className="flex gap-3">
                          <button
                            className="bg-transparent border-none text-neutral-500 text-body-md cursor-pointer rounded-md px-2 py-1 hover:bg-white/5 hover:text-neutral-200 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditModal(post.noticeId, post.title, post.content);
                            }}
                          >
                            수정
                          </button>
                          <button
                            className="bg-transparent border-none text-accent-light/70 text-body-md cursor-pointer rounded-md px-2 py-1 hover:bg-accent/10 hover:text-accent-light transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNotice(post.noticeId);
                            }}
                          >
                            삭제
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'sales' && (
          <div className="flex flex-col gap-5">
            {soldAuctions.length === 0 ? (
              <p className="text-center text-neutral-600 py-16 text-subtitle-lg">낙찰 이력이 없습니다.</p>
            ) : (
              soldAuctions.map((sale, index) => {
                const ui = getEscrowStateUI(sale.escrowStatus);
                return (
                  <div
                    key={sale.itemName}
                    className={`flex py-4 items-center justify-between ${index > 0 ? 'border-t border-neutral-800 mt-4 pt-8' : ''}`}
                  >
                    <div className="flex items-center gap-6 flex-1">
                      <div className="w-16 h-16 rounded-full bg-surface border-[1.5px] border-gold-light flex items-center justify-center overflow-hidden">
                        {sale.image ? (
                          <img src={sale.image} alt={sale.itemName} className="w-full h-full object-cover" />
                        ) : (
                          <GiftIcon />
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <span className={ui.badgeClass}>{ui.label}</span>
                        <h4 className="m-0 mt-1 text-neutral-100">{sale.itemName}</h4>
                        <p className="m-0 text-body-md text-neutral-600">{formatDate(sale.createdAt)}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 w-[140px]">
                      <span className="text-price-sm text-white">+ {formatPrice(sale.amount)}</span>
                      <span className="text-body-md text-neutral-600">{ui.label}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/90 z-[999] flex items-center justify-center backdrop-blur-sm">
          <div className="bg-surface border border-neutral-800 rounded-2xl w-[600px] p-10 flex flex-col gap-6 shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
            <h2 className="m-0 text-neutral-100">{modalMode === 'create' ? '공지사항 등록' : '공지사항 수정'}</h2>
            <input
              className="w-full box-border bg-background text-white border border-neutral-800 rounded-lg p-4 text-subtitle-lg outline-none focus:border-gold-light transition-colors"
              placeholder="제목을 입력하세요"
              value={noticeTitle}
              onChange={(e) => setNoticeTitle(e.target.value)}
            />
            <textarea
              className="w-full box-border bg-background text-white border border-neutral-800 rounded-lg p-4 text-subtitle-lg min-h-[140px] resize-none outline-none focus:border-gold-light transition-colors"
              placeholder="내용을 입력하세요"
              value={noticeContent}
              onChange={(e) => setNoticeContent(e.target.value)}
            />

            {scheduledStreamsData?.streams && scheduledStreamsData.streams.length > 0 && (
              <div className="flex flex-col gap-2">
                <label className="text-subtitle-md text-neutral-400 font-medium flex items-center gap-2">
                  <FiTv size={14} className="text-gold-light" />
                  예약된 방송 연결 (선택)
                </label>
                {selectedStream ? (
                  <div className="flex items-center gap-2 bg-background border border-gold-light/30 rounded-lg px-4 py-3">
                    <FiTv size={14} className="text-gold-light" />
                    <span className="text-subtitle-md text-gold-light font-medium">{selectedStream.title}</span>
                    <button
                      type="button"
                      className="ml-auto bg-transparent border-none text-neutral-600 cursor-pointer hover:text-white"
                      onClick={() => setSelectedStream(null)}
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setStreamDropdownOpen(!streamDropdownOpen)}
                      className="w-full box-border bg-background text-neutral-500 border border-neutral-800 rounded-lg p-4 text-subtitle-lg outline-none cursor-pointer flex items-center justify-between hover:border-neutral-700 transition-colors"
                    >
                      <span>방송을 선택하세요</span>
                      <FiChevronDown
                        size={16}
                        className={`text-neutral-500 transition-transform ${streamDropdownOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {streamDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-surface-elevated border border-neutral-800 rounded-lg overflow-hidden z-10 shadow-[0_4px_20px_rgba(0,0,0,0.4)] max-h-[200px] overflow-y-auto custom-scrollbar">
                        {scheduledStreamsData.streams.map((stream) => (
                          <button
                            key={stream.streamId}
                            type="button"
                            onClick={() => {
                              setSelectedStream(stream);
                              setStreamDropdownOpen(false);
                            }}
                            className="w-full text-left bg-transparent border-none px-4 py-3 text-body-md text-neutral-200 cursor-pointer hover:bg-white/5 transition-colors flex flex-col gap-1"
                          >
                            <span className="text-subtitle-md text-neutral-100">{stream.title}</span>
                            <span className="text-body-sm text-neutral-500">
                              {stream.scheduledAt
                                ? new Date(stream.scheduledAt).toLocaleDateString('ko-KR', {
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : ''}
                              {` · ${stream.category}`}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-4 mt-4">
              <button
                className="py-3 px-8 bg-neutral-700 text-neutral-200 border-none rounded-lg cursor-pointer text-subtitle-sm hover:bg-neutral-600 transition-colors"
                onClick={() => setIsModalOpen(false)}
              >
                취소
              </button>
              <button
                className="py-3 px-8 bg-gold-light text-background font-bold border-none rounded-lg cursor-pointer text-subtitle-sm hover:bg-gold-dark transition-colors"
                onClick={handleSubmitNotice}
              >
                {modalMode === 'create' ? '등록' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewNoticeId !== null && noticeDetail && (
        <div
          className="fixed top-0 left-0 w-full h-full bg-black/90 z-[999] flex items-center justify-center backdrop-blur-sm"
          onClick={() => setViewNoticeId(null)}
        >
          <div
            className="bg-surface border border-neutral-800 rounded-2xl w-[600px] p-10 flex flex-col gap-6 shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BellIcon />
                <h2 className="m-0 text-neutral-100">{noticeDetail.title}</h2>
              </div>
              <button
                onClick={() => setViewNoticeId(null)}
                className="bg-transparent border-none text-neutral-600 cursor-pointer hover:text-white transition-colors"
              >
                <FiX size={22} />
              </button>
            </div>

            <p className="m-0 text-subtitle-lg text-neutral-200 leading-relaxed whitespace-pre-wrap">
              {noticeDetail.content}
            </p>

            <div className="flex items-center gap-4 text-body-md text-neutral-600 border-t border-white/5 pt-4">
              <div className="flex items-center gap-2">
                <CalendarIcon />
                <span>작성일 {formatDate(noticeDetail.createdAt).split(' ')[0]}</span>
              </div>
              {noticeDetail.updatedAt && noticeDetail.updatedAt !== noticeDetail.createdAt && (
                <div className="flex items-center gap-2">
                  <CalendarIcon />
                  <span>수정일 {formatDate(noticeDetail.updatedAt).split(' ')[0]}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setViewNoticeId(null)}
                className="py-3 px-8 bg-neutral-700 text-neutral-200 border-none rounded-lg cursor-pointer text-subtitle-sm hover:bg-neutral-600 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {isProfileEditOpen && (
        <div
          className="fixed top-0 left-0 w-full h-full bg-black/90 z-[999] flex items-center justify-center backdrop-blur-sm"
          onClick={() => setIsProfileEditOpen(false)}
        >
          <div
            className="bg-surface border border-neutral-800 rounded-2xl w-[600px] p-10 flex flex-col gap-6 shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="m-0 text-neutral-100">프로필 수정</h2>

            <div className="flex flex-col gap-2">
              <label className="text-body-lg text-neutral-400 font-medium">닉네임</label>
              <input
                className="w-full box-border bg-background text-white border border-neutral-800 rounded-lg px-4 py-3 text-subtitle-lg outline-none focus:border-gold-light transition-colors"
                value={profileForm.nickname}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, nickname: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-body-lg text-neutral-400 font-medium">소개</label>
              <textarea
                className="w-full box-border bg-background text-white border border-neutral-800 rounded-lg px-4 py-3 text-subtitle-lg outline-none focus:border-gold-light transition-colors min-h-[100px] resize-none"
                value={profileForm.intro}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, intro: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-body-lg text-neutral-400 font-medium">Instagram URL</label>
              <input
                className="w-full box-border bg-background text-white border border-neutral-800 rounded-lg px-4 py-3 text-subtitle-lg outline-none focus:border-gold-light transition-colors"
                placeholder="https://instagram.com/..."
                value={profileForm.instaUrl}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, instaUrl: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-body-lg text-neutral-400 font-medium">YouTube URL</label>
              <input
                className="w-full box-border bg-background text-white border border-neutral-800 rounded-lg px-4 py-3 text-subtitle-lg outline-none focus:border-gold-light transition-colors"
                placeholder="https://youtube.com/..."
                value={profileForm.youtubeUrl}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, youtubeUrl: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-body-lg text-neutral-400 font-medium">TikTok URL</label>
              <input
                className="w-full box-border bg-background text-white border border-neutral-800 rounded-lg px-4 py-3 text-subtitle-lg outline-none focus:border-gold-light transition-colors"
                placeholder="https://tiktok.com/..."
                value={profileForm.tiktokUrl}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, tiktokUrl: e.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-4 mt-4">
              <button
                className="py-3 px-8 bg-neutral-700 text-neutral-200 border-none rounded-lg cursor-pointer text-subtitle-sm hover:bg-neutral-600 transition-colors"
                onClick={() => setIsProfileEditOpen(false)}
              >
                취소
              </button>
              <button
                className="py-3 px-8 bg-gold-light text-background font-bold border-none rounded-lg cursor-pointer text-subtitle-sm hover:bg-gold-dark transition-colors disabled:opacity-50"
                onClick={handleSubmitProfileEdit}
                disabled={isProfilePending}
              >
                {isProfilePending ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isReportModalOpen && (
        <ReportModal
          sellerNickname={nickname}
          onClose={() => setIsReportModalOpen(false)}
          onSubmit={(reportData) => {
            // TODO: 신고 API 연결
            console.log('신고 데이터:', reportData);
            showToast({ message: '신고가 접수되었습니다.' });
            setIsReportModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
