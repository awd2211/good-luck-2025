import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { Spin } from 'antd'
import MainLayout from './layouts/MainLayout'
import PrivateRoute from './components/PrivateRoute'
import ErrorBoundary from './components/ErrorBoundary'

// 非懒加载的关键页面（登录、错误等）
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import DiagnosticPage from './pages/DiagnosticPage'

// 懒加载所有其他页面
const Dashboard = lazy(() => import('./pages/Dashboard'))
const UserManagement = lazy(() => import('./pages/UserManagement'))
const OrderManagement = lazy(() => import('./pages/OrderManagement'))
const FortuneManagement = lazy(() => import('./pages/FortuneManagement'))
const Statistics = lazy(() => import('./pages/Statistics'))
const AuditLog = lazy(() => import('./pages/AuditLog'))
const RoleManagement = lazy(() => import('./pages/RoleManagement'))
const BannerManagement = lazy(() => import('./pages/BannerManagement'))
const NotificationManagement = lazy(() => import('./pages/NotificationManagement'))
const NotificationTemplates = lazy(() => import('./pages/NotificationTemplates'))
const FinancialManagement = lazy(() => import('./pages/FinancialManagement'))
const RefundManagement = lazy(() => import('./pages/RefundManagement'))
const FeedbackManagement = lazy(() => import('./pages/FeedbackManagement'))
const ReviewManagement = lazy(() => import('./pages/ReviewManagement'))
const CouponManagement = lazy(() => import('./pages/CouponManagement'))
const ProfileSettings = lazy(() => import('./pages/ProfileSettings'))
const AdminManagement = lazy(() => import('./pages/AdminManagement'))
const FortuneCategoryManagement = lazy(() => import('./pages/FortuneCategoryManagement'))
const FortuneServiceManagement = lazy(() => import('./pages/FortuneServiceManagement'))
const SystemConfigManagement = lazy(() => import('./pages/SystemConfigManagement'))
const TechnicalConfigManagement = lazy(() => import('./pages/TechnicalConfigManagement'))
const FortuneTemplateManagement = lazy(() => import('./pages/FortuneTemplateManagement'))
const DailyHoroscopeManagement = lazy(() => import('./pages/DailyHoroscopeManagement'))
const ArticleManagement = lazy(() => import('./pages/ArticleManagement'))
const AIModelManagement = lazy(() => import('./pages/AIModelManagement'))
const AttributionAnalytics = lazy(() => import('./pages/AttributionAnalytics'))
const ConversionAnalytics = lazy(() => import('./pages/ConversionAnalytics'))
const PaymentConfigManagement = lazy(() => import('./pages/PaymentConfigManagement'))
const PaymentMethodManagement = lazy(() => import('./pages/PaymentMethodManagement'))
const PaymentTransactions = lazy(() => import('./pages/PaymentTransactions'))
const EmailTemplateManagement = lazy(() => import('./pages/EmailTemplateManagement'))
const EmailNotificationConfig = lazy(() => import('./pages/EmailNotificationConfig'))
const EmailSendHistory = lazy(() => import('./pages/EmailSendHistory'))
const CustomerServiceManagement = lazy(() => import('./pages/CustomerServiceManagement'))
const CSWorkbench = lazy(() => import('./pages/CSWorkbench'))
const CSSatisfactionStatistics = lazy(() => import('./pages/CSSatisfactionStatistics'))
const CSPerformance = lazy(() => import('./pages/CSPerformance'))
const AIBotConfiguration = lazy(() => import('./pages/AIBotConfiguration'))
const QuickReplyManagement = lazy(() => import('./pages/QuickReplyManagement'))
const CSQualityInspection = lazy(() => import('./pages/CSQualityInspection'))
const CSSensitiveWords = lazy(() => import('./pages/CSSensitiveWords'))
const CustomerTagManagement = lazy(() => import('./pages/CustomerTagManagement'))
const CustomerNoteManagement = lazy(() => import('./pages/CustomerNoteManagement'))
const SessionTransferManagement = lazy(() => import('./pages/SessionTransferManagement'))
const KnowledgeBase = lazy(() => import('./pages/KnowledgeBase'))
const CSScheduleManagement = lazy(() => import('./pages/CSScheduleManagement'))
const TrainingManagement = lazy(() => import('./pages/TrainingManagement'))
const CustomerProfile = lazy(() => import('./pages/CustomerProfile'))
const ShareAnalytics = lazy(() => import('./pages/ShareAnalytics'))

// 加载中组件
const LoadingFallback = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px'
  }}>
    <Spin size="large" tip="加载中..." />
  </div>
)

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/diagnostic" element={<DiagnosticPage />} />
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
        <Route path="attribution" element={<AttributionAnalytics />} />
        <Route path="conversion-analytics" element={<ConversionAnalytics />} />
        <Route path="share-analytics" element={<ShareAnalytics />} />
        <Route path="fortunes" element={<FortuneManagement />} />
        <Route path="fortune-categories" element={<FortuneCategoryManagement />} />
        <Route path="fortune-services" element={<FortuneServiceManagement />} />
        <Route path="fortune-templates" element={<FortuneTemplateManagement />} />
        <Route path="daily-horoscopes" element={<DailyHoroscopeManagement />} />
        <Route path="articles" element={<ArticleManagement />} />
        <Route path="ai-models" element={<AIModelManagement />} />
        <Route path="system-configs" element={<SystemConfigManagement />} />
        <Route path="technical-configs" element={<TechnicalConfigManagement />} />
        <Route path="statistics" element={<Statistics />} />
        <Route path="financial" element={<FinancialManagement />} />
        <Route path="payment-transactions" element={<PaymentTransactions />} />
        <Route path="payment-methods" element={<PaymentMethodManagement />} />
        <Route path="payment-configs" element={<PaymentConfigManagement />} />
        <Route path="refunds" element={<RefundManagement />} />
        <Route path="feedbacks" element={<FeedbackManagement />} />
        <Route path="reviews" element={<ReviewManagement />} />
        <Route path="coupons" element={<CouponManagement />} />
        <Route path="banners" element={<BannerManagement />} />
        <Route path="notifications" element={<NotificationManagement />} />
        <Route path="notification-templates" element={<NotificationTemplates />} />
        <Route path="email-templates" element={<EmailTemplateManagement />} />
        <Route path="email-notification-configs" element={<EmailNotificationConfig />} />
        <Route path="email-send-history" element={<EmailSendHistory />} />
        <Route path="customer-service" element={<CustomerServiceManagement />} />
        <Route path="cs-workbench" element={<CSWorkbench />} />
        <Route path="cs-satisfaction" element={<CSSatisfactionStatistics />} />
        <Route path="cs-performance" element={<CSPerformance />} />
        <Route path="ai-bot-config" element={<AIBotConfiguration />} />
        <Route path="quick-replies" element={<QuickReplyManagement />} />
        <Route path="cs-quality" element={<CSQualityInspection />} />
        <Route path="cs-sensitive-words" element={<CSSensitiveWords />} />
        <Route path="customer-tags" element={<CustomerTagManagement />} />
        <Route path="customer-notes" element={<CustomerNoteManagement />} />
        <Route path="session-transfers" element={<SessionTransferManagement />} />
        <Route path="knowledge-base" element={<KnowledgeBase />} />
        <Route path="cs-schedule" element={<CSScheduleManagement />} />
        <Route path="training" element={<TrainingManagement />} />
        <Route path="customer-profile" element={<CustomerProfile />} />
        <Route path="roles" element={<RoleManagement />} />
        <Route path="admins" element={<AdminManagement />} />
        <Route path="audit-log" element={<AuditLog />} />
        <Route path="profile" element={<ProfileSettings />} />
      </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}

export default App
