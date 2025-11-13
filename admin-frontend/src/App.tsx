import { Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import UserManagement from './pages/UserManagement'
import OrderManagement from './pages/OrderManagement'
import FortuneManagement from './pages/FortuneManagement'
import Statistics from './pages/Statistics'
import Settings from './pages/Settings'
import AuditLog from './pages/AuditLog'
import RoleManagement from './pages/RoleManagement'
import BannerManagement from './pages/BannerManagement'
import NotificationManagement from './pages/NotificationManagement'
import FinancialManagement from './pages/FinancialManagement'
import RefundManagement from './pages/RefundManagement'
import FeedbackManagement from './pages/FeedbackManagement'
import ReviewManagement from './pages/ReviewManagement'
import CouponManagement from './pages/CouponManagement'
import ProfileSettings from './pages/ProfileSettings'
import AdminManagement from './pages/AdminManagement'
import FortuneCategoryManagement from './pages/FortuneCategoryManagement'
import FortuneServiceManagement from './pages/FortuneServiceManagement'
import SystemConfigManagement from './pages/SystemConfigManagement'
import FortuneTemplateManagement from './pages/FortuneTemplateManagement'
import DailyHoroscopeManagement from './pages/DailyHoroscopeManagement'
import ArticleManagement from './pages/ArticleManagement'
import AIModelManagement from './pages/AIModelManagement'
import Login from './pages/Login'
import PrivateRoute from './components/PrivateRoute'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="orders" element={<OrderManagement />} />
        <Route path="fortunes" element={<FortuneManagement />} />
        <Route path="fortune-categories" element={<FortuneCategoryManagement />} />
        <Route path="fortune-services" element={<FortuneServiceManagement />} />
        <Route path="fortune-templates" element={<FortuneTemplateManagement />} />
        <Route path="daily-horoscopes" element={<DailyHoroscopeManagement />} />
        <Route path="articles" element={<ArticleManagement />} />
        <Route path="ai-models" element={<AIModelManagement />} />
        <Route path="system-configs" element={<SystemConfigManagement />} />
        <Route path="statistics" element={<Statistics />} />
        <Route path="financial" element={<FinancialManagement />} />
        <Route path="refunds" element={<RefundManagement />} />
        <Route path="feedbacks" element={<FeedbackManagement />} />
        <Route path="reviews" element={<ReviewManagement />} />
        <Route path="coupons" element={<CouponManagement />} />
        <Route path="banners" element={<BannerManagement />} />
        <Route path="notifications" element={<NotificationManagement />} />
        <Route path="roles" element={<RoleManagement />} />
        <Route path="admins" element={<AdminManagement />} />
        <Route path="audit-log" element={<AuditLog />} />
        <Route path="profile" element={<ProfileSettings />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}

export default App
