import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Card } from './card';
import { 
  CreditCard, 
  Wallet, 
  Receipt, 
  PieChart, 
  Tag, 
  Users,
  TrendingUp,
  Calendar,
  Search,
  Plus,
  ArrowRight,
} from 'lucide-react';

type EmptyStateVariant = 
  | 'cards'
  | 'accounts' 
  | 'transactions'
  | 'subscriptions'
  | 'categories'
  | 'analysis'
  | 'search'
  | 'household'
  | 'generic';

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  compact?: boolean;
}

const VARIANTS: Record<EmptyStateVariant, {
  icon: ReactNode;
  title: string;
  description: string;
  gradient: string;
}> = {
  cards: {
    icon: <CreditCard className="h-8 w-8" />,
    title: 'Nenhum cartão cadastrado',
    description: 'Adicione seus cartões de crédito para acompanhar faturas e otimizar seus gastos.',
    gradient: 'from-blue-500/20 to-indigo-500/20',
  },
  accounts: {
    icon: <Wallet className="h-8 w-8" />,
    title: 'Nenhuma conta cadastrada',
    description: 'Cadastre suas contas bancárias para ter uma visão completa das suas finanças.',
    gradient: 'from-emerald-500/20 to-teal-500/20',
  },
  transactions: {
    icon: <Receipt className="h-8 w-8" />,
    title: 'Nenhuma transação encontrada',
    description: 'Comece a registrar suas receitas e despesas para ter controle total.',
    gradient: 'from-violet-500/20 to-purple-500/20',
  },
  subscriptions: {
    icon: <Calendar className="h-8 w-8" />,
    title: 'Nenhuma assinatura cadastrada',
    description: 'Cadastre suas assinaturas para acompanhar gastos recorrentes.',
    gradient: 'from-pink-500/20 to-rose-500/20',
  },
  categories: {
    icon: <Tag className="h-8 w-8" />,
    title: 'Nenhuma categoria encontrada',
    description: 'Crie categorias personalizadas para organizar suas transações.',
    gradient: 'from-amber-500/20 to-orange-500/20',
  },
  analysis: {
    icon: <PieChart className="h-8 w-8" />,
    title: 'Sem dados para análise',
    description: 'Registre algumas transações para ver gráficos e insights.',
    gradient: 'from-cyan-500/20 to-sky-500/20',
  },
  search: {
    icon: <Search className="h-8 w-8" />,
    title: 'Nenhum resultado encontrado',
    description: 'Tente buscar com outros termos ou filtros.',
    gradient: 'from-slate-500/20 to-gray-500/20',
  },
  household: {
    icon: <Users className="h-8 w-8" />,
    title: 'Você está sozinho por aqui',
    description: 'Convide familiares para compartilhar o controle financeiro.',
    gradient: 'from-green-500/20 to-emerald-500/20',
  },
  generic: {
    icon: <TrendingUp className="h-8 w-8" />,
    title: 'Nada por aqui ainda',
    description: 'Comece adicionando seus primeiros dados.',
    gradient: 'from-slate-500/20 to-slate-500/20',
  },
};

export function EmptyState({
  variant = 'generic',
  title,
  description,
  icon,
  action,
  secondaryAction,
  className,
  compact = false,
}: EmptyStateProps) {
  const config = VARIANTS[variant];
  
  const displayIcon = icon ?? config.icon;
  const displayTitle = title ?? config.title;
  const displayDescription = description ?? config.description;

  if (compact) {
    return (
      <div className={cn(
        'flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50',
        className
      )}>
        <div className={cn(
          'h-12 w-12 rounded-xl flex items-center justify-center text-slate-400',
          'bg-gradient-to-br',
          config.gradient
        )}>
          {displayIcon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-slate-700 dark:text-slate-300">
            {displayTitle}
          </p>
          <p className="text-xs text-slate-500 truncate">
            {displayDescription}
          </p>
        </div>
        {action && (
          <Button size="sm" onClick={action.onClick}>
            {action.icon ?? <Plus className="h-4 w-4 mr-1" />}
            {action.label}
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className={cn('p-8 text-center', className)}>
      {/* Icon */}
      <div className={cn(
        'h-20 w-20 rounded-2xl mx-auto mb-5 flex items-center justify-center',
        'bg-gradient-to-br',
        config.gradient
      )}>
        <div className="text-slate-500 dark:text-slate-400">
          {displayIcon}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
        {displayTitle}
      </h3>

      {/* Description */}
      <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto leading-relaxed">
        {displayDescription}
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        {action && (
          <Button onClick={action.onClick} className="gap-2">
            {action.icon ?? <Plus className="h-4 w-4" />}
            {action.label}
          </Button>
        )}
        {secondaryAction && (
          <Button variant="ghost" onClick={secondaryAction.onClick} className="gap-1 text-slate-500">
            {secondaryAction.label}
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Card>
  );
}

/**
 * Onboarding específico para primeiro acesso
 */
export function OnboardingEmptyState({
  step,
  onAction,
}: {
  step: 'account' | 'transaction' | 'category';
  onAction: () => void;
}) {
  const steps = {
    account: {
      number: 1,
      title: 'Comece cadastrando uma conta',
      description: 'Pode ser sua conta corrente, poupança ou carteira física.',
      actionLabel: 'Criar primeira conta',
      icon: <Wallet className="h-6 w-6" />,
    },
    transaction: {
      number: 2,
      title: 'Registre sua primeira transação',
      description: 'Adicione uma receita ou despesa para começar o controle.',
      actionLabel: 'Nova transação',
      icon: <Receipt className="h-6 w-6" />,
    },
    category: {
      number: 3,
      title: 'Personalize suas categorias',
      description: 'Crie categorias que façam sentido para você.',
      actionLabel: 'Gerenciar categorias',
      icon: <Tag className="h-6 w-6" />,
    },
  };

  const config = steps[step];

  return (
    <Card className="p-6 border-2 border-dashed border-primary/30 bg-primary/5">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
          {config.icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              PASSO {config.number}
            </span>
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white mb-1">
            {config.title}
          </h4>
          <p className="text-sm text-slate-500 mb-4">
            {config.description}
          </p>
          <Button size="sm" onClick={onAction}>
            <Plus className="h-4 w-4 mr-1" />
            {config.actionLabel}
          </Button>
        </div>
      </div>
    </Card>
  );
}
