import { useEffect, useState, type FormEvent } from 'react';
import { Outlet } from 'react-router-dom';

import {
  ADMIN_ROUTE_AUTH_EVENT,
  ADMIN_ROUTE_ID,
  ADMIN_ROUTE_PASSWORD,
  isAdminRouteAuthenticated,
  setAdminRouteAuthenticated,
} from '@/constants/adminAccess';

export default function AdminOnlyRoute() {
  const [adminId, setAdminId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(() => isAdminRouteAuthenticated());

  useEffect(() => {
    const syncAuthState = () => {
      setIsAuthenticated(isAdminRouteAuthenticated());
    };

    window.addEventListener(ADMIN_ROUTE_AUTH_EVENT, syncAuthState);
    window.addEventListener('storage', syncAuthState);

    return () => {
      window.removeEventListener(ADMIN_ROUTE_AUTH_EVENT, syncAuthState);
      window.removeEventListener('storage', syncAuthState);
    };
  }, []);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (adminId === ADMIN_ROUTE_ID && adminPassword === ADMIN_ROUTE_PASSWORD) {
      setAdminRouteAuthenticated();
      setIsAuthenticated(true);
      setError('');
      return;
    }

    setError('관리자 계정 정보가 일치하지 않습니다.');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center px-4">
        <div className="w-full max-w-[420px] rounded-3xl border border-neutral-800 bg-surface-elevated p-8 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
          <div className="mb-8">
            <p className="text-xs font-semibold tracking-[0.24em] text-neutral-500 uppercase mb-3">Admin Access</p>
            <h1 className="text-3xl font-bold text-neutral-100 mb-2">관리자 페이지</h1>
            <p className="text-sm text-neutral-400">지정된 관리자 아이디와 비밀번호를 입력하면 바로 진입합니다</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="admin-route-id" className="text-sm font-medium text-neutral-300">
                아이디
              </label>
              <input
                id="admin-route-id"
                type="text"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                className="h-12 rounded-xl border border-neutral-700 bg-background px-4 text-sm text-neutral-100 outline-none transition-colors focus:border-primary"
                placeholder="관리자 아이디"
                autoComplete="username"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="admin-route-password" className="text-sm font-medium text-neutral-300">
                비밀번호
              </label>
              <input
                id="admin-route-password"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="h-12 rounded-xl border border-neutral-700 bg-background px-4 text-sm text-neutral-100 outline-none transition-colors focus:border-primary"
                placeholder="관리자 비밀번호"
                autoComplete="current-password"
              />
            </div>

            {error && <p className="text-sm text-accent-light">{error}</p>}

            <button
              type="submit"
              className="mt-2 h-12 rounded-xl bg-neutral-100 text-sm font-semibold text-background transition-colors hover:bg-neutral-200"
            >
              관리자 페이지 입장
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
