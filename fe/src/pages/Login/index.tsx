import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { FiX } from 'react-icons/fi';

import { login } from '@/api/hooks/usePostLogin';
import { getMe } from '@/api/hooks/useGetMe';
import Button from '@/components/common/Button';

export default function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState(() => localStorage.getItem('savedEmail') ?? '');
  const [password, setPassword] = useState('');
  const [rememberEmail, setRememberEmail] = useState(() => !!localStorage.getItem('savedEmail'));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const inputContainerClass =
    'flex items-center border border-neutral-800 rounded-[10px] h-[52px] px-3 bg-transparent focus-within:border-primary transition-colors';
  const inputClass = 'flex-1 bg-transparent text-[15px] text-neutral-100 px-2 focus:outline-none placeholder-neutral-600';
  const iconClass = 'w-5 h-5 text-neutral-600';

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
      await login({ email, password });

      if (rememberEmail) {
        localStorage.setItem('savedEmail', email);
      } else {
        localStorage.removeItem('savedEmail');
      }

      queryClient.clear();
      const me = await getMe();
      queryClient.setQueryData(['me'], me);
      navigate('/');
    } catch {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-[480px] text-center mb-10">
        <h1 className="text-[32px] font-bold mb-4 text-neutral-100">로그인</h1>
        <p className="text-neutral-300 text-[15px]">한옥의 경매에 참여해 보세요!</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[480px] flex flex-col gap-6"
      >
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-medium text-neutral-300 ml-1">이메일</label>
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
            {email && (
              <button
                type="button"
                onClick={() => setEmail('')}
                className="bg-transparent border-none p-1 cursor-pointer text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                <FiX size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-medium text-neutral-300 ml-1">비밀번호</label>
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

        <label className="flex items-center gap-3 cursor-pointer -mt-2">
          <div
            className={`w-5 h-5 min-w-5 flex justify-center items-center rounded border-2 relative transition-all duration-150 ${
              rememberEmail ? 'border-primary bg-primary' : 'border-neutral-600 bg-transparent'
            }`}
          >
            <input
              type="checkbox"
              checked={rememberEmail}
              onChange={(e) => setRememberEmail(e.target.checked)}
              className="appearance-none absolute inset-0 cursor-pointer"
            />
            {rememberEmail && (
              <svg
                className="w-3 h-3 text-background pointer-events-none"
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
          <span className="text-sm text-neutral-300">이메일 기억하기</span>
        </label>

        {error && <p className="text-accent-light text-sm px-1 -mt-2">{error}</p>}

        <div className="w-full">
          <Button type="submit" variant="white" size="large" disabled={isLoading} className="!bg-neutral-200 !text-background hover:!bg-neutral-300">
            {isLoading ? '로그인 중...' : '로그인'}
          </Button>
        </div>

        <div className="text-center text-[13px] text-neutral-500 mt-1 flex items-center justify-center gap-1">
          아직 계정이 없으신가요?
          <button type="button" onClick={() => navigate('/signup')} className="text-primary-light font-semibold hover:underline">
            회원가입
          </button>
        </div>
      </form>
    </div>
  );
}
