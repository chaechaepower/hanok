import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';

import Loading from '@/components/common/layouts/Loading';
import MainLayout from '@/components/common/layouts/MainLayout';
import AdminOnlyRoute from '@/routes/AdminOnlyRoute';
import SellerOnlyRoute from '@/routes/SellerOnlyRoute';

import LandingPage from './pages/Landing';
import MainPage from './pages/Main';
import ProfilePage from './pages/Profile';
import SellerOnboardingPage from './pages/SellerOnboarding';
import LivePage from './pages/Live';
import ProductListPage from './pages/ProductList';
import SignUpPage from './pages/SignUp';
import LoginPage from './pages/Login';
import WalletPage from './pages/Wallet';
import SearchPage from './pages/Search';

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
        <Route index element={<LandingPage />} />

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
