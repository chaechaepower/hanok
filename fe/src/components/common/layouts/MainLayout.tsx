import { Outlet, useLocation } from 'react-router-dom';
import { Suspense } from 'react';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';

import Footer from '@/components/common/layouts/Footer';
import Loading from '@/components/common/layouts/Loading';
import Header from '@/components/common/layouts/Header';
import MainSkeleton from '@/components/Main/MainSkeleton';
import useScrollToTop from '@/hooks/useScrollToTop';
import ErrorComponent from '@/components/common/layouts/Error';

export default function MainLayout() {
  const location = useLocation();
  const renderSkeleton = () => {
    if (location.pathname === '/') return <MainSkeleton />;
    return <Loading size={50} />;
  };

  useScrollToTop();

  return (
    <>
      <Header />
      <div className="relative mx-auto flex min-h-screen w-full flex-col">
        <div className="flex w-full flex-1 flex-col items-center pb-10 md:pt-0 pt-16">
          <QueryErrorResetBoundary>
            {({ reset }) => (
              <ErrorBoundary FallbackComponent={ErrorComponent} onReset={reset}>
                <Suspense fallback={renderSkeleton()}>
                  <Outlet />
                </Suspense>
              </ErrorBoundary>
            )}
          </QueryErrorResetBoundary>
        </div>

        <Footer />
      </div>
    </>
  );
}
