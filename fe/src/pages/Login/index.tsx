import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { login } from '@/api/hooks/usePostLogin';
import Button from '@/components/common/Button';

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState(() => localStorage.getItem('savedEmail') ?? '');
  const [password, setPassword] = useState('');
  const [rememberEmail, setRememberEmail] = useState(() => !!localStorage.getItem('savedEmail'));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const inputContainerClass =
    'flex items-center border border-[#3A3A3C] rounded-[10px] h-[52px] px-3 bg-transparent focus-within:border-[#CEAF82] transition-colors';
  const inputClass = 'flex-1 bg-transparent text-[15px] text-white px-2 focus:outline-none placeholder-[#636366]';
  const iconClass = 'w-5 h-5 text-[#8E8E93]';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.includes('@')) {
      setError('유효한 이메일 형식을 입력해주세요.');
      return;
    }
    if (password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.');
      return;
    }

    setIsLoading(true);
    try {
      const data = await login({ email, password });

      // 토큰 저장
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('userId', data.user.userId.toString());

      // 이메일 기억하기
      if (rememberEmail) {
        localStorage.setItem('savedEmail', email);
      } else {
        localStorage.removeItem('savedEmail');
      }

      navigate('/');
    } catch {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '40px 16px',
        color: 'white',
      }}
    >
      {/* Header */}
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          textAlign: 'center',
          marginBottom: '40px',
        }}
      >
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '16px' }}>로그인</h1>
        <p style={{ color: '#E5E5EA', fontSize: '15px' }}>한옥의 경매에 참여해 보세요!</p>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          maxWidth: '480px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {/* Email */}
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-medium text-[#E5E5EA] ml-1">이메일</label>
          <div className={inputContainerClass}>
            <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <input
              id="login-email"
              type="email"
              placeholder="example@hanok.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              autoComplete="email"
            />
          </div>
        </div>

        {/* Password */}
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-medium text-[#E5E5EA] ml-1">비밀번호</label>
          <div className={inputContainerClass}>
            <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <input
              id="login-password"
              type="password"
              placeholder="비밀번호(8자 이상 영문, 숫자 조합)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              autoComplete="current-password"
            />
          </div>
        </div>

        {/* Remember Email */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginTop: '-8px' }}>
          <div
            style={{
              width: '20px',
              height: '20px',
              minWidth: '20px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: '4px',
              border: `2px solid ${rememberEmail ? '#CEAF82' : '#888'}`,
              backgroundColor: rememberEmail ? '#CEAF82' : 'transparent',
              position: 'relative',
              transition: 'all 0.15s',
            }}
          >
            <input
              type="checkbox"
              checked={rememberEmail}
              onChange={(e) => setRememberEmail(e.target.checked)}
              style={{ appearance: 'none', position: 'absolute', inset: 0, cursor: 'pointer' }}
            />
            {rememberEmail && (
              <svg
                style={{ width: '12px', height: '12px', color: 'black', pointerEvents: 'none' }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <span style={{ fontSize: '14px', color: '#E5E5EA' }}>이메일 기억하기</span>
        </label>

        {/* Error Message */}
        {error && <p className="text-[#FF453A] text-sm px-1 -mt-2">{error}</p>}

        {/* Submit */}
        <div className="w-full">
          <Button type="submit" variant="white" size="large" disabled={isLoading}>
            {isLoading ? '로그인 중...' : '로그인'}
          </Button>
        </div>

        {/* Sign Up Link */}
        <div className="text-center text-[13px] text-[#A0A0A0] mt-1 flex items-center justify-center gap-1">
          아직 계정이 없으신가요?
          <button type="button" onClick={() => navigate('/signup')} className="text-gold font-semibold hover:underline">
            회원가입
          </button>
        </div>
      </form>
    </div>
  );
}
