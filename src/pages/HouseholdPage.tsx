import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Users, 
  UserPlus, 
  Crown, 
  Shield, 
  User,
  Mail,
  MoreVertical,
  Edit3,
  Trash2,
  X,
  Check,
  Clock,
  Send,
  Copy,
  AlertTriangle,
} from 'lucide-react';
import { Header, PageContainer } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { 
  useHousehold, 
  useHouseholdMembers, 
  useUpdateHousehold,
  useCreateInvite,
  usePendingInvites,
  useCancelInvite,
  useRemoveMember,
  useUpdateMemberRole,
} from '@/hooks/useHousehold';
import { useAuth } from '@/hooks';
import { toast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

type MemberRole = 'owner' | 'admin' | 'member';

const ROLE_CONFIG: Record<MemberRole, { label: string; icon: React.ReactNode; color: string }> = {
  owner: { 
    label: 'Proprietário', 
    icon: <Crown className="h-3 w-3" />, 
    color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' 
  },
  admin: { 
    label: 'Administrador', 
    icon: <Shield className="h-3 w-3" />, 
    color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' 
  },
  member: { 
    label: 'Membro', 
    icon: <User className="h-3 w-3" />, 
    color: 'text-slate-600 bg-slate-100 dark:bg-slate-800' 
  },
};

export default function HouseholdPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { data: household, isLoading: householdLoading } = useHousehold();
  const { data: members, isLoading: membersLoading } = useHouseholdMembers();
  const { data: invites } = usePendingInvites();
  
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [householdName, setHouseholdName] = useState('');

  const isLoading = householdLoading || membersLoading;
  
  // Encontrar o membro atual e verificar se é owner
  const currentMember = members?.find(m => m.user_id === user?.id);
  const isOwner = currentMember?.role === 'owner';

  const handleEditName = () => {
    setHouseholdName(household?.name || '');
    setEditingName(true);
  };

  if (isLoading) {
    return (
      <>
        <Header title="Família" showBack onBack={() => navigate(-1)} />
        <PageContainer className="space-y-6 pt-6">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Header title="Família" showBack onBack={() => navigate(-1)} />
      <PageContainer className="space-y-6 pt-6 pb-24">
        {/* Household Info */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Users className="h-7 w-7 text-primary" />
              </div>
              <div>
                {editingName ? (
                  <HouseholdNameEditor
                    initialName={household?.name || ''}
                    onClose={() => setEditingName(false)}
                  />
                ) : (
                  <>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {household?.name || 'Minha Família'}
                    </h2>
                    <p className="text-sm text-slate-500">
                      {members?.length || 0} membro{(members?.length || 0) !== 1 ? 's' : ''}
                    </p>
                  </>
                )}
              </div>
            </div>
            {isOwner && !editingName && (
              <button
                onClick={handleEditName}
                className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-primary transition-colors"
              >
                <Edit3 className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20">
              <p className="text-2xl font-black text-amber-600">
                {members?.filter(m => m.role === 'owner').length || 0}
              </p>
              <p className="text-[10px] font-bold text-amber-600 uppercase">Proprietários</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20">
              <p className="text-2xl font-black text-blue-600">
                {members?.filter(m => m.role === 'admin').length || 0}
              </p>
              <p className="text-[10px] font-bold text-blue-600 uppercase">Admins</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
              <p className="text-2xl font-black text-slate-600">
                {members?.filter(m => m.role === 'member').length || 0}
              </p>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Membros</p>
            </div>
          </div>
        </Card>

        {/* Invite Button */}
        {isOwner && (
          <Button
            onClick={() => setShowInviteForm(true)}
            className="w-full"
            size="lg"
          >
            <UserPlus className="h-5 w-5 mr-2" />
            Convidar Familiar
          </Button>
        )}

        {/* Invite Form Modal */}
        {showInviteForm && (
          <InviteForm onClose={() => setShowInviteForm(false)} />
        )}

        {/* Pending Invites */}
        {invites && invites.length > 0 && (
          <section>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">
              Convites Pendentes
            </h3>
            <div className="space-y-2">
              {invites.map((invite) => (
                <InviteItem key={invite.id} invite={invite} />
              ))}
            </div>
          </section>
        )}

        {/* Members List */}
        <section>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">
            Membros
          </h3>
          
          {members?.length ? (
            <div className="space-y-2">
              {members.map((member) => (
                <MemberItem 
                  key={member.id} 
                  member={member} 
                  isCurrentUser={member.user_id === user?.id}
                  canManage={isOwner && member.user_id !== user?.id}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              variant="household"
              action={{
                label: 'Convidar familiar',
                onClick: () => setShowInviteForm(true),
              }}
            />
          )}
        </section>
      </PageContainer>
    </>
  );
}

// ============================================================================
// Household Name Editor
// ============================================================================

function HouseholdNameEditor({ 
  initialName, 
  onClose 
}: { 
  initialName: string; 
  onClose: () => void;
}) {
  const [name, setName] = useState(initialName);
  const { mutate: updateHousehold, isPending } = useUpdateHousehold();

  const handleSave = () => {
    if (!name.trim()) return;
    
    updateHousehold(name.trim(), {
      onSuccess: () => {
        toast({ title: 'Nome atualizado!', variant: 'success' });
        onClose();
      },
      onError: () => {
        toast({ title: 'Erro ao atualizar', variant: 'destructive' });
      },
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="h-9"
        autoFocus
      />
      <button
        onClick={handleSave}
        disabled={isPending}
        className="h-9 w-9 rounded-lg bg-primary text-white flex items-center justify-center"
      >
        <Check className="h-4 w-4" />
      </button>
      <button
        onClick={onClose}
        className="h-9 w-9 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// ============================================================================
// Invite Form
// ============================================================================

function InviteForm({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const { mutate: createInvite, isPending } = useCreateInvite();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !email.includes('@')) {
      toast({ title: 'Digite um email válido', variant: 'destructive' });
      return;
    }

    createInvite(
      { email: email.trim(), role },
      {
        onSuccess: () => {
          toast({ 
            title: 'Convite enviado!', 
            description: `Enviamos um convite para ${email}`,
            variant: 'success' 
          });
          onClose();
        },
        onError: (error) => {
          toast({ 
            title: 'Erro ao enviar convite', 
            description: error.message,
            variant: 'destructive' 
          });
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <Card className="max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Convidar Familiar
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
              Permissão
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('member')}
                className={cn(
                  'p-3 rounded-xl border-2 text-left transition-all',
                  role === 'member'
                    ? 'border-primary bg-primary/5'
                    : 'border-slate-200 dark:border-slate-700'
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <User className="h-4 w-4 text-slate-500" />
                  <span className="font-bold text-sm">Membro</span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Pode visualizar e adicionar
                </p>
              </button>
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={cn(
                  'p-3 rounded-xl border-2 text-left transition-all',
                  role === 'admin'
                    ? 'border-primary bg-primary/5'
                    : 'border-slate-200 dark:border-slate-700'
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <span className="font-bold text-sm">Admin</span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Pode editar e excluir
                </p>
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full" isLoading={isPending}>
            <Send className="h-4 w-4 mr-2" />
            Enviar Convite
          </Button>
        </form>
      </Card>
    </div>
  );
}

// ============================================================================
// Invite Item
// ============================================================================

function InviteItem({ invite }: { invite: any }) {
  const { mutate: cancelInvite, isPending } = useCancelInvite();

  const handleCancel = () => {
    if (confirm('Cancelar este convite?')) {
      cancelInvite(invite.id, {
        onSuccess: () => toast({ title: 'Convite cancelado', variant: 'success' }),
      });
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
      <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
        <Clock className="h-5 w-5 text-amber-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
          {invite.email}
        </p>
        <p className="text-[10px] text-amber-600">
          Convite pendente • Expira em{' '}
          {format(new Date(invite.expires_at), "dd 'de' MMM", { locale: ptBR })}
        </p>
      </div>
      <button
        onClick={handleCancel}
        disabled={isPending}
        className="h-8 w-8 rounded-lg bg-amber-200 dark:bg-amber-800 flex items-center justify-center text-amber-700 hover:bg-amber-300 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// ============================================================================
// Member Item
// ============================================================================

function MemberItem({ 
  member, 
  isCurrentUser,
  canManage,
}: { 
  member: any;
  isCurrentUser: boolean;
  canManage: boolean;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const { mutate: removeMember, isPending: isRemoving } = useRemoveMember();
  const { mutate: updateRole, isPending: isUpdating } = useUpdateMemberRole();
  
  const role = (member.role || 'member') as MemberRole;
  const roleConfig = ROLE_CONFIG[role];

  const handleRemove = () => {
    if (confirm(`Remover ${member.display_name || 'este membro'} da família?`)) {
      removeMember(member.id, {
        onSuccess: () => toast({ title: 'Membro removido', variant: 'success' }),
      });
    }
    setShowMenu(false);
  };

  const handleChangeRole = (newRole: MemberRole) => {
    if (newRole === 'owner') return; // Não pode promover a owner via UI
    updateRole(
      { memberId: member.id, role: newRole },
      {
        onSuccess: () => toast({ title: 'Permissão atualizada', variant: 'success' }),
      }
    );
    setShowMenu(false);
  };

  return (
    <div className={cn(
      'flex items-center gap-3 p-4 rounded-xl border transition-all',
      isCurrentUser 
        ? 'bg-primary/5 border-primary/20' 
        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'
    )}>
      {/* Avatar */}
      <div className={cn(
        'h-12 w-12 rounded-full flex items-center justify-center text-white font-bold',
        isCurrentUser ? 'bg-primary' : 'bg-slate-400'
      )}>
        {(member.display_name || 'U').charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-bold text-slate-900 dark:text-white truncate">
            {member.display_name || 'Sem nome'}
          </p>
          {isCurrentUser && (
            <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
              Você
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className={cn(
            'text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1',
            roleConfig.color
          )}>
            {roleConfig.icon}
            {roleConfig.label}
          </span>
        </div>
      </div>

      {/* Actions */}
      {canManage && (
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 min-w-[160px]">
                {role !== 'admin' && (
                  <button
                    onClick={() => handleChangeRole('admin')}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <Shield className="h-4 w-4 text-blue-500" />
                    Tornar Admin
                  </button>
                )}
                {role === 'admin' && (
                  <button
                    onClick={() => handleChangeRole('member')}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <User className="h-4 w-4 text-slate-500" />
                    Tornar Membro
                  </button>
                )}
                <button
                  onClick={handleRemove}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Remover
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
