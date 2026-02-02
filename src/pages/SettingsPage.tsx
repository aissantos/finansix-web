import { ThemeSettings } from '@/components/settings/ThemeSettings';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function SettingsPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-4 flex items-center gap-4 sticky top-0 z-10 safe-top">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-6 w-6 text-slate-700 dark:text-slate-200" />
        </Button>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Configurações</h1>
      </header>

      <main className="flex-1 p-4 space-y-6 overflow-y-auto pb-24 safe-bottom">
        <ThemeSettings />
        
        {/* Placeholder for other settings */}
        <div className="text-center text-sm text-slate-500 py-8">
            Versão v1.6.0 (Sprint 10)
        </div>
      </main>
    </div>
  );
}
