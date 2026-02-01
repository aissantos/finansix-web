import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { motion, AnimatePresence } from 'framer-motion';
import { queryClient } from '@/lib/query-client';
import { Toaster } from '@/components/ui/toaster';
import { AppLayout } from '@/components/layout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { QueryErrorBoundary } from '@/components/QueryErrorBoundary';
import { PWAInstallBanner } from '@/components/features';
import { useAuth } from '@/hooks/useAuth';
import { AuthProvider } from '@/contexts/AuthContext';
import { SystemConfigProvider } from '@/contexts/SystemConfigContext';

// Lazy load pages for better initial bundle size
const HomePage = lazy(() => import('@/pages/HomePage'));
const WalletPage = lazy(() => import('@/pages/WalletPage'));
const AnalysisPage = lazy(() => import('@/pages/AnalysisPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const NewTransactionPage = lazy(() => import('@/pages/NewTransactionPage'));
const NewExpensePage = lazy(() => import('@/pages/NewExpensePage'));
const NewIncomePage = lazy(() => import('@/pages/NewIncomePage'));
const TransferPage = lazy(() => import('@/pages/TransferPage'));
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));

// Wallet sub-pages
const NewCardPage = lazy(() => import('@/pages/wallet/NewCardPage'));
const EditCardPage = lazy(() => import('@/pages/wallet/EditCardPage'));
const CardDetailPage = lazy(() => import('@/pages/wallet/CardDetailPage'));
const InvoiceDetailsPage = lazy(() => import('@/pages/wallet/InvoiceDetailsPage'));
const NewAccountPage = lazy(() => import('@/pages/wallet/NewAccountPage'));
const EditAccountPage = lazy(() => import('@/pages/wallet/EditAccountPage'));
const AccountDetailPage = lazy(() => import('@/pages/wallet/AccountDetailPage'));

// Transaction pages
const EditTransactionPage = lazy(() => import('@/pages/EditTransactionPage'));
const AllTransactionsPage = lazy(() => import('@/pages/AllTransactionsPage'));
const AccountsPayablePage = lazy(() => import('@/pages/AccountsPayablePage'));

// Settings pages
const CategoriesPage = lazy(() => import('@/pages/CategoriesPage'));
const HouseholdPage = lazy(() => import('@/pages/HouseholdPage'));

// Admin pages
const AdminDashboard = lazy(() => import('@/admin/pages/Dashboard'));
const AdminUsersPage = lazy(() => import('@/admin/pages/Users'));
const AdminUserDetailPage = lazy(() => import('@/admin/pages/UserDetail'));
const AdminAnalyticsPage = lazy(() => import('@/admin/pages/Analytics'));
const AdminAuthLayout = lazy(() => import('@/admin/layouts/AuthLayout'));
const AdminLayout = lazy(() => import('@/admin/layouts/AdminLayout'));
const AdminSettingsPage = lazy(() => import('@/admin/pages/Settings').then(module => ({ default: module.SettingsPage })));
const AdminAuditPage = lazy(() => import('@/admin/pages/AuditLogs').then(module => ({ default: module.AuditLogsPage })));
const AdminTransactionsPage = lazy(() => import('@/admin/pages/Transactions/List').then(module => ({ default: module.TransactionsListPage })));
const AdminSystemHealthPage = lazy(() => import('@/admin/pages/SystemHealth/SystemHealth').then(module => ({ default: module.SystemHealthPage })));
const AdminFeatureFlagsPage = lazy(() => import('@/admin/pages/FeatureFlags/List').then(module => ({ default: module.FeatureFlagsListPage })));
const AdminLoginPage = lazy(() => import('@/admin/pages/auth/Login'));
const AdminSetup2FA = lazy(() => import('@/admin/pages/auth/Setup2FA'));
const AdminVerify2FA = lazy(() => import('@/admin/pages/auth/Verify2FA'));
const AdminProtectedRoute = lazy(() => import('@/admin/components/AdminProtectedRoute'));

// Loading component for Suspense
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-primary animate-pulse" />
        <p className="text-sm text-slate-500 animate-pulse">Carregando...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
      >
        <Suspense fallback={<PageLoader />}>
          <Routes location={location}>
            {/* Auth Routes */}
            <Route
              path="/auth/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/auth/register"
              element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              }
            />

            {/* Protected App Routes with bottom nav */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<HomePage />} />
              <Route path="wallet" element={<WalletPage />} />
              <Route path="analysis" element={<AnalysisPage />} />
              <Route path="profile" element={<ProfilePage />} />
              
              {/* Feature Pages in Layout */}
              <Route path="transactions" element={<AllTransactionsPage />} />
              <Route path="accounts-payable" element={<AccountsPayablePage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="household" element={<HouseholdPage />} />
            </Route>

            {/* Full-screen protected routes (no bottom nav) */}
            <Route
              path="/transactions/new"
              element={
                <ProtectedRoute>
                  <NewTransactionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/expense/new"
              element={
                <ProtectedRoute>
                  <NewExpensePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/income/new"
              element={
                <ProtectedRoute>
                  <NewIncomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transfer/new"
              element={
                <ProtectedRoute>
                  <TransferPage />
                </ProtectedRoute>
              }
            />
            
            {/* Wallet management routes */}
            <Route
              path="/cards/new"
              element={
                <ProtectedRoute>
                  <NewCardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cards/:id"
              element={
                <ProtectedRoute>
                  <CardDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cards/:id/edit"
              element={
                <ProtectedRoute>
                  <EditCardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cards/:id/invoice/:month"
              element={
                <ProtectedRoute>
                  <InvoiceDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/accounts/new"
              element={
                <ProtectedRoute>
                  <NewAccountPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/accounts/:id"
              element={
                <ProtectedRoute>
                  <AccountDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/accounts/:id/edit"
              element={
                <ProtectedRoute>
                  <EditAccountPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transactions/:id/edit"
              element={
                <ProtectedRoute>
                  <EditTransactionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transfer"
              element={
                <ProtectedRoute>
                  <TransferPage />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route path="/admin">
                <Route element={<AdminAuthLayout />}>
                    <Route path="auth/login" element={<AdminLoginPage />} />
                    <Route path="auth/setup-2fa" element={<AdminSetup2FA />} />
                    <Route path="auth/verify-2fa" element={<AdminVerify2FA />} />
                    <Route path="login" element={<Navigate to="auth/login" replace />} />
                </Route>
                
                <Route element={<AdminProtectedRoute />}>
                    <Route element={<AdminLayout />}>
                        <Route path="" element={<AdminDashboard />} /> 
                        <Route path="dashboard" element={<Navigate to="/admin" replace />} />
                        <Route path="users" element={<AdminUsersPage />} />
                        <Route path="users/:userId" element={<AdminUserDetailPage />} />
                        <Route path="analytics" element={<AdminAnalyticsPage />} />
                        <Route path="settings" element={<AdminSettingsPage />} />
                        <Route path="audit" element={<AdminAuditPage />} />
                        <Route path="transactions" element={<AdminTransactionsPage />} />
                        <Route path="system-health" element={<AdminSystemHealthPage />} />
                        <Route path="feature-flags" element={<AdminFeatureFlagsPage />} />
                    </Route>
                </Route>
            </Route>


            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <QueryErrorBoundary>
          <SystemConfigProvider>
            <AuthProvider>
              <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
                <AnimatedRoutes />
                <PWAInstallBanner />
                <Toaster />
              </div>
            </BrowserRouter>
          </AuthProvider>
          </SystemConfigProvider>
        </QueryErrorBoundary>
        
        {import.meta.env.DEV && (
          <ReactQueryDevtools initialIsOpen={false} position="bottom" />
        )}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}