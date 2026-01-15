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
const NewAccountPage = lazy(() => import('@/pages/wallet/NewAccountPage'));
const EditAccountPage = lazy(() => import('@/pages/wallet/EditAccountPage'));
const AccountDetailPage = lazy(() => import('@/pages/wallet/AccountDetailPage'));
const SubscriptionsPage = lazy(() => import('@/pages/wallet/SubscriptionsPage'));

// Transaction pages
const EditTransactionPage = lazy(() => import('@/pages/EditTransactionPage'));
const AllTransactionsPage = lazy(() => import('@/pages/AllTransactionsPage'));

// Settings pages
const CategoriesPage = lazy(() => import('@/pages/CategoriesPage'));
const HouseholdPage = lazy(() => import('@/pages/HouseholdPage'));

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
            </Route>

            {/* Full-screen protected routes (no bottom nav) */}
            <Route
              path="/transactions"
              element={
                <ProtectedRoute>
                  <AllTransactionsPage />
                </ProtectedRoute>
              }
            />
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
            <Route
              path="/subscriptions"
              element={
                <ProtectedRoute>
                  <SubscriptionsPage />
                </ProtectedRoute>
              }
            />

            {/* Settings routes */}
            <Route
              path="/categories"
              element={
                <ProtectedRoute>
                  <CategoriesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/household"
              element={
                <ProtectedRoute>
                  <HouseholdPage />
                </ProtectedRoute>
              }
            />

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
          <AuthProvider>
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
                <AnimatedRoutes />
                <PWAInstallBanner />
                <Toaster />
              </div>
            </BrowserRouter>
          </AuthProvider>
        </QueryErrorBoundary>
        
        {import.meta.env.DEV && (
          <ReactQueryDevtools initialIsOpen={false} position="bottom" />
        )}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}