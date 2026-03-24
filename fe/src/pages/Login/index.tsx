import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { FiX } from 'react-icons/fi';

import { login } from '@/api/hooks/usePostLogin';
import { getMe } from '@/api/hooks/useGetMe';
import Button from '@/components/common/Button';

type ErrorField = 'email' | 'password' | '';
type FormError = { message: string; field: ErrorField };
const EMPTY_ERROR: FormError = { message: '', field: '' };

const INPUT_BASE =
  'flex items-center border rounded-(--radius-control) h-[52px] px-3 bg-transparent focus-within:border-primary transition-colors';
const INPUT_ERROR = 'border-accent-light/60 bg-accent-muted/10';
const INPUT_NORMAL = 'border-neutral-800';
const INPUT_CLASS = 'flex-1 bg-transparent text-[15px] text-neutral-100 px-2 focus:outline-none placeholder-neutral-600';
const ICON_CLASS = 'w-5 h-5 text-neutral-600';

function inputContainerClass(field: ErrorField, errorField: ErrorField) {
  return `${INPUT_BASE} ${errorField === field ? INPUT_ERROR : INPUT_NORMAL}`;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState(() => localStorage.getItem('savedEmail') ?? '');
  const [password, setPassword] = useState('');
  const [rememberEmail, setRememberEmail] = useState(() => !!localStorage.getItem('savedEmail'));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<FormError>(EMPTY_ERROR);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(EMPTY_ERROR);

    if (!email.trim()) {
      setError({ message: '이메일 주소를 입력해주세요.', field: 'email' });
      return;
    }
    if (!email.includes('@')) {
      setError({ message: "'@'를 포함한 이메일 주소를 입력해주세요.\n(예: example@hanok.com)", field: 'email' });
      return;
    }
    if (!email.split('@')[1]?.includes('.')) {
      setError({ message: "도메인이 올바르지 않습니다.\n(예: example@hanok.com)", field: 'email' });
      return;
    }
    if (!password) {
      setError({ message: '비밀번호를 입력해주세요.', field: 'password' });
      return;
    }
    if (password.length < 8) {
      setError({ message: '비밀번호는 8자 이상이어야 합니다.', field: 'password' });
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
      navigate('/main');
    } catch {
      setError({ message: '이메일 또는 비밀번호가 올바르지 않습니다.', field: '' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex w-full flex-1 items-center justify-center px-5 py-12 sm:px-6">
      <div className="w-full max-w-[440px]">
        <div className="mb-8 text-center">
          <h1 className="text-[28px] font-bold text-neutral-100 sm:text-[32px]">로그인</h1>
          <p className="mt-3 text-[14px] text-neutral-400 sm:text-[15px]">한옥의 경매에 참여해 보세요!</p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-5"
        >
          <div className="flex flex-col gap-2">
            <label className="ml-1 text-[13px] font-medium text-neutral-300">이메일</label>
            <div className={inputContainerClass('email', error.field)}>
              <svg className={ICON_CLASS} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                className={INPUT_CLASS}
                autoComplete="email"
              />
              {email && (
                <button
                  type="button"
                  onClick={() => setEmail('')}
                  className="border-none bg-transparent p-1 text-neutral-500 transition-colors hover:text-neutral-300"
                >
                  <FiX size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="ml-1 text-[13px] font-medium text-neutral-300">비밀번호</label>
            <div className={inputContainerClass('password', error.field)}>
              <svg className={ICON_CLASS} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                className={INPUT_CLASS}
                autoComplete="current-password"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <div
              className={`relative flex h-5 w-5 min-w-5 items-center justify-center rounded border-2 transition-all duration-150 ${
                rememberEmail ? 'border-primary bg-primary' : 'border-neutral-600 bg-transparent'
              }`}
            >
              <input
                type="checkbox"
                checked={rememberEmail}
                onChange={(e) => setRememberEmail(e.target.checked)}
                className="absolute inset-0 cursor-pointer appearance-none"
              />
              {rememberEmail && (
                <svg
                  className="pointer-events-none h-3 w-3 text-background"
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

          {error.message && (
            <p className="whitespace-pre-line rounded-lg bg-accent-muted/40 px-3 py-2 text-[13px] font-medium text-accent-light">
              {error.message}
            </p>
          )}

          <Button type="submit" variant="white" size="large" disabled={isLoading}>
            {isLoading ? '로그인 중...' : '로그인'}
          </Button>

          <p className="mt-1 flex items-center justify-center gap-2 text-center text-[13px] text-neutral-500">
            아직 계정이 없으신가요?
            <button type="button" onClick={() => navigate('/signup')} className="btn-primary-ghost text-[13px]">
              회원가입
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
