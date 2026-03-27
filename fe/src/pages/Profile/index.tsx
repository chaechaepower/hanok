import { useState, useRef, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useGetSellerProfile } from '@/api/hooks/useGetSellerProfile';
import { useGetSellerReputation } from '@/api/hooks/useGetSellerReputation';
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
import NoticeList from '@/components/Profile/NoticeList';
import ProfileEditModal, { type ProfileFormState } from '@/components/Profile/ProfileEditModal';
import ReportModal from '@/components/Profile/ReportModal';
import InfoPanelTooltip from '@/components/common/InfoPanelTooltip';
import ConfirmModal from '@/components/common/modal/ConfirmModal';
import { useGetSoldAuctions } from '@/api/hooks/useGetSoldAuctions';
import { usePatchSellerProfile } from '@/api/hooks/usePatchSellerProfile';
import { usePatchProfileImage } from '@/api/hooks/usePatchProfileImage';
import type { ScheduledStream } from '@/types';
import { formatPrice } from '@/utils/formatPrice';
import { getEscrowStateUI } from '@/utils/getEscrowStateUI';
import { getUploadErrorMessage } from '@/utils/getUploadErrorMessage';
import { FiBell, FiCalendar, FiClock, FiGift, FiEdit2, FiX, FiCamera, FiTv, FiChevronDown } from 'react-icons/fi';
import { useGetScheduledStreams } from '@/api/hooks/useGetScheduledStreams';
import React from 'react';
import { useToast } from '@/hooks/useToast';
import { getCategoryLabel } from '@/constants/category';
import { formatDateTime, formatScheduledDateTime } from '@/utils/formatDateTime';

const SOCIAL_PREFIX = {
  instagram: 'https://www.instagram.com/',
  youtube: 'https://www.youtube.com/@',
  tiktok: 'https://www.tiktok.com/@',
} as const;

const stripPrefix = (url: string) => {
  if (!url) return '';
  const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:instagram|youtube|tiktok)\.com\/@?(.+)/i);
  return match ? match[1] : url;
};

const addPrefix = (handle: string, prefix: string) => (handle.trim() ? `${prefix}${handle.trim()}` : '');

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
const formatDate = formatDateTime;

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const sellerId = Number(id);
  const [activeTab, setActiveTab] = useState<'posts' | 'sales'>('posts');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editPostId, setEditPostId] = useState<number | null>(null);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  const [deleteNoticeTarget, setDeleteNoticeTarget] = useState<number | null>(null);
  const [profileForm, setProfileForm] = useState<ProfileFormState>({
    nickname: '',
    intro: '',
    instaUrl: '',
    youtubeUrl: '',
    tiktokUrl: '',
  });

  const { data: soldAuctions = [] } = useGetSoldAuctions(sellerId);

  const { data, isLoading, isError } = useGetSellerProfile(sellerId);
  const { data: reputation } = useGetSellerReputation(sellerId);
  const { data: mySellerStatus } = useGetSellerStatus();
  const { data: meData } = useGetMe();
  const { mutate: patchProfile, isPending: isProfilePending } = usePatchSellerProfile(sellerId);
  const { mutate: patchProfileImage } = usePatchProfileImage(sellerId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProfileImageClick = () => {
    if (isMyProfile) fileInputRef.current?.click();
  };

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { optimizeImage } = await import('@/utils/imageOptimizer');
    const optimized = await optimizeImage(file);

    patchProfileImage(optimized, {
      onSuccess: () => {
        showToast({ type: 'success', message: '프로필 이미지가 변경되었습니다.' });
      },
      onError: (error) => {
        showToast({ type: 'error', message: getUploadErrorMessage(error, '프로필 이미지 변경에 실패했습니다.') });
      },
    });
  };

  const { data: notices = [] } = useGetSellerNotice(sellerId);
  const { mutate: postNotice } = usePostSellerNotice(sellerId);
  const { mutate: patchNotice } = usePatchSellerNotice(sellerId);
  const { mutate: deleteNotice } = useDeleteSellerNotice(sellerId);

  const [viewNoticeId, setViewNoticeId] = useState<number | null>(null);
  const routedNoticeIdParam = searchParams.get('noticeId');
  const routedNoticeId = routedNoticeIdParam ? Number(routedNoticeIdParam) : null;
  const activeNoticeId = routedNoticeId != null && Number.isFinite(routedNoticeId) ? routedNoticeId : viewNoticeId;
  const { data: noticeDetail } = useGetSellerNoticeDetail(sellerId, activeNoticeId);

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
  const scheduledStreamOptions = scheduledStreamsData?.streams ?? [];

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
      const matched = scheduledStreamOptions.find((s) => infoText.includes(s.title)) ?? null;
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
      nickname: data.shopName,
      intro: data.intro,
      instaUrl: stripPrefix(data.instagramUrl ?? ''),
      youtubeUrl: stripPrefix(data.youtubeUrl ?? ''),
      tiktokUrl: stripPrefix(data.tiktokUrl ?? ''),
    });
    setIsProfileEditOpen(true);
  };

  const handleSubmitProfileEdit = () => {
    if (!profileForm.nickname.trim()) {
      showToast({ type: 'warning', message: '닉네임을 입력해주세요.' });
      return;
    }
    patchProfile(
      {
        shopName: profileForm.nickname.trim(),
        intro: profileForm.intro,
        profileImage: undefined,
        instaUrl: addPrefix(profileForm.instaUrl, SOCIAL_PREFIX.instagram),
        youtubeUrl: addPrefix(profileForm.youtubeUrl, SOCIAL_PREFIX.youtube),
        tiktokUrl: addPrefix(profileForm.tiktokUrl, SOCIAL_PREFIX.tiktok),
      },
      {
        onSuccess: () => {
          setIsProfileEditOpen(false);
          showToast({ type: 'success', message: '프로필이 수정되었습니다.' });
        },
        onError: () => {
          showToast({ type: 'error', message: '프로필 수정에 실패했습니다.' });
        },
      },
    );
  };

  const handleDeleteNotice = (postId: number) => {
    setDeleteNoticeTarget(postId);
  };

  const handleCloseNoticeModal = () => {
    setViewNoticeId(null);
    if (searchParams.has('noticeId')) {
      const nextSearchParams = new URLSearchParams(searchParams);
      nextSearchParams.delete('noticeId');
      setSearchParams(nextSearchParams);
    }
  };

  const handleConfirmDeleteNotice = () => {
    if (deleteNoticeTarget == null) return;
    deleteNotice(deleteNoticeTarget, {
      onSuccess: () => {
        showToast({ type: 'success', message: '공지사항이 삭제되었습니다.' });
        setDeleteNoticeTarget(null);
      },
      onError: () => {
        showToast({ type: 'error', message: '공지사항 삭제에 실패했습니다.' });
        setDeleteNoticeTarget(null);
      },
    });
  };

  const buildNoticeContent = () => {
    let content = noticeContent;
    if (selectedStream) {
      const dateStr = selectedStream.scheduledAt ? formatScheduledDateTime(selectedStream.scheduledAt) : '';
      content += `\n\n[방송 안내] ${selectedStream.title}${dateStr ? ` (${dateStr})` : ''}`;
    }
    return content;
  };

  const handleSubmitNotice = () => {
    if (!noticeTitle.trim() || !noticeContent.trim()) {
      showToast({ type: 'warning', message: '제목과 내용을 모두 입력해주세요.' });
      return;
    }
    const finalContent = buildNoticeContent();
    if (modalMode === 'create') {
      postNotice(
        { title: noticeTitle, content: finalContent },
        {
          onSuccess: () => {
            showToast({ type: 'success', message: '공지사항이 등록되었습니다.' });
            setIsModalOpen(false);
          },
          onError: () => showToast({ type: 'error', message: '공지사항 등록에 실패했습니다.' }),
        },
      );
    } else if (modalMode === 'edit' && editPostId) {
      patchNotice(
        { noticeId: editPostId, payload: { title: noticeTitle, content: finalContent } },
        {
          onSuccess: () => {
            showToast({ type: 'success', message: '공지사항이 수정되었습니다.' });
            setIsModalOpen(false);
          },
          onError: () => showToast({ type: 'error', message: '공지사항 수정에 실패했습니다.' }),
        },
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
        <p className="text-accent-light text-base">판매자 정보를 불러오지 못했습니다</p>
      </div>
    );
  }

  const { shopName, intro, profileImage, instagramUrl, youtubeUrl, tiktokUrl } = data;

  return (
    <div className="w-full box-border max-w-[1200px] mx-auto py-10 px-5 flex flex-col gap-6">
      {/* 프로필 헤더 */}
      <div className="relative overflow-hidden w-full rounded-(--radius-panel) bg-surface">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(232,179,106,0.12)_0%,transparent_40%,transparent_60%,rgba(138,110,82,0.08)_100%)]" />

        <div className="relative flex flex-col gap-8 py-10 px-12">
          {/* 상단: 아바타 + 정보 + 액션 */}
          <div className="flex items-start gap-8">
            <div className={`relative group shrink-0 ${isMyProfile ? 'cursor-pointer' : ''}`} onClick={handleProfileImageClick}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProfileImageChange}
              />
              <div className="rounded-full p-[2px] bg-gradient-to-br from-gold-light to-primary">
                {profileImage ? (
                  <>
                    <img
                      src={profileImage}
                      alt={shopName}
                      className="w-[96px] h-[96px] rounded-full object-cover border-[3px] border-surface"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                        (e.target as HTMLImageElement).nextElementSibling?.classList.add('flex');
                      }}
                    />
                    <div className="hidden w-[96px] h-[96px] rounded-full bg-surface border-[3px] border-surface text-gold-light text-[36px] items-center justify-center font-bold">
                      {shopName.charAt(0)}
                    </div>
                  </>
                ) : (
                  <div className="w-[96px] h-[96px] rounded-full bg-surface border-[3px] border-surface text-gold-light text-[36px] flex items-center justify-center font-bold">
                    {shopName.charAt(0)}
                  </div>
                )}
              </div>
              {isMyProfile && (
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <FiCamera size={22} className="text-white" />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-3">
                <h2 className="m-0 text-[22px] text-white">{shopName}</h2>
                {isMyProfile && (
                  <button onClick={handleOpenProfileEdit} className="rounded-lg bg-white/[0.06] border-none px-3 py-1.5 text-[12px] text-neutral-300 cursor-pointer hover:bg-white/[0.1] hover:text-white transition-colors">
                    수정
                  </button>
                )}
                {!isMyProfile && (
                  <button onClick={() => setIsReportModalOpen(true)} className="rounded-lg bg-white/[0.06] border-none px-3 py-1.5 text-[12px] text-neutral-500 cursor-pointer hover:bg-white/[0.1] hover:text-neutral-300 transition-colors">
                    신고
                  </button>
                )}
              </div>
              {intro && <p className="m-0 text-[14px] text-neutral-400 leading-relaxed">{intro}</p>}

              {(instagramUrl || youtubeUrl || tiktokUrl) && (
                <div className="flex gap-1.5 mt-1">
                  {instagramUrl && (
                    <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] transition-colors hover:bg-white/[0.08]">
                      <InstagramIcon />
                    </a>
                  )}
                  {youtubeUrl && (
                    <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] transition-colors hover:bg-white/[0.08]">
                      <YoutubeIcon />
                    </a>
                  )}
                  {tiktokUrl && (
                    <a href={tiktokUrl} target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] transition-colors hover:bg-white/[0.08]">
                      <TiktokIcon />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* 팔로우 버튼 */}
            {!isMyProfile && (
              <button
                className={`shrink-0 px-8 py-2.5 rounded-xl border-none cursor-pointer text-[14px] transition-colors ${
                  isFollowing
                    ? 'bg-white/[0.06] text-neutral-300 hover:bg-white/[0.1]'
                    : 'bg-gold-light text-background hover:bg-gold'
                } ${isFollowPending ? 'opacity-70' : ''}`}
                onClick={handleFollowToggle}
                disabled={isFollowPending}
              >
                {isFollowing ? '팔로잉' : '팔로우'}
              </button>
            )}
          </div>

          {/* 하단: 통계 카드 */}
          {isOwner && data?.stats !== undefined && (
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center gap-1.5 rounded-xl bg-white/[0.04] py-5">
                <span className="text-[14px] text-primary-light">팔로워</span>
                <span className="text-price-lg text-white">{reputation?.followerCount ?? data.stats.followerCount ?? '-'}</span>
              </div>
              <div className="group relative flex flex-col items-center gap-1.5 rounded-xl bg-white/[0.04] py-5">
                <span className="flex items-center gap-1 text-[14px] text-primary-light">
                  평점
                  <svg className="h-3.5 w-3.5 cursor-help text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                <span className="text-price-lg text-white">
                  {reputation?.completionRate != null
                    ? ((reputation.completionRate / 100) * 5).toFixed(1)
                    : (data.stats.rating ?? '-')}
                </span>
                <InfoPanelTooltip title="평점 산정 기준">
                  <ul className="list-disc list-inside space-y-1">
                    <li>완료된 거래와 거래 취소 건수로 산정</li>
                    <li>성공률(%) × 5점 만점으로 계산</li>
                    <li>거래가 없으면 기본 만점(5.0점)</li>
                  </ul>
                  {reputation?.totalTrades != null && (
                    <div className="mt-2 space-y-0.5 border-t border-white/10 pt-2">
                      <p>총 거래: <span className="text-white">{reputation.totalTrades}건</span></p>
                      <p>거래 취소: <span className="text-white">{reputation.cancelCount ?? 0}건</span></p>
                      <p>거래 성공률: <span className="text-white">{reputation.completionRate != null ? `${reputation.completionRate}%` : '-'}</span></p>
                    </div>
                  )}
                </InfoPanelTooltip>
              </div>
              <div className="flex flex-col items-center gap-1.5 rounded-xl bg-white/[0.04] py-5">
                <span className="text-[14px] text-primary-light">평균 배송</span>
                <span className="text-price-lg text-white">
                  {reputation?.avgShipDays != null
                    ? `${reputation.avgShipDays}일`
                    : data.stats.avgShipDays != null
                      ? `${data.stats.avgShipDays}일`
                      : '-'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <div className="w-full rounded-(--radius-panel) py-11 px-14 bg-surface min-h-[calc(100vh-320px)]">
        <div className="flex items-center gap-6 border-b border-white/5 mb-8">
          <button
            className={`flex items-center gap-2 bg-transparent border-0 border-solid border-b-2 px-2 pb-4 text-[16px] cursor-pointer transition-colors duration-200 -mb-[1px] relative z-10 ${
              activeTab === 'posts' ? 'text-gold-light border-gold-light' : 'text-neutral-500 border-transparent hover:text-neutral-300'
            }`}
            onClick={() => setActiveTab('posts')}
          >
            # 공지사항
          </button>

          <button
            className={`flex items-center gap-2 bg-transparent border-0 border-solid border-b-2 px-2 pb-4 text-[16px] cursor-pointer transition-colors duration-200 -mb-[1px] relative z-10 ${
              activeTab === 'sales' ? 'text-gold-light border-gold-light' : 'text-neutral-500 border-transparent hover:text-neutral-300'
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
          <NoticeList
            notices={notices}
            isMyProfile={isMyProfile}
            onOpenNotice={setViewNoticeId}
            onEditNotice={(notice) => handleOpenEditModal(notice.noticeId, notice.title, notice.content)}
            onDeleteNotice={handleDeleteNotice}
          />
        )}

        {activeTab === 'sales' && (
          <div className="flex flex-col gap-5">
            {soldAuctions.length === 0 ? (
              <p className="text-center text-neutral-600 py-16 text-subtitle-lg">판매 이력이 없습니다</p>
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
                        <p className="m-0 text-body-md text-neutral-600">{formatDateTime(sale.createdAt)}</p>
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
                    <span>{scheduledStreamOptions.length > 0 ? '방송을 선택하세요' : '예약된 방송이 없습니다'}</span>
                    <FiChevronDown
                      size={16}
                      className={`text-neutral-500 transition-transform ${streamDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {streamDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-surface-elevated border border-neutral-800 rounded-lg overflow-hidden z-10 shadow-[0_4px_20px_rgba(0,0,0,0.4)] max-h-[200px] overflow-y-auto custom-scrollbar">
                      {scheduledStreamOptions.length > 0 &&
                        scheduledStreamOptions.map((stream) => (
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
                              {stream.scheduledAt ? formatScheduledDateTime(stream.scheduledAt) : ''}
                              {` · ${getCategoryLabel(stream.category)}`}
                            </span>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>

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

      {activeNoticeId !== null && noticeDetail && (
        <div
          className="fixed top-0 left-0 w-full h-full bg-black/90 z-[999] flex items-center justify-center backdrop-blur-sm"
          onClick={handleCloseNoticeModal}
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
                onClick={handleCloseNoticeModal}
                className="py-3 px-8 bg-neutral-700 text-neutral-200 border-none rounded-lg cursor-pointer text-subtitle-sm hover:bg-neutral-600 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteNoticeTarget !== null}
        badgeLabel="공지사항 삭제"
        title="공지사항을 삭제할까요?"
        description={'이 작업은 되돌릴 수 없습니다'}
        confirmLabel="삭제하기"
        cancelLabel="취소"
        onClose={() => setDeleteNoticeTarget(null)}
        onConfirm={handleConfirmDeleteNotice}
      />

      <ProfileEditModal
        isOpen={isProfileEditOpen}
        form={profileForm}
        socialPrefix={SOCIAL_PREFIX}
        isPending={isProfilePending}
        onClose={() => setIsProfileEditOpen(false)}
        onChange={setProfileForm}
        onSubmit={handleSubmitProfileEdit}
      />

      {isReportModalOpen && (
        <ReportModal
          sellerNickname={shopName}
          onClose={() => setIsReportModalOpen(false)}
          onSubmit={() => {
            showToast({ type: 'success', message: '신고가 접수되었습니다.' });
            setIsReportModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
