import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { QuickActionFAB } from '@/components/features';
import { OfflineSyncManager } from '@/components/features/OfflineSyncManager';

export function AppLayout() {
  return (
    <div className="mx-auto min-h-screen max-w-md bg-slate-50 dark:bg-slate-900 relative flex flex-col shadow-2xl">
      <OfflineSyncManager />
      <Outlet />
      
      {/* Floating Action Button - Positioned above BottomNav */}
      <div className="fixed bottom-20 right-4 z-50 md:absolute">
        <QuickActionFAB />
      </div>

      <BottomNav />
    </div>
  );
}
