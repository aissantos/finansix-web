/**
 * CONTEXTUAL FAB
 * FAB único que muda ação baseado na rota/contexto atual
 */

import { useLocation, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ContextualFAB() {
  const location = useLocation();
  const navigate = useNavigate();

  // Determinar ação baseada na rota
  const getAction = () => {
    const path = location.pathname;

    // Páginas que já têm FAB próprio ou não precisam
    if (
      path.includes('/transactions/new') ||
      path.includes('/transactions/') ||
      path.includes('/cards/new') ||
      path.includes('/accounts/new') ||
      path.includes('/edit')
    ) {
      return null;
    }

    // HomePage, AnalysisPage, AllTransactionsPage
    if (path === '/' || path === '/analysis' || path === '/transactions') {
      return {
        icon: Plus,
        label: 'Nova Transação',
        onClick: () => navigate('/transactions/new'),
        color: 'bg-primary',
      };
    }

    // WalletPage - depende da tab ativa (seria ideal ter context)
    if (path === '/wallet') {
      return {
        icon: Plus,
        label: 'Nova Transação',
        onClick: () => navigate('/transactions/new'),
        color: 'bg-primary',
      };
    }

    return null;
  };

  const action = getAction();

  if (!action) return null;

  const Icon = action.icon;

  return (
    <button
      onClick={action.onClick}
      className={cn(
        'fixed right-6 bottom-20 h-14 w-14 rounded-full text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group',
        action.color,
        'shadow-primary/40'
      )}
      aria-label={action.label}
      title={action.label}
    >
      <Icon className="h-6 w-6" />
      
      {/* Tooltip */}
      <span className="absolute right-full mr-3 px-3 py-1.5 bg-slate-900 dark:bg-slate-700 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        {action.label}
      </span>
    </button>
  );
}
