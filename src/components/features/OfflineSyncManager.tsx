import { useIsMutating, useMutationState } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useOnlineStatus } from '@/hooks/useOnlineStatus'; // Assuming this hook exists or I will create it

export function OfflineSyncManager() {
  const isOnline = useOnlineStatus();
  const mutatingCount = useIsMutating();
  
  // Track mutations that are paused (offline queue)
  const pausedMutations = useMutationState({
    filters: { status: 'pending' },
    select: (mutation) => mutation.state.isPaused,
  });

  const pendingCount = pausedMutations.filter(Boolean).length;
  const isSyncing = isOnline && mutatingCount > 0 && pendingCount === 0; // Rough heuristic

  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!isOnline || pendingCount > 0) {
      setShowBanner(true);
    } else {
      const timer = setTimeout(() => setShowBanner(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, pendingCount]);

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
           initial={{ height: 0, opacity: 0 }}
           animate={{ height: 'auto', opacity: 1 }}
           exit={{ height: 0, opacity: 0 }}
           className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-center px-4 py-2 text-sm font-medium transition-colors ${
             !isOnline 
               ? 'bg-yellow-500 text-yellow-950' 
               : pendingCount > 0
                 ? 'bg-blue-500 text-white'
                 : 'bg-green-500 text-white'
           }`}
        >
          {!isOnline && (
             <>
               <WifiOff className="w-4 h-4 mr-2" />
               <span>Você está offline. Alterações salvas localmente.</span>
             </>
          )}

          {isOnline && pendingCount > 0 && (
             <>
               <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
               <span>Sincronizando {pendingCount} alterações pendentes...</span>
             </>
          )}
          
          {isOnline && pendingCount === 0 && !isSyncing && (
             <span>Sincronizado com sucesso!</span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
