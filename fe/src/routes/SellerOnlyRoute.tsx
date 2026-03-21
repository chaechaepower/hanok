import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useGetSellerStatus } from '@/api/hooks/useGetSellerStatus';

import Loading from '../components/common/layouts/Loading';

export default function SellerOnlyRoute() {
  const location = useLocation();
  const isLoggedIn = Boolean(localStorage.getItem('accessToken'));
  const { data: sellerStatus, isLoading } = useGetSellerStatus(isLoggedIn);

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (isLoading) {
    return <Loading />;
  }

  if (!sellerStatus?.isSeller) {
    return <Navigate to="/seller/register" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
