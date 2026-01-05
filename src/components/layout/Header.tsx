import { Bell, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAppStore, useSelectedMonth } from '@/stores';
import { cn } from '@/lib/utils';
import { useOnlineStatus } from '@/hooks';

interface HeaderProps {
  title?: string;
  showMonthSelector?: boolean;
  showBack?: boolean;
  onBack?: () => void;
}

export function Header({ title, showMonthSelector = false, showBack, onBack }: HeaderProps) {
  const selectedMonth = useSelectedMonth();
  const { goToPreviousMonth, goToNextMonth, goToCurrentMonth } = useAppStore();
  const isOnline = useOnlineStatus();

  const isCurrentMonth =
    format(selectedMonth, 'yyyy-MM') === format(new Date(), 'yyyy-MM');

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between px-4 py-4">
        {/* Left */}
        <div className="w-10">
          {showBack && onBack && (
            <button
              onClick={onBack}
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Center */}
        <div className="flex-1 text-center">
          {showMonthSelector ? (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={goToPreviousMonth}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
              >
                {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
              </button>

              <button
                onClick={goToNextMonth}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
          {!isOnline && (
            <div className="flex items-center gap-1 text-amber-500 text-xs font-medium px-2 py-1 bg-amber-50 dark:bg-amber-900/20 rounded-full">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              Offline
            </div>
          )}
          <button className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <Bell className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>
      </div>
    </header>
  );
}
