import { Bell, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAppStore, useSelectedMonth } from '@/stores';
import { cn } from '@/lib/utils';
import { useOnlineStatus, useAuth } from '@/hooks';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title?: string;
  showMonthSelector?: boolean;
  showBack?: boolean;
  onBack?: () => void;
  showLogo?: boolean;
  right?: React.ReactNode;
}

export function Header({ title, showMonthSelector = false, showBack, onBack, showLogo = true, right }: HeaderProps) {
  const selectedMonth = useSelectedMonth();
  const { goToPreviousMonth, goToNextMonth, goToCurrentMonth } = useAppStore();
  const isOnline = useOnlineStatus();
  const { user } = useAuth();
  const navigate = useNavigate();

  const isCurrentMonth =
    format(selectedMonth, 'yyyy-MM') === format(new Date(), 'yyyy-MM');

  // Get user avatar or initials
  const avatarUrl = user?.user_metadata?.avatar_url;
  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'U';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between px-4 py-4">
        {/* Left */}
        <div className="w-10 flex items-center">
          {showBack && onBack ? (
            <button
              onClick={onBack}
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Voltar"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          ) : showLogo ? (
            <button
              onClick={() => navigate('/profile')}
              className="relative group"
              aria-label="Perfil do usuário"
            >
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt={displayName}
                  className="h-9 w-9 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700 group-hover:ring-primary transition-all"
                />
              ) : (
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-slate-200 dark:ring-slate-700 group-hover:ring-primary transition-all">
                  {initials}
                </div>
              )}
              {/* Online indicator */}
              {isOnline && (
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>
          ) : null}
        </div>

        {/* Center */}
        <div className="flex-1 text-center">
          {showMonthSelector ? (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={goToPreviousMonth}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Mês anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <button
                onClick={goToCurrentMonth}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-bold transition-colors',
                  isCurrentMonth
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                )}
                aria-label={`Ir para ${format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}`}
                aria-current={isCurrentMonth ? 'date' : undefined}
              >
                {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
              </button>

              <button
                onClick={goToNextMonth}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Próximo mês"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <h1 className="text-lg font-bold text-slate-900 dark:text-white truncate">
              {title || 'Finansix'}
            </h1>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {right}
          {!isOnline && (
            <div className="flex items-center gap-1 text-amber-500 text-xs font-medium px-2 py-1 bg-amber-50 dark:bg-amber-900/20 rounded-full">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              Offline
            </div>
          )}
          <button 
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Notificações"
          >
            <Bell className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>
      </div>
    </header>
  );
}
