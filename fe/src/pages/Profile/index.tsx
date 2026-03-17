import { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from '@/components/common/Toast';
import { useGetSellerProfile } from '@/api/hooks/useGetSellerProfile';
import { useGetSellerNotice } from '@/api/hooks/useGetSellerNotice';
import { usePostSellerNotice } from '@/api/hooks/usePostSellerNotice';
import { usePatchSellerNotice } from '@/api/hooks/usePatchSellerNotice';
import { useDeleteSellerNotice } from '@/api/hooks/useDeleteSellerNotice';
import { useGetSellerNoticeDetail } from '@/api/hooks/useGetSellerNoticeDetail';
import { useGetSellerStatus } from '@/api/hooks/useGetSellerStatus';
import { usePostFollow } from '@/api/hooks/usePostFollow';
import { FaInstagram, FaYoutube, FaTiktok } from 'react-icons/fa';
import ReportModal from '@/components/Profile/ReportModal';
import { useGetSoldAuctions } from '@/api/hooks/useGetSoldAuctions';
import { usePatchSellerProfile } from '@/api/hooks/usePatchSellerProfile';
import { usePatchProfileImage } from '@/api/hooks/usePatchProfileImage';
import type { EscrowState, ScheduledStream } from '@/types';
import { FiBell, FiCalendar, FiClock, FiGift, FiEdit2, FiX, FiCamera, FiTv } from 'react-icons/fi';
import { useGetScheduledStreams } from '@/api/hooks/useGetScheduledStreams';

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
        badgeClass: 'self-start bg-[#1b4a3c] text-[#4ade80] px-2 py-1 text-[11px] font-bold rounded-[20px]',
      };
    case 'COMPLETED':
      return {
        label: '배송완료',
        badgeClass: 'self-start bg-[#183b5f] text-[#60a5fa] px-2 py-1 text-[11px] font-bold rounded-[20px]',
      };
    case 'CANCELLED':
      return {
        label: '취소됨',
        badgeClass: 'self-start bg-[#333] text-[#999] px-2 py-1 text-[11px] font-bold rounded-[20px]',
      };
    case 'DEPOSITED':
    default:
      return {
        label: '결제완료',
        badgeClass: 'self-start bg-[#3a2b16] text-[#d9b36d] px-2 py-1 text-[11px] font-bold rounded-[20px]',
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
  const { data: scheduledStreamsData } = useGetScheduledStreams(0, 50);

  const { mutate: postFollow, isPending: isFollowPending } = usePostFollow();

  const { showToast } = useToast();
  const [isFollowing, setIsFollowing] = useState(false);

  const myUserId = localStorage.getItem('userId');
  const isMyProfile = myUserId !== null && Number(myUserId) === sellerId;
  const isOwner = mySellerStatus?.isSeller || true;

  const handleFollowToggle = () => {
    postFollow(
      { userId: sellerId },
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
        ? new Date(selectedStream.scheduledAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
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

  const { nickname, intro, profileImage, instagramUrl, youtubeUrl, tiktokUrl } = data;


  return (
    <div className="w-full box-border max-w-[1200px] mx-auto py-10 px-5 flex flex-col gap-8">
      <div className="w-full box-border border border-[#d9b36d]/30 rounded-2xl py-11 px-14 bg-[#050505]">
        <div className="flex items-start gap-10">
          <div
            className={`relative group ${isMyProfile ? 'cursor-pointer' : ''}`}
            onClick={handleProfileImageClick}
          >
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
                  className="w-[140px] h-[140px] min-w-[140px] min-h-[140px] flex-shrink-0 rounded-full object-contain object-center bg-[#1e1e2d]"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                    (e.target as HTMLImageElement).nextElementSibling?.classList.add('flex');
                  }}
                />
                <div className="hidden w-[140px] h-[140px] min-w-[140px] min-h-[140px] flex-shrink-0 rounded-full bg-[#1e1e2d] text-[#d9b36d] text-[48px] items-center justify-center font-bold">
                  {nickname.charAt(0)}
                </div>
              </>
            ) : (
              <div className="w-[140px] h-[140px] min-w-[140px] min-h-[140px] flex-shrink-0 rounded-full bg-[#1e1e2d] text-[#d9b36d] text-[48px] flex items-center justify-center font-bold">
                {nickname.charAt(0)}
              </div>
            )}
            {isMyProfile && (
              <div className="absolute inset-0 w-[140px] h-[140px] rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <FiCamera size={28} className="text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <h1 className="m-0 text-[26px] font-bold text-white">{nickname}상점</h1>
              {!isMyProfile && (
                <button
                  className={`py-2 px-[22px] rounded-3xl bg-white text-gray-900 text-sm font-bold border-none cursor-pointer ${isFollowPending ? 'opacity-70' : 'opacity-100'}`}
                  onClick={handleFollowToggle}
                  disabled={isFollowPending}
                >
                  {isFollowing ? '언팔로우' : '팔로우'}
                </button>
              )}
              <div className="ml-auto flex gap-4">
                {isMyProfile && (
                  <button
                    onClick={handleOpenProfileEdit}
                    className="border-none bg-transparent text-[#888] text-sm cursor-pointer hover:text-[var(--color-point)] transition-colors"
                  >
                    수정
                  </button>
                )}
                {!isMyProfile && (
                  <button
                    onClick={() => setIsReportModalOpen(true)}
                    className="border-none bg-transparent text-[#888] text-sm cursor-pointer hover:text-[var(--color-point)] transition-colors"
                  >
                    신고
                  </button>
                )}
              </div>
            </div>

            <p className="m-0 text-[15px] text-[#ddd] leading-relaxed">{intro}</p>

            <div className="flex gap-5 mt-1">
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-[6px] text-white no-underline text-base font-semibold"
                >
                  <InstagramIcon />
                  <span>{instagramUrl.replace('https://instagram.com/', '@')}</span>
                </a>
              )}
              {youtubeUrl && (
                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-[6px] text-white no-underline text-base font-semibold"
                >
                  <YoutubeIcon />
                  <span>{youtubeUrl.replace('https://youtube.com/', '')}</span>
                </a>
              )}
              {tiktokUrl && (
                <a
                  href={tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-[6px] text-white no-underline text-base font-semibold"
                >
                  <TiktokIcon />
                  <span>{tiktokUrl.replace('https://tiktok.com/', '')}</span>
                </a>
              )}
            </div>

            {isOwner && data?.stats !== undefined && (
              <div className="mt-3 border border-white/5 rounded-xl py-6 flex items-center w-[420px]">
                <div className="flex-1 flex flex-col items-center gap-[6px]">
                  <span className="text-[22px] font-bold text-white">{data.stats.followerCount}</span>
                  <span className="text-[13px] text-[#888]">팔로워수</span>
                </div>
                <div className="w-[1px] h-10 bg-[#2e2e40]" />
                <div className="flex-1 flex flex-col items-center gap-[6px]">
                  <span className="text-[22px] font-bold text-white">{data.stats.rating}</span>
                  <span className="text-[13px] text-[#888]">평점</span>
                </div>
                <div className="w-[1px] h-10 bg-[#2e2e40]" />
                <div className="flex-1 flex flex-col items-center gap-[6px]">
                  <span className="text-[22px] font-bold text-white">{data.stats.avgShipDays}일</span>
                  <span className="text-[13px] text-[#888]">평균 배송일</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-full box-border border border-[#d9b36d]/30 rounded-2xl py-11 px-14 bg-[#050505]">
        <div className="flex gap-6 border-b border-white/5 mb-8">
          <button
            className={`flex items-center gap-[6px] bg-transparent border-0 border-solid border-b-2 px-2 pb-4 text-base font-bold cursor-pointer transition-colors duration-200 -mb-[1px] relative z-10 ${
              activeTab === 'posts' ? 'text-[#d9b36d] border-[#d9b36d]' : 'text-[#888] border-transparent'
            }`}
            onClick={() => setActiveTab('posts')}
          >
            # 공지사항
          </button>

          {isMyProfile && (
          <button
            className={`flex items-center gap-[6px] bg-transparent border-0 border-solid border-b-2 px-2 pb-4 text-base font-bold cursor-pointer transition-colors duration-200 -mb-[1px] relative z-10 ${
              activeTab === 'sales' ? 'text-[#d9b36d] border-[#d9b36d]' : 'text-[#888] border-transparent'
            }`}
            onClick={() => setActiveTab('sales')}
          >
            <HistoryIcon />
            낙찰 이력
          </button>
          )}
        </div>

        {activeTab === 'posts' && (
          <div className="flex flex-col gap-5">
            {isMyProfile && (
              <div className="flex justify-end mt-[-15px] mb-[-5px]">
                <button
                  className="flex items-center justify-center bg-transparent text-[#d9b36d] border-none cursor-pointer hover:text-[#c4a162] transition-colors p-0"
                  onClick={handleOpenCreateModal}
                  aria-label="공지사항 등록"
                >
                  <FiEdit2 size={20} />
                </button>
              </div>
            )}
            {notices.length === 0 ? (
              <p className="text-center text-[#888] py-[60px] text-[15px]">등록된 공지사항이 없습니다.</p>
            ) : (
              notices.map((post) => {
                const streamMatch = post.content.match(/\[방송 안내\]\s*([\s\S]+)$/);
                const mainContent = streamMatch ? post.content.slice(0, post.content.indexOf('[방송 안내]')).trim() : post.content;
                const streamInfo = streamMatch ? streamMatch[1].trim() : null;

                return (
                <div
                  key={post.noticeId}
                  className="border border-white/[0.06] rounded-xl py-7 px-8 bg-white/[0.02] flex flex-col gap-3 cursor-pointer hover:border-[#d9b36d]/40 transition-colors"
                  onClick={() => setViewNoticeId(post.noticeId)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-[10px]">
                        <BellIcon />
                        <h3 className="m-0 text-lg font-bold text-white">{post.title}</h3>
                      </div>
                      {mainContent && (
                        <p className="m-0 mt-1 ml-[30px] text-sm text-[#aaa] leading-relaxed">{mainContent}</p>
                      )}
                      {streamInfo && (
                        <p className="m-0 mt-1 ml-[30px] text-sm text-[#aaa] leading-relaxed">{streamInfo}</p>
                      )}
                      <div className="flex items-center gap-[6px] mt-2 ml-[30px]">
                        <CalendarIcon />
                        <span className="text-[13px] text-[#666]">{formatDate(post.createdAt).split(' ')[0]}</span>
                      </div>
                    </div>
                    {isMyProfile && (
                      <div className="flex gap-3">
                        <button
                          className="bg-transparent border-none text-[#888] text-[13px] cursor-pointer hover:underline"
                          onClick={(e) => { e.stopPropagation(); handleOpenEditModal(post.noticeId, post.title, post.content); }}
                        >
                          수정
                        </button>
                        <button
                          className="bg-transparent border-none text-red-400 text-[13px] cursor-pointer hover:underline"
                          onClick={(e) => { e.stopPropagation(); handleDeleteNotice(post.noticeId); }}
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
              <p className="text-center text-[#888] py-[60px] text-[15px]">낙찰 이력이 없습니다.</p>
            ) : (
              soldAuctions.map((sale, index) => {
                const ui = getEscrowStateUI(sale.escrowStatus);
                return (
                  <div
                    key={sale.escrowId}
                    className={`flex py-4 items-center justify-between ${index > 0 ? 'border-t border-[#1a1a26] mt-4 pt-8' : ''}`}
                  >
                    <div className="flex items-center gap-6 flex-1">
                      <div className="w-16 h-16 rounded-full bg-[#1c1c28] border-[1.5px] border-[#d9b36d] flex items-center justify-center overflow-hidden">
                        {sale.image ? (
                          <img src={sale.image} alt={sale.itemName} className="w-full h-full object-cover" />
                        ) : (
                          <GiftIcon />
                        )}
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
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl w-[500px] p-8 flex flex-col gap-5 shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
            <h2 className="m-0 text-white text-xl font-bold">
              {modalMode === 'create' ? '공지사항 등록' : '공지사항 수정'}
            </h2>
            <input
              className="w-full box-border bg-white/[0.02] text-white border border-white/5 rounded-lg p-[14px] text-[15px] outline-none focus:border-[#d9b36d] transition-colors"
              placeholder="제목을 입력하세요"
              value={noticeTitle}
              onChange={(e) => setNoticeTitle(e.target.value)}
            />
            <textarea
              className="w-full box-border bg-white/[0.02] text-white border border-white/5 rounded-lg p-[14px] text-[15px] min-h-[140px] resize-none outline-none focus:border-[#d9b36d] transition-colors"
              placeholder="내용을 입력하세요"
              value={noticeContent}
              onChange={(e) => setNoticeContent(e.target.value)}
            />

            {scheduledStreamsData?.streams && scheduledStreamsData.streams.length > 0 && (
              <div className="flex flex-col gap-2">
                <label className="text-[13px] text-[#aaa] font-medium flex items-center gap-[6px]">
                  <FiTv size={14} color="#d9b36d" />
                  예약된 방송 연결 (선택)
                </label>
                {selectedStream ? (
                  <div className="flex items-center gap-2 bg-[#1a1a2e] border border-[#d9b36d]/30 rounded-lg px-3 py-2">
                    <FiTv size={14} color="#d9b36d" />
                    <span className="text-[13px] text-[#d9b36d] font-medium">{selectedStream.title}</span>
                    <button
                      type="button"
                      className="ml-auto bg-transparent border-none text-[#888] cursor-pointer hover:text-white"
                      onClick={() => setSelectedStream(null)}
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                ) : (
                  <select
                    className="w-full box-border bg-white/[0.02] text-white border border-white/5 rounded-lg p-[14px] text-[15px] outline-none focus:border-[#d9b36d] transition-colors appearance-none cursor-pointer"
                    value=""
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      const stream = scheduledStreamsData.streams.find((s) => s.streamId === id) ?? null;
                      setSelectedStream(stream);
                    }}
                  >
                    <option value="" className="bg-[#111] text-white">방송을 선택하세요</option>
                    {scheduledStreamsData.streams.map((stream) => (
                      <option key={stream.streamId} value={stream.streamId} className="bg-[#111] text-white">
                        {stream.title}
                        {stream.scheduledAt
                          ? ` - ${new Date(stream.scheduledAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                          : ''}
                        {` [${stream.category}]`}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-[10px]">
              <button
                className="py-[10px] px-6 bg-[#333] text-[#ddd] border-none rounded-lg cursor-pointer text-sm font-semibold"
                onClick={() => setIsModalOpen(false)}
              >
                취소
              </button>
              <button
                className="py-[10px] px-6 bg-[#d9b36d] text-[#111] font-bold border-none rounded-lg cursor-pointer text-sm"
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
          className="fixed top-0 left-0 w-full h-full bg-black/70 z-[999] flex items-center justify-center"
          onClick={() => setViewNoticeId(null)}
        >
          <div
            className="bg-[#0a0a0a] border border-white/5 rounded-2xl w-[520px] p-8 flex flex-col gap-5 shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-[10px]">
                <BellIcon />
                <h2 className="m-0 text-white text-xl font-bold">{noticeDetail.title}</h2>
              </div>
              <button
                onClick={() => setViewNoticeId(null)}
                className="bg-transparent border-none text-[#888] cursor-pointer hover:text-white transition-colors"
              >
                <FiX size={22} />
              </button>
            </div>

            <p className="m-0 text-[15px] text-[#ddd] leading-relaxed whitespace-pre-wrap">{noticeDetail.content}</p>

            <div className="flex items-center gap-4 text-[13px] text-[#888] border-t border-white/5 pt-4">
              <div className="flex items-center gap-[6px]">
                <CalendarIcon />
                <span>작성일 {formatDate(noticeDetail.createdAt).split(' ')[0]}</span>
              </div>
              {noticeDetail.updatedAt && noticeDetail.updatedAt !== noticeDetail.createdAt && (
                <div className="flex items-center gap-[6px]">
                  <CalendarIcon />
                  <span>수정일 {formatDate(noticeDetail.updatedAt).split(' ')[0]}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setViewNoticeId(null)}
                className="py-3 px-8 bg-[#333] text-[#ddd] border-none rounded-lg cursor-pointer text-sm font-semibold hover:bg-[#444] transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {isProfileEditOpen && (
        <div
          className="fixed top-0 left-0 w-full h-full bg-black/70 z-[999] flex items-center justify-center"
          onClick={() => setIsProfileEditOpen(false)}
        >
          <div
            className="bg-[#0a0a0a] border border-white/5 rounded-2xl w-[500px] p-8 flex flex-col gap-5 shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="m-0 text-white text-xl font-bold">프로필 수정</h2>

            <div className="flex flex-col gap-2">
              <label className="text-[14px] text-[#aaa] font-medium">닉네임</label>
              <input
                className="w-full box-border bg-white/[0.02] text-white border border-white/5 rounded-lg px-4 py-3 text-[15px] outline-none focus:border-[#d9b36d] transition-colors"
                value={profileForm.nickname}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, nickname: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[14px] text-[#aaa] font-medium">소개</label>
              <textarea
                className="w-full box-border bg-white/[0.02] text-white border border-white/5 rounded-lg px-4 py-3 text-[15px] outline-none focus:border-[#d9b36d] transition-colors min-h-[100px] resize-none"
                value={profileForm.intro}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, intro: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[14px] text-[#aaa] font-medium">Instagram URL</label>
              <input
                className="w-full box-border bg-white/[0.02] text-white border border-white/5 rounded-lg px-4 py-3 text-[15px] outline-none focus:border-[#d9b36d] transition-colors"
                placeholder="https://instagram.com/..."
                value={profileForm.instaUrl}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, instaUrl: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[14px] text-[#aaa] font-medium">YouTube URL</label>
              <input
                className="w-full box-border bg-white/[0.02] text-white border border-white/5 rounded-lg px-4 py-3 text-[15px] outline-none focus:border-[#d9b36d] transition-colors"
                placeholder="https://youtube.com/..."
                value={profileForm.youtubeUrl}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, youtubeUrl: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[14px] text-[#aaa] font-medium">TikTok URL</label>
              <input
                className="w-full box-border bg-white/[0.02] text-white border border-white/5 rounded-lg px-4 py-3 text-[15px] outline-none focus:border-[#d9b36d] transition-colors"
                placeholder="https://tiktok.com/..."
                value={profileForm.tiktokUrl}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, tiktokUrl: e.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-3 mt-2">
              <button
                className="py-[10px] px-6 bg-[#333] text-[#ddd] border-none rounded-lg cursor-pointer text-sm font-semibold"
                onClick={() => setIsProfileEditOpen(false)}
              >
                취소
              </button>
              <button
                className="py-[10px] px-6 bg-[#d9b36d] text-[#111] font-bold border-none rounded-lg cursor-pointer text-sm hover:bg-[#c8a45c] transition-colors disabled:opacity-50"
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
