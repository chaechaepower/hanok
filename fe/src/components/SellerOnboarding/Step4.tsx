import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegisterSeller } from '@/api/hooks/usePostRegisterSeller';
import Button from '@/components/common/Button';
import type { AccountData, BusinessType } from '@/types';
import axios from 'axios';

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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '48px',
    backgroundColor: '#1C1C1E',
    border: '1px solid #3A3A3C',
    borderRadius: '8px',
    color: 'white',
    fontSize: '14px',
    padding: '0 16px',
    outline: 'none',
    fontFamily: 'inherit',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#E5E5EA',
    fontWeight: '600',
    marginBottom: '10px',
    display: 'block',
  };

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
      navigate('/');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        alert('이미 판매자로 등록된 사용자입니다.');
        navigate('/');
        return;
      }
      setError('판매자 등록에 실패했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <>
      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>판매자명</label>
        <input
          type="text"
          value={nickname}
          onChange={(e) => {
            setNickname(e.target.value);
            setError('');
          }}
          placeholder="이름을 입력해주세요"
          style={inputStyle}
          maxLength={20}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>판매자 소개글</label>
        <input
          type="text"
          value={intro}
          onChange={(e) => setIntro(e.target.value)}
          placeholder="상점의 소개를 입력해주세요"
          style={inputStyle}
          maxLength={100}
        />
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={labelStyle}>SNS 링크(선택)</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input
            type="url"
            value={youtubeLink}
            onChange={(e) => setYoutubeLink(e.target.value)}
            placeholder="유튜브 URL"
            style={inputStyle}
          />
          <input
            type="url"
            value={instaLink}
            onChange={(e) => setInstaLink(e.target.value)}
            placeholder="인스타그램 URL"
            style={inputStyle}
          />
          <input
            type="url"
            value={tictokLink}
            onChange={(e) => setTictokLink(e.target.value)}
            placeholder="틱톡 URL"
            style={inputStyle}
          />
        </div>
      </div>

      {error && <p style={{ color: '#FF453A', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px' }}>
        <Button variant="outline" onClick={onPrev} className="w-30!">
          이전
        </Button>
        <Button onClick={handleRegister} disabled={isPending} className="w-30!">
          {isPending ? '등록 중...' : '등록'}
        </Button>
      </div>
    </>
  );
}
