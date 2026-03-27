import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegisterSeller } from '@/api/hooks/usePostRegisterSeller';
import Button from '@/components/common/Button';
import type { AccountData, BusinessType } from '@/types';
import axios from 'axios';
import { useToast } from '@/hooks/useToast';
import { FaYoutube, FaInstagram, FaTiktok } from 'react-icons/fa6';

const SOCIAL_PREFIX = {
  youtube: 'https://www.youtube.com/@',
  instagram: 'https://www.instagram.com/',
  tiktok: 'https://www.tiktok.com/@',
} as const;

const addPrefix = (handle: string, prefix: string) => (handle.trim() ? `${prefix}${handle.trim()}` : '');

const inputClass =
  'w-full h-14 bg-surface border border-neutral-700 rounded-xl text-base px-5 outline-none font-[inherit] text-white';

export default function Step4({
  onPrev,
  businessType,
  businessNumber,
  account,
}: {
  onPrev: () => void;
  businessType: BusinessType;
  businessNumber: string | null;
  account: AccountData | null;
}) {
  const navigate = useNavigate();
  const { mutateAsync: registerSeller, isPending } = useRegisterSeller();

  const [shopName, setShopName] = useState('');
  const [intro, setIntro] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [instaLink, setInstaLink] = useState('');
  const [tictokLink, setTictokLink] = useState('');
  const [error, setError] = useState('');

  const { showToast } = useToast();

  const handleRegister = async () => {
    if (!shopName.trim()) {
      setError('판매자명을 입력해주세요.');
      return;
    }
    setError('');
    try {
      await registerSeller({
        type: businessType,
        businessNumber: businessNumber,
        shopName: shopName.trim(),
        intro: intro.trim(),
        youtubeUrl: addPrefix(youtubeLink, SOCIAL_PREFIX.youtube),
        instaUrl: addPrefix(instaLink, SOCIAL_PREFIX.instagram),
        tiktokUrl: addPrefix(tictokLink, SOCIAL_PREFIX.tiktok),
        bankCode: account?.bankCode ?? '',
        accountNum: account?.accountNum ?? '',
        accountName: account?.accountName ?? '',
      });
      showToast({ type: 'success', message: '판매자 등록이 완료되었습니다.' });
      navigate('/main');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        showToast({ type: 'warning', message: '이미 판매자로 등록된 사용자입니다.' });
        navigate('/main');
        return;
      }
      setError('판매자 등록에 실패했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <>
      <div className="mb-6">
        <label className="text-base text-neutral-200 font-semibold mb-3 block">판매자명</label>
        <input
          type="text"
          value={shopName}
          onChange={(e) => {
            setShopName(e.target.value);
            setError('');
          }}
          placeholder="이름을 입력해주세요"
          className={inputClass}
          maxLength={20}
        />
      </div>

      <div className="mb-6">
        <label className="text-base text-neutral-200 font-semibold mb-3 block">판매자 소개글</label>
        <input
          type="text"
          value={intro}
          onChange={(e) => setIntro(e.target.value)}
          placeholder="상점의 소개를 입력해주세요"
          className={inputClass}
          maxLength={100}
        />
      </div>

      <div className="mb-8">
        <label className="text-base text-neutral-200 font-semibold mb-3 block">SNS 링크(선택)</label>
        <div className="rounded-xl border border-neutral-800 overflow-hidden divide-y divide-neutral-800">
          {/* YouTube */}
          <div className="flex items-center h-14 focus-within:bg-neutral-900 transition-colors group">
            <div className="flex items-center gap-2 px-4 w-44 shrink-0">
              <FaYoutube className="text-red-500 text-base shrink-0" />
              <span className="text-sm text-neutral-400 font-medium">YouTube</span>
            </div>
            <div className="w-px h-5 bg-neutral-700 shrink-0" />
            <input
              type="text"
              value={youtubeLink}
              onChange={(e) => setYoutubeLink(e.target.value)}
              placeholder="예) HanokAuction"
              className="flex-1 bg-transparent text-white px-4 text-sm outline-none font-[inherit] placeholder:text-neutral-600"
            />
          </div>

          {/* Instagram */}
          <div className="flex items-center h-14 focus-within:bg-neutral-900 transition-colors group">
            <div className="flex items-center gap-2 px-4 w-44 shrink-0">
              <FaInstagram className="text-pink-500 text-base shrink-0" />
              <span className="text-sm text-neutral-400 font-medium">Instagram</span>
            </div>
            <div className="w-px h-5 bg-neutral-700 shrink-0" />
            <input
              type="text"
              value={instaLink}
              onChange={(e) => setInstaLink(e.target.value)}
              placeholder="예) hanok_official"
              className="flex-1 bg-transparent text-white px-4 text-sm outline-none font-[inherit] placeholder:text-neutral-600"
            />
          </div>

          {/* TikTok */}
          <div className="flex items-center h-14 focus-within:bg-neutral-900 transition-colors group">
            <div className="flex items-center gap-2 px-4 w-44 shrink-0">
              <FaTiktok className="text-neutral-300 text-base shrink-0" />
              <span className="text-sm text-neutral-400 font-medium">TikTok</span>
            </div>
            <div className="w-px h-5 bg-neutral-700 shrink-0" />
            <input
              type="text"
              value={tictokLink}
              onChange={(e) => setTictokLink(e.target.value)}
              placeholder="예) hanok_official"
              className="flex-1 bg-transparent text-white px-4 text-sm outline-none font-[inherit] placeholder:text-neutral-600"
            />
          </div>
        </div>
      </div>

      {error && <p className="text-accent-light text-sm mb-3">{error}</p>}

      <div className="flex justify-between sticky bottom-0 pt-8 pb-6 bg-background">
        <Button variant="outline" onClick={onPrev} className="w-32! h-12! rounded-xl! text-base!">
          이전
        </Button>
        <Button onClick={handleRegister} disabled={isPending} className="w-32! h-12! rounded-xl! text-base!">
          {isPending ? '등록 중...' : '등록'}
        </Button>
      </div>
    </>
  );
}
