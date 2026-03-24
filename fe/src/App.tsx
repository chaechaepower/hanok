import { Route, Routes } from 'react-router-dom';
import LandingPage from './pages/Landing';
import MainPage from './pages/Main';
import TrakingInputPage from './pages/TrackingInput';
import ProfilePage from './pages/Profile';
import SellerOnboardingPage from './pages/SellerOnboarding';
import LivePage from './pages/Live';
import LiveCreatePage from './pages/LiveCreate';
import ProductListPage from './pages/ProductList';
import SignUpPage from './pages/SignUp';
import LoginPage from './pages/Login';
import WalletPage from './pages/Wallet';
import SettingsPage from './pages/Settings';
import MainLayout from '@/components/common/layouts/MainLayout';
import SellerOnlyRoute from '@/routes/SellerOnlyRoute';
import LiveRegisterPage from './components/LiveCreate/LiveRegisterPage';
import SearchPage from './pages/Search';
import SellerReportPage from './pages/SellerReport';
import AdminPage from './pages/Admin';
import AdminOnlyRoute from '@/routes/AdminOnlyRoute';
import NftReceiptPage from './pages/NftReceipt';

function App() {
  return (
    <Routes>
      {/* 랜딩 페이지 (Header/Footer 없음) */}
      <Route index element={<LandingPage />} />

      {/* 풀스크린 (Header/Footer 없음) */}
      <Route path="live/:id" element={<LivePage />} />

      {/* 관리자 전용 (Header/Footer 없음) */}
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
        <Route path="nft-receipt/:escrowId" element={<NftReceiptPage />} />
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
  );
}

export default App;
