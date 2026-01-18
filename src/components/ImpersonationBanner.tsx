import { useEffect, useState } from 'react';
import { X, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useImpersonation } from '@/admin/hooks/useImpersonation';
import { motion, AnimatePresence } from 'framer-motion';

export function ImpersonationBanner() {
  const { isImpersonating, currentSession, stopImpersonation, getRemainingTime } =
    useImpersonation();
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    if (!isImpersonating || !currentSession) return;

    // Update remaining time every second
    const interval = setInterval(() => {
      const remaining = getRemainingTime();
      setRemainingSeconds(remaining);

      // Auto-stop if timeout reached
      if (remaining <= 0) {
        stopImpersonation.mutate();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isImpersonating, currentSession, getRemainingTime, stopImpersonation]);

  if (!isImpersonating || !currentSession) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isLowTime = remainingSeconds < 300; // Less than 5 minutes

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 ${
          isLowTime
            ? 'bg-red-600 dark:bg-red-700'
            : 'bg-orange-600 dark:bg-orange-700'
        } text-white shadow-lg`}
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <AlertTriangle className="h-5 w-5" />
              <div>
                <p className="font-semibold">
                  Modo Impersonation Ativo
                </p>
                <p className="text-sm opacity-90">
                  Você está visualizando como outro usuário. Todas as ações serão registradas no
                  audit log.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Countdown Timer */}
              <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-lg">
                <Clock className="h-4 w-4" />
                <span className="font-mono font-semibold">
                  {formatTime(remainingSeconds)}
                </span>
              </div>

              {/* Stop Button */}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => stopImpersonation.mutate()}
                disabled={stopImpersonation.isPending}
                className="bg-white text-slate-900 hover:bg-slate-100"
              >
                <X className="h-4 w-4 mr-2" />
                {stopImpersonation.isPending ? 'Encerrando...' : 'Sair da Impersonation'}
              </Button>
            </div>
          </div>

          {/* Warning for low time */}
          {isLowTime && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-2 pt-2 border-t border-white/20"
            >
              <p className="text-sm font-medium">
                ⚠️ Atenção: Sessão expirará em breve. Salve seu trabalho.
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
