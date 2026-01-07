import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Header, PageContainer } from '@/components/layout';
import { useCreditCards, useSubscriptions, useDeleteSubscription, useSubscriptionTotal } from '@/hooks';
import { toast } from '@/hooks/useToast';
import { formatCurrency } from '@/lib/utils';
// Importa os novos componentes modulares
import { SubscriptionForm } from '@/components/features/SubscriptionForm';
import { SubscriptionItem } from '@/components/features/SubscriptionItem';

export default function SubscriptionsPage() {
  const navigate = useNavigate();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const { data: subscriptions, isLoading } = useSubscriptions();
  const { data: cards } = useCreditCards();
  const { mutate: deleteSubscription } = useDeleteSubscription();
  const { total, count } = useSubscriptionTotal();

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Deseja realmente excluir a assinatura "${name}"?`)) {
      deleteSubscription(id, {
        onSuccess: () => {
          toast({
            title: 'Assinatura excluída',
            description: `${name} foi removida.`,
            variant: 'success',
          });
        },
      });
    }
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
      <Header 
        title="Assinaturas" 
        showBack
        onBack={() => navigate('/wallet')}
      />
      <PageContainer className="pb-24">
        {/* Summary Card */}
        <Card className="p-5 mb-6 bg-gradient-to-br from-violet-500 to-purple-600 text-white border-0">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/70 text-xs font-medium uppercase tracking-wider">
                Gasto Mensal
              </p>
              <p className="text-3xl font-black mt-1">
                {formatCurrency(total)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/70 text-xs font-medium uppercase tracking-wider">
                Ativas
              </p>
              <p className="text-2xl font-black mt-1">
                {count}
              </p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/20">
            <p className="text-white/80 text-xs">
              💡 Dica: Revise suas assinaturas periodicamente para evitar gastos desnecessários
            </p>
          </div>
        </Card>

        {/* Add Button */}
        {!showAddForm && (
          <Button
            onClick={() => setShowAddForm(true)}
            className="w-full mb-6"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Assinatura
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

        {/* Subscriptions List */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider px-1">
            Suas Assinaturas
          </h3>
          
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : subscriptions?.length ? (
            subscriptions.map((sub) => (
              <SubscriptionItem
                key={sub.id}
                subscription={sub}
                card={cards?.find(c => c.id === sub.credit_card_id)}
                onEdit={() => handleEdit(sub.id)}
                onDelete={() => handleDelete(sub.id, sub.name)}
              />
            ))
          ) : (
            <Card className="p-8 text-center">
              <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                <Repeat className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-slate-500 mb-2">Nenhuma assinatura cadastrada</p>
              <p className="text-xs text-slate-400">
                Adicione suas assinaturas para acompanhar seus gastos recorrentes
              </p>
            </Card>
          )}
        </div>
      </PageContainer>
    </>
  );
}