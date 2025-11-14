import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import './App.css';
import MainLayout from './layouts/MainLayout';

// 懒加载页面组件
const HomePage = lazy(() => import('./pages/HomePage'));
const FortuneDetail = lazy(() => import('./pages/FortuneDetail'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const CouponsPage = lazy(() => import('./pages/CouponsPage'));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'));
const BrowseHistoryPage = lazy(() => import('./pages/BrowseHistoryPage'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));
const UserAgreementPage = lazy(() => import('./pages/UserAgreementPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const ArticlesPage = lazy(() => import('./pages/ArticlesPage'));
const ArticleDetailPage = lazy(() => import('./pages/ArticleDetailPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const PaymentResultPage = lazy(() => import('./pages/PaymentResultPage'));
const FortuneInputPage = lazy(() => import('./pages/FortuneInputPage'));
const FortuneResultPage = lazy(() => import('./pages/FortuneResultPage'));
const MyFortunesPage = lazy(() => import('./pages/MyFortunesPage'));

// 加载中组件
const LoadingFallback = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
  }}>
    <div style={{
      textAlign: 'center',
      fontSize: '24px',
      color: '#ff6b6b'
    }}>
      <div style={{
        fontSize: '48px',
        marginBottom: '20px',
        animation: 'spin 1s linear infinite'
      }}>⭕</div>
      加载中...
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* 需要底部导航的页面 */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/cart" element={<CartPage />} />
          </Route>

          {/* 不需要底部导航的页面 */}
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/fortune/:id" element={<FortuneDetail />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/coupons" element={<CouponsPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/history" element={<BrowseHistoryPage />} />
          <Route path="/user-agreement" element={<UserAgreementPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/articles" element={<ArticlesPage />} />
          <Route path="/articles/:id" element={<ArticleDetailPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/payment-result" element={<PaymentResultPage />} />
          <Route path="/fortune/:id/input" element={<FortuneInputPage />} />
          <Route path="/fortune-result/:resultId" element={<FortuneResultPage />} />
          <Route path="/my-fortunes" element={<MyFortunesPage />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
