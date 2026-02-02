import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserProfileCard } from '@/admin/components/users/UserProfileCard';
import { UserHouseholdInfo } from '@/admin/components/users/UserHouseholdInfo';
import { UserStatistics } from '@/admin/components/users/UserStatistics';
import { UserActivityTimeline } from '@/admin/components/users/UserActivityTimeline';
import { useUserDetail } from '@/admin/hooks/useUserDetail';

export default function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { data: user, isLoading } = useUserDetail(userId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
            <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
          </div>
          <div className="space-y-6">
            <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
            <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-slate-500 dark:text-slate-400 mb-4">Usuário não encontrado</p>
        <Button onClick={() => navigate('/admin/users')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Usuários
        </Button>
      </div>
    );
  }

  const handleEdit = () => {
    navigate(`/admin/users/${userId}/edit`);
  };

  const handleDeactivate = () => {
    // TODO: Implement deactivate user functionality
    // NOTE: This requires adding a 'status' field to household_members table
    // Suggested implementation:
    // 1. Add 'status' enum column: 'active' | 'inactive'
    // 2. Update RLS policies to filter inactive users
    // 3. Create mutation in useUserMutations hook
    // 4. Add confirmation dialog before deactivation
    console.warn('Deactivate user not yet implemented - requires database schema changes');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/users')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Detalhes do Usuário
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Visualize informações detalhadas e atividades do usuário
          </p>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <UserProfileCard user={user} onEdit={handleEdit} onDeactivate={handleDeactivate} />
          <UserActivityTimeline userId={user.user_id} />
        </div>

        {/* Right Column - Stats & Household */}
        <div className="space-y-6">
          <UserHouseholdInfo user={user} />
          <UserStatistics user={user} />
        </div>
      </div>
    </div>
  );
}
