import { Outlet } from 'react-router-dom';

export default function AdminAuthLayout() {
  return (
    <div className="min-h-screen grid items-center justify-center bg-slate-950 text-slate-50 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 z-0">
            <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl opacity-50" />
            <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-indigo-600/20 blur-3xl opacity-50" />
        </div>

        <div className="relative z-10 w-full max-w-md p-6">
            <div className="flex flex-col items-center mb-8">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-600/20">
                    <span className="text-2xl font-bold">F</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight">Finansix Admin</h1>
                <p className="text-slate-400">Portal Administrativo</p>
            </div>

            <Outlet />
            
            <footer className="mt-8 text-center text-xs text-slate-500">
                &copy; {new Date().getFullYear()} Versix Tecnologia. Todos os direitos reservados.
            </footer>
        </div>
    </div>
  );
}
