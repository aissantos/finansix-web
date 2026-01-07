import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';

export function AppLayout() {
  return (
    <div className="mx-auto min-h-screen max-w-md bg-slate-50 dark:bg-slate-900 relative flex flex-col shadow-2xl">
      <Outlet />
      <BottomNav />
    </div>
  );
}
