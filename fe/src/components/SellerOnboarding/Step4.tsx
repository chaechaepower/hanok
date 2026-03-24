import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegisterSeller } from '@/api/hooks/usePostRegisterSeller';
import Button from '@/components/common/Button';
import type { AccountData, BusinessType } from '@/types';
import axios from 'axios';
import { useToast } from '@/hooks/useToast';

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

  const [nickname, setNickname] = useState('');
  const [intro, setIntro] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [instaLink, setInstaLink] = useState('');
  const [tictokLink, setTictokLink] = useState('');
  const [error, setError] = useState('');

  const { showToast } = useToast();

  const handleRegister = async () => {
    if (!nickname.trim()) {
      setError('판매자명을 입력해주세요.');
      return;
    }
    setError('');
    try {
      await registerSeller({
        type: businessType,
        businessNumber: businessNumber,
        nickname: nickname.trim(),
        intro: intro.trim(),
        youtubeUrl: youtubeLink.trim(),
        instaUrl: instaLink.trim(),
        tiktokUrl: tictokLink.trim(),
        bankCode: account?.bankCode ?? '',
        accountNum: account?.accountNum ?? '',
        accountName: account?.accountName ?? '',
      });
      navigate('/main');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        showToast({ message: '이미 판매자로 등록된 사용자입니다.' });
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
          value={nickname}
          onChange={(e) => {
            setNickname(e.target.value);
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
        <div className="flex flex-col gap-3">
          <input
            type="url"
            value={youtubeLink}
            onChange={(e) => setYoutubeLink(e.target.value)}
            placeholder="유튜브 URL"
            className={inputClass}
          />
          <input
            type="url"
            value={instaLink}
            onChange={(e) => setInstaLink(e.target.value)}
            placeholder="인스타그램 URL"
            className={inputClass}
          />
          <input
            type="url"
            value={tictokLink}
            onChange={(e) => setTictokLink(e.target.value)}
            placeholder="틱톡 URL"
            className={inputClass}
          />
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
