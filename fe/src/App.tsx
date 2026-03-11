import { Route, Routes } from 'react-router-dom';
import MainPage from './pages/Main';
import TrakingInputPage from './pages/TrackingInput';
import ProfilePage from './pages/Profile';
import SellerOnboardingPage from './pages/SellerOnboarding';
import LivePage from './pages/Live';
import LiveCreatePage from './pages/LiveCreate';
import LiveRegisterPage from './pages/LiveCreate/components/LiveRegisterPage';
import LiveEditPage from './pages/LiveCreate/components/LiveEditPage';
import ProductListPage from './pages/ProductList';
import SignUpPage from './pages/SignUp';
import LoginPage from './pages/Login';
import WalletPage from './pages/Wallet';
import SettingsPage from './pages/Settings';
import MainLayout from '@/components/common/layouts/MainLayout';

function App() {
  return (
    <Routes>
      {/* 풀스크린 (Header/Footer 없음) */}
      <Route path="live/:id" element={<LivePage />} />

      <Route path="/" element={<MainLayout />}>
        <Route index element={<MainPage />} />
        <Route path="tracking" element={<TrakingInputPage />} />
        <Route path="profile/:id" element={<ProfilePage />} />
        <Route path="seller/register" element={<SellerOnboardingPage />} />
        <Route path="live/new" element={<LiveCreatePage />} />
        <Route path="live/register" element={<LiveRegisterPage />} />
        <Route path="live/edit/:id" element={<LiveEditPage />} />
        <Route path="products" element={<ProductListPage />} />
        <Route path="signup" element={<SignUpPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="wallet" element={<WalletPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
