/**
 * RECENT TRANSACTIONS FEED
 * 
 * Componente para exibir últimas transações na AnalysisPage
 * Com link para página completa de transações
 */

import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, ArrowDownLeft, ChevronRight, Receipt } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useRecentTransactions } from '@/hooks';
import { formatCurrency, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RecentTransactionsFeedProps {
  limit?: number;
  showHeader?: boolean;
  className?: string;
}

export function RecentTransactionsFeed({ 
  limit = 10,
  showHeader = true,
  className 
}: RecentTransactionsFeedProps) {
  const navigate = useNavigate();
  const { data: transactions, isLoading } = useRecentTransactions(limit);

  if (isLoading) {
    return (
      <Card className={cn('p-6', className)}>
        {showHeader && (
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-9 w-24" />
          </div>
        )}
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <Card className={cn('p-8 text-center', className)}>
        <Receipt className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <p className="text-slate-500 text-sm">
          Nenhuma transação encontrada
        </p>
        <Button
          onClick={() => navigate('/transactions/new')}
          variant="ghost"
          size="sm"
          className="mt-3"
        >
          Adicionar primeira transação
        </Button>
      </Card>
    );
  }

  return (
    <Card className={cn('p-6', className)}>
      {showHeader && (
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Últimas Transações
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {transactions.length} transações recentes
            </p>
          </div>
          <Button
            onClick={() => navigate('/transactions')}
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary-600"
          >
            Ver todas
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {transactions.map((transaction) => {
          const isIncome = transaction.type === 'income';
          const Icon = isIncome ? ArrowDownLeft : ArrowUpRight;
          const categoryColor = transaction.category?.color || '#6366f1';

          return (
            <button
              key={transaction.id}
              onClick={() => navigate(`/transactions/${transaction.id}`)}
              className="w-full p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-center gap-3 group"
            >
              {/* Category Icon */}
              <div 
                className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                style={{ 
                  backgroundColor: `${categoryColor}15`,
                  color: categoryColor 
                }}
              >
                <Icon className="h-5 w-5" />
              </div>

              {/* Transaction Info */}
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {transaction.description}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-slate-500">
                    {format(new Date(transaction.transaction_date), 'dd MMM', { locale: ptBR })}
                  </p>
                  {transaction.category && (
                    <>
                      <span className="text-slate-300">•</span>
                      <p className="text-xs text-slate-500 truncate">
                        {transaction.category.name}
                      </p>
                    </>
                  )}
                  {transaction.is_installment && transaction.total_installments && (
                    <>
                      <span className="text-slate-300">•</span>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {transaction.total_installments}x
                      </Badge>
                    </>
                  )}
                </div>
              </div>

              {/* Amount */}
              <div className="flex-shrink-0 text-right">
                <p className={cn(
                  'text-sm font-bold',
                  isIncome 
                    ? 'text-income' 
                    : 'text-slate-900 dark:text-white'
                )}>
                  {isIncome ? '+' : ''}{formatCurrency(transaction.amount)}
                </p>
                <p className="text-[10px] text-slate-400 uppercase font-medium mt-0.5">
                  {transaction.status}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer Action */}
      {transactions.length >= limit && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
          <Button
            onClick={() => navigate('/transactions')}
            variant="outline"
            className="w-full"
            size="sm"
          >
            Ver histórico completo
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </Card>
  );
}
