import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import './App.css';
import MainLayout from './layouts/MainLayout';
import ToastContainer from './components/ToastContainer';
import ChatWidget from './components/ChatWidget';
import ErrorBoundary from './components/ErrorBoundary';
import PageTransition from './components/PageTransition';
import BackToTop from './components/BackToTop';
import BottomNav from './components/BottomNav';

// 懒加载页面组件
const HomePage = lazy(() => import('./pages/HomePage'));
const FortuneDetail = lazy(() => import('./pages/FortuneDetail'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
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
const NotificationCenterPage = lazy(() => import('./pages/NotificationCenterPage'));
const DailyHoroscopePage = lazy(() => import('./pages/DailyHoroscopePage'));
const FeedbackPage = lazy(() => import('./pages/FeedbackPage'));
const HelpCenterPage = lazy(() => import('./pages/HelpCenterPage'));
const ProfileEditPage = lazy(() => import('./pages/ProfileEditPage'));
const BalancePage = lazy(() => import('./pages/BalancePage'));
const ChangePasswordPage = lazy(() => import('./pages/ChangePasswordPage'));
const MyReviewsPage = lazy(() => import('./pages/MyReviewsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const CustomerServicePage = lazy(() => import('./pages/CustomerServicePage'));

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

// 包装组件用于访问路由
const AppContent = () => {
  const location = useLocation();

  // 需要显示底部导航栏的页面路径
  const showBottomNav = [
    '/',
    '/categories',
    '/cart',
    '/profile',
    '/orders',
    '/coupons',
    '/favorites',
    '/history',
    '/my-fortunes',
    '/articles',
    '/daily-horoscope',
    '/notifications',
    '/my-reviews',
    '/settings',
  ].includes(location.pathname);

  return (
    <>
      <ToastContainer />
      <ChatWidget />
      <BackToTop showAfter={300} />
      <Suspense fallback={<LoadingFallback />}>
        <PageTransition mode="fade" duration={300}>
          <Routes>
              {/* 有底部导航的页面 */}
              <Route element={<MainLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/coupons" element={<CouponsPage />} />
                <Route path="/favorites" element={<FavoritesPage />} />
                <Route path="/history" element={<BrowseHistoryPage />} />
                <Route path="/my-fortunes" element={<MyFortunesPage />} />
                <Route path="/articles" element={<ArticlesPage />} />
                <Route path="/daily-horoscope" element={<DailyHoroscopePage />} />
                <Route path="/notifications" element={<NotificationCenterPage />} />
                <Route path="/my-reviews" element={<MyReviewsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>

              {/* 无底部导航的页面（详情页、表单页等） */}
              <Route path="/fortune/:id" element={<FortuneDetail />} />
              <Route path="/fortune/:id/input" element={<FortuneInputPage />} />
              <Route path="/fortune-result/:resultId" element={<FortuneResultPage />} />
              <Route path="/articles/:id" element={<ArticleDetailPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/payment-result" element={<PaymentResultPage />} />
              <Route path="/feedback" element={<FeedbackPage />} />
              <Route path="/help" element={<HelpCenterPage />} />
              <Route path="/profile/edit" element={<ProfileEditPage />} />
              <Route path="/balance" element={<BalancePage />} />
              <Route path="/profile/password" element={<ChangePasswordPage />} />
              <Route path="/user-agreement" element={<UserAgreementPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/customer-service" element={<CustomerServicePage />} />
            </Routes>
          </PageTransition>
        </Suspense>
        {/* 底部导航栏放在PageTransition外面,避免transform影响fixed定位 */}
        {showBottomNav && <BottomNav />}
      </>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AppContent />
      </Router>
    </ErrorBoundary>
  );
}

export default App;
