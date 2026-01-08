import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, X, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAppStore, useSelectedMonth } from '@/stores';
import { useOnlineStatus } from '@/hooks';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  /** Título da página */
  title?: string;
  /** Variante do header */
  variant?: 'default' | 'fullscreen';
  /** Mostra botão de voltar (ChevronLeft) */
  showBack?: boolean;
  /** Mostra botão de fechar (X) */
  showClose?: boolean;
  /** Callback para voltar/fechar */
  onBack?: () => void;
  /** Mostra seletor de mês */
  showMonthSelector?: boolean;
  /** Mostra logo */
  showLogo?: boolean;
  /** Mostra notificações */
  showNotifications?: boolean;
  /** Ações customizadas à direita */
  rightActions?: ReactNode;
  /** Ícone à esquerda do título (para fullscreen) */
  titleIcon?: ReactNode;
}

export function PageHeader({
  title,
  variant = 'default',
  showBack = false,
  showClose = false,
  onBack,
  showMonthSelector = false,
  showLogo = true,
  showNotifications = true,
  rightActions,
  titleIcon,
}: PageHeaderProps) {
  const navigate = useNavigate();
  const selectedMonth = useSelectedMonth();
  const { goToPreviousMonth, goToNextMonth, goToCurrentMonth } = useAppStore();
  const isOnline = useOnlineStatus();

  const isCurrentMonth = format(selectedMonth, 'yyyy-MM') === format(new Date(), 'yyyy-MM');

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const isFullscreen = variant === 'fullscreen';

  return (
    <header
      className={cn(
        isFullscreen ? 'page-header-fullscreen' : 'page-header'
      )}
    >
      <div className="flex items-center justify-between px-4 py-4">
        {/* Left */}
        <div className="w-10 flex items-center">
          {showClose ? (
            <button
              onClick={handleBack}
              className="btn-close"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          ) : showBack ? (
            <button
              onClick={handleBack}
              className="btn-icon"
              aria-label="Voltar"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          ) : showLogo && !isFullscreen ? (
            <img
              src="/icons/icon-72x72.png"
              alt="Finansix"
              className="h-9 w-9 rounded-xl"
            />
          ) : null}
        </div>

        {/* Center */}
        <div className="flex-1 text-center">
          {showMonthSelector ? (
            <MonthSelector
              selectedMonth={selectedMonth}
              isCurrentMonth={isCurrentMonth}
              onPrevious={goToPreviousMonth}
              onNext={goToNextMonth}
              onCurrent={goToCurrentMonth}
            />
          ) : (
            <div className="flex items-center justify-center gap-2">
              {titleIcon}
              <h1 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                {title || 'Finansix'}
              </h1>
            </div>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {!isOnline && <OfflineIndicator />}
          
          {rightActions}
          
          {showNotifications && !isFullscreen && (
            <button 
              className="btn-icon"
              aria-label="Notificações"
            >
              <Bell className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </button>
          )}
          
          {/* Placeholder para manter alinhamento quando não há ações */}
          {!rightActions && !showNotifications && <div className="w-10" />}
          {isFullscreen && !rightActions && <div className="w-10" />}
        </div>
      </div>
    </header>
  );
}

function MonthSelector({
  selectedMonth,
  isCurrentMonth,
  onPrevious,
  onNext,
  onCurrent,
}: {
  selectedMonth: Date;
  isCurrentMonth: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onCurrent: () => void;
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={onPrevious}
        className="btn-icon-sm"
        aria-label="Mês anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <button
        onClick={onCurrent}
        className={cn(
          'px-3 py-1.5 rounded-lg text-sm font-bold transition-colors',
          isCurrentMonth
            ? 'bg-primary/10 text-primary'
            : 'hover:bg-slate-100 dark:hover:bg-slate-800'
        )}
      >
        {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
      </button>

      <button
        onClick={onNext}
        className="btn-icon-sm"
        aria-label="Próximo mês"
      >
        <ChevronLeft className="h-4 w-4 rotate-180" />
      </button>
    </div>
  );
}

function OfflineIndicator() {
  return (
    <div className="flex items-center gap-1 text-amber-500 text-xs font-medium px-2 py-1 bg-amber-50 dark:bg-amber-900/20 rounded-full">
      <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
      Offline
    </div>
  );
}
