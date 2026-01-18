import { Outlet } from 'react-router-dom';
import { AdminSidebar } from '@/admin/components/layout/Sidebar';
import { AdminHeader } from '@/admin/components/layout/Header';
import { ImpersonationBanner } from '@/components/ImpersonationBanner';

export default function AdminLayout() {
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {/* Impersonation Banner */}
      <ImpersonationBanner />
      
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
