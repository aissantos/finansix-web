import { Users, TrendingUp, AlertCircle, Activity } from 'lucide-react';
import { MetricCard } from '@/admin/components/metrics/MetricCard';
import { ActivityFeed } from '@/admin/components/activity/ActivityFeed';
import { TransactionChart } from '@/admin/components/charts/TransactionChart';
import { RecentUsersTable } from '@/admin/components/tables/RecentUsersTable';
import { useDashboardMetrics } from '@/admin/hooks/useDashboardMetrics';

export default function AdminDashboard() {
  const { data: metrics, isLoading } = useDashboardMetrics();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Visão geral do sistema e métricas em tempo real
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Usuários Ativos"
          value={metrics?.activeUsers.value || 0}
          delta={metrics?.activeUsers.delta}
          icon={Users}
          isLoading={isLoading}
        />
        <MetricCard
          title="Transações Hoje"
          value={metrics?.transactionsToday.value || 0}
          delta={metrics?.transactionsToday.delta}
          icon={TrendingUp}
          isLoading={isLoading}
        />
        <MetricCard
          title="Taxa de Erro"
          value={`${metrics?.errorRate.value || 0}%`}
          delta={metrics?.errorRate.delta}
          icon={AlertCircle}
          isLoading={isLoading}
        />
        <MetricCard
          title="Saúde do Sistema"
          value={`${metrics?.systemHealth.value || 0}%`}
          icon={Activity}
          isLoading={isLoading}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts and Tables */}
        <div className="lg:col-span-2 space-y-6">
          {/* Transaction Trend Chart */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
              Transações (Últimos 7 dias)
            </h2>
            <TransactionChart />
          </div>

          {/* Recent Users Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
              Usuários Recentes
            </h2>
            <RecentUsersTable />
          </div>
        </div>

        {/* Right Column - Activity Feed */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
              Atividades Recentes
            </h2>
            <ActivityFeed />
          </div>
        </div>
      </div>
    </div>
  );
}
