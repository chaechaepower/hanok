import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import Loading from '@/components/common/layouts/Loading';
import MainLayout from '@/components/common/layouts/MainLayout';
import AdminOnlyRoute from '@/routes/AdminOnlyRoute';
import SellerOnlyRoute from '@/routes/SellerOnlyRoute';

import MainPage from './pages/Main';
import SellerOnboardingPage from './pages/SellerOnboarding';
import ProductListPage from './pages/ProductList';
import SignUpPage from './pages/SignUp';
import LoginPage from './pages/Login';

const LivePage = lazy(() => import('./pages/Live'));
const ProfilePage = lazy(() => import('./pages/Profile'));
const SearchPage = lazy(() => import('./pages/Search'));
const WalletPage = lazy(() => import('./pages/Wallet'));
const TrakingInputPage = lazy(() => import('./pages/TrackingInput'));
const LiveCreatePage = lazy(() => import('./pages/LiveCreate'));
const SettingsPage = lazy(() => import('./pages/Settings'));
const LiveRegisterPage = lazy(() => import('./pages/LiveRegister'));
const SellerReportPage = lazy(() => import('./pages/SellerReport'));
const AdminPage = lazy(() => import('./pages/Admin'));

function App() {
  return (
    <Suspense fallback={<Loading size={32} />}>
      <Routes>
        <Route index element={<Navigate to="/main" replace />} />

        <Route path="live/:id" element={<LivePage />} />

        <Route element={<AdminOnlyRoute />}>
          <Route path="admin" element={<AdminPage />} />
        </Route>

        <Route element={<MainLayout />}>
          <Route path="main" element={<MainPage />} />
          <Route path="profile/:id" element={<ProfilePage />} />
          <Route path="seller/register" element={<SellerOnboardingPage />} />
          <Route path="signup" element={<SignUpPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="wallet" element={<WalletPage />} />
          <Route path="settings" element={<SettingsPage />} />

          <Route element={<SellerOnlyRoute />}>
            <Route path="tracking" element={<TrakingInputPage />} />
            <Route path="lives" element={<LiveCreatePage />} />
            <Route path="live/register" element={<LiveRegisterPage />} />
            <Route path="products" element={<ProductListPage />} />
            <Route path="seller/report" element={<SellerReportPage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
