import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Repeat, 
  TrendingUp, 
  Calendar,
  ChevronRight,
  Sparkles,
  Filter,
  LayoutGrid,
  List,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { PageContainer } from '@/components/layout';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import { useCreditCards, useSubscriptions, useDeleteSubscription, useUpdateSubscription, useSubscriptionTotal } from '@/hooks';
import { toast } from '@/hooks/useToast';
import { cn, formatCurrency } from '@/lib/utils';
import { SubscriptionForm } from '@/components/features/SubscriptionForm';
import { SubscriptionItem } from '@/components/features/SubscriptionItem';

type ViewMode = 'list' | 'grid';
type FilterMode = 'all' | 'active' | 'paused';

export default function SubscriptionsPage() {
  const navigate = useNavigate();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  
  const { data: subscriptions, isLoading } = useSubscriptions();
  const { data: cards } = useCreditCards();
  const { mutate: deleteSubscription } = useDeleteSubscription();
  const { mutate: updateSubscription } = useUpdateSubscription();
  const { total, count } = useSubscriptionTotal();
  const { confirm, Dialog } = useConfirmDialog();

  // Filtrar e organizar assinaturas
  const filteredSubscriptions = useMemo(() => {
    if (!subscriptions) return [];
    
    let filtered = [...subscriptions];
    
    if (filterMode === 'active') {
      filtered = filtered.filter(s => s.is_active);
    } else if (filterMode === 'paused') {
      filtered = filtered.filter(s => !s.is_active);
    }
    
    // Ordenar por dia de cobrança mais próximo
    const today = new Date().getDate();
    return filtered.sort((a, b) => {
      const daysA = a.billing_day >= today ? a.billing_day - today : 30 - today + a.billing_day;
      const daysB = b.billing_day >= today ? b.billing_day - today : 30 - today + b.billing_day;
      return daysA - daysB;
    });
  }, [subscriptions, filterMode]);

  // Próximas cobranças (próximos 7 dias)
  const upcomingSubscriptions = useMemo(() => {
    if (!subscriptions) return [];
    const today = new Date().getDate();
    return subscriptions.filter(s => {
      if (!s.is_active) return false;
      const days = s.billing_day >= today ? s.billing_day - today : 30 - today + s.billing_day;
      return days <= 7;
    });
  }, [subscriptions]);

  // Total anual estimado
  const yearlyTotal = total * 12;

  const handleDelete = (id: string, name: string) => {
    confirm({
      title: 'Excluir assinatura?',
      description: `Tem certeza que deseja excluir "${name}"? Esta ação não pode ser desfeita.`,
      confirmText: 'Excluir',
      variant: 'danger',
      onConfirm: () => {
        deleteSubscription(id, {
          onSuccess: () => {
            toast({ title: 'Assinatura excluída', description: `${name} foi removida.`, variant: 'success' });
          },
        });
      },
    });
  };

  const handleToggleActive = (id: string, currentStatus: boolean, name: string) => {
    const newStatus = !currentStatus;
    updateSubscription(
      { id, is_active: newStatus },
      {
        onSuccess: () => {
          toast({
            title: newStatus ? 'Assinatura reativada' : 'Assinatura pausada',
            description: `${name} foi ${newStatus ? 'reativada' : 'pausada'}.`,
            variant: 'success',
          });
        },
        onError: () => {
          toast({
            title: 'Erro',
            description: 'Não foi possível atualizar a assinatura.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setShowAddForm(true);
  };

  const handleCloseForm = () => {
    setShowAddForm(false);
    setEditingId(null);
  };

  return (
    <>
      <PageHeader title="Assinaturas" showBack onBack={() => navigate('/wallet')} />
      
      <PageContainer className="pb-24">
        {/* Hero Stats */}
        <div className="mb-6">
          <Card className="p-0 overflow-hidden border-0 shadow-lg">
            {/* Main Stat */}
            <div className="bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 p-5 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1">
                    Total Mensal
                  </p>
                  <p className="text-4xl font-black tracking-tight">
                    {formatCurrency(total)}
                  </p>
                  <p className="text-white/60 text-sm mt-1">
                    {count} assinatura{count !== 1 ? 's' : ''} ativa{count !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                  <Repeat className="h-7 w-7 text-white" />
                </div>
              </div>
            </div>
            
            {/* Secondary Stats */}
            <div className="bg-white dark:bg-slate-800 grid grid-cols-2 divide-x divide-slate-100 dark:divide-slate-700">
              <div className="p-4 text-center">
                <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                  <TrendingUp className="h-3 w-3" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Ano</span>
                </div>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {formatCurrency(yearlyTotal)}
                </p>
              </div>
              <div className="p-4 text-center">
                <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                  <Calendar className="h-3 w-3" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Próximos 7d</span>
                </div>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {formatCurrency(upcomingSubscriptions.reduce((sum, s) => sum + (s.amount ?? 0), 0))}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Upcoming Alert */}
        {upcomingSubscriptions.length > 0 && !showAddForm && (
          <Card className="p-4 mb-6 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
                <Calendar className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-amber-900 dark:text-amber-100">
                  {upcomingSubscriptions.length} cobrança{upcomingSubscriptions.length > 1 ? 's' : ''} nos próximos 7 dias
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 truncate">
                  {upcomingSubscriptions.map(s => s.name).join(', ')}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-amber-400 flex-shrink-0" />
            </div>
          </Card>
        )}

        {/* Add Button - Floating Style quando não tem form */}
        {!showAddForm && (
          <Button
            onClick={() => setShowAddForm(true)}
            className="w-full mb-6 h-14 text-base gap-3 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 border-0 shadow-lg shadow-purple-500/25"
          >
            <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Plus className="h-5 w-5" />
            </div>
            <span>Adicionar Assinatura</span>
            <Sparkles className="h-4 w-4 ml-auto opacity-60" />
          </Button>
        )}

        {/* Add/Edit Form */}
        {showAddForm && (
          <SubscriptionForm
            cards={cards}
            initialData={editingId ? subscriptions?.find(s => s.id === editingId) : undefined}
            onClose={handleCloseForm}
          />
        )}

        {/* List Header with Filters */}
        {!showAddForm && subscriptions && subscriptions.length > 0 && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                {(['all', 'active', 'paused'] as FilterMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setFilterMode(mode)}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                      filterMode === mode
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    )}
                  >
                    {mode === 'all' ? 'Todas' : mode === 'active' ? 'Ativas' : 'Pausadas'}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-1.5 rounded-md transition-all',
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-400'
                )}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-1.5 rounded-md transition-all',
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-400'
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Subscriptions List/Grid */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredSubscriptions.length > 0 ? (
          viewMode === 'list' ? (
            <div className="space-y-3">
              {filteredSubscriptions.map((sub) => (
                <SubscriptionItem
                  key={sub.id}
                  subscription={sub}
                  card={cards?.find(c => c.id === sub.credit_card_id)}
                  onEdit={() => handleEdit(sub.id)}
                  onDelete={() => handleDelete(sub.id, sub.name)}
                  onToggleActive={() => handleToggleActive(sub.id, sub.is_active, sub.name)}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredSubscriptions.map((sub) => (
                <SubscriptionGridItem
                  key={sub.id}
                  subscription={sub}
                  onEdit={() => handleEdit(sub.id)}
                  onDelete={() => handleDelete(sub.id, sub.name)}
                />
              ))}
            </div>
          )
        ) : subscriptions?.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 flex items-center justify-center mx-auto mb-4">
              <Repeat className="h-10 w-10 text-violet-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Nenhuma assinatura ainda
            </h3>
            <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">
              Cadastre suas assinaturas para ter controle total dos seus gastos recorrentes
            </p>
            <Button onClick={() => setShowAddForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar primeira assinatura
            </Button>
          </Card>
        ) : (
          <Card className="p-6 text-center">
            <p className="text-slate-500">
              Nenhuma assinatura {filterMode === 'active' ? 'ativa' : 'pausada'} encontrada
            </p>
          </Card>
        )}

        {/* Pro Tip */}
        {subscriptions && subscriptions.length > 0 && !showAddForm && (
          <Card className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 border-dashed">
            <div className="flex gap-3">
              <span className="text-xl">💡</span>
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Dica de economia
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Revise suas assinaturas mensalmente. Serviços pouco usados podem representar 
                  até {formatCurrency(yearlyTotal * 0.2)}/ano em gastos desnecessários.
                </p>
              </div>
            </div>
          </Card>
        )}
      </PageContainer>
      
      {Dialog}
    </>
  );
}

// ============================================================================
// Grid Item Component
// ============================================================================

interface SubscriptionGridItemProps {
  subscription: {
    id: string;
    name: string;
    amount: number | null;
    icon: string | null;
    billing_day: number;
    is_active: boolean;
  };
  onEdit: () => void;
  onDelete: () => void;
}

function SubscriptionGridItem({ subscription, onEdit, onDelete }: SubscriptionGridItemProps) {
  const today = new Date().getDate();
  const daysUntilBilling = subscription.billing_day >= today
    ? subscription.billing_day - today
    : 30 - today + subscription.billing_day;
  
  const isUpcoming = daysUntilBilling <= 3;

  return (
    <Card 
      className={cn(
        "p-4 relative overflow-hidden transition-all",
        !subscription.is_active && "opacity-60"
      )}
      onClick={onEdit}
    >
      {/* Upcoming indicator */}
      {isUpcoming && subscription.is_active && (
        <div className="absolute top-0 right-0 w-0 h-0 border-t-[24px] border-t-amber-500 border-l-[24px] border-l-transparent" />
      )}
      
      <div className="text-center">
        <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-2xl mx-auto mb-3">
          {subscription.icon || '📦'}
        </div>
        
        <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
          {subscription.name}
        </h4>
        
        <p className="text-lg font-black text-slate-900 dark:text-white mt-1">
          {formatCurrency(subscription.amount ?? 0)}
        </p>
        
        <p className={cn(
          "text-[10px] font-medium mt-2",
          isUpcoming && subscription.is_active
            ? "text-amber-600"
            : "text-slate-400"
        )}>
          {isUpcoming && subscription.is_active
            ? `Cobra em ${daysUntilBilling} dia${daysUntilBilling > 1 ? 's' : ''}`
            : `Dia ${subscription.billing_day}`
          }
        </p>
      </div>
      
      {/* Quick actions on hover/focus - visible on touch */}
      <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white dark:from-slate-800 to-transparent opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity flex items-end justify-center gap-2 pb-2">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="text-xs text-primary font-medium"
        >
          Editar
        </button>
        <span className="text-slate-300">•</span>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="text-xs text-red-500 font-medium"
        >
          Excluir
        </button>
      </div>
    </Card>
  );
}
