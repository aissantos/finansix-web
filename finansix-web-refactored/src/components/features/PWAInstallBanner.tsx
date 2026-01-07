import { useState } from 'react';
import { X, Download, Share, Plus } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function PWAInstallBanner() {
  const { isInstallable, isIOS, install, dismiss } = usePWAInstall();
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  if (!isInstallable) return null;

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
    } else {
      const success = await install();
      if (!success) {
        // User cancelled, maybe show instructions
      }
    }
  };

  return (
    <>
      {/* Install Banner */}
      <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-500">
        <div className="bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-4 shadow-xl shadow-primary/20">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Download className="h-6 w-6 text-white" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white text-sm">
                Instalar Finansix
              </h3>
              <p className="text-white/80 text-xs mt-0.5 leading-snug">
                Acesse mais rápido direto da tela inicial do seu celular
              </p>
            </div>

            <button
              onClick={dismiss}
              className="text-white/60 hover:text-white transition-colors p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex gap-2 mt-3">
            <Button
              onClick={handleInstall}
              className="flex-1 bg-white text-primary hover:bg-white/90 font-bold"
              size="sm"
            >
              {isIOS ? (
                <>
                  <Share className="h-4 w-4 mr-2" />
                  Como instalar
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Instalar agora
                </>
              )}
            </Button>
            <Button
              onClick={dismiss}
              variant="ghost"
              size="sm"
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              Agora não
            </Button>
          </div>
        </div>
      </div>

      {/* iOS Instructions Modal */}
      {showIOSInstructions && (
        <IOSInstallInstructions onClose={() => setShowIOSInstructions(false)} />
      )}
    </>
  );
}

function IOSInstallInstructions({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-t-3xl w-full max-w-lg animate-in slide-in-from-bottom duration-300 pb-safe">
        <div className="p-6">
          {/* Handle */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
          
          <div className="flex items-center justify-between mb-6 mt-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Instalar no iPhone
            </h2>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center"
            >
              <X className="h-4 w-4 text-slate-500" />
            </button>
          </div>

          <div className="space-y-4">
            <Step
              number={1}
              icon={<Share className="h-5 w-5" />}
              title="Toque no botão Compartilhar"
              description="Na barra inferior do Safari, toque no ícone de compartilhar"
            />
            
            <Step
              number={2}
              icon={<Plus className="h-5 w-5" />}
              title='Selecione "Adicionar à Tela de Início"'
              description="Role para baixo e toque na opção"
            />
            
            <Step
              number={3}
              icon={<Download className="h-5 w-5" />}
              title='Toque em "Adicionar"'
              description="Confirme para instalar o app na sua tela inicial"
            />
          </div>

          <Button onClick={onClose} className="w-full mt-6" size="lg">
            Entendi
          </Button>
        </div>
      </div>
    </div>
  );
}

function Step({ 
  number, 
  icon, 
  title, 
  description 
}: { 
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="relative">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          {icon}
        </div>
        <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
          {number}
        </div>
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-slate-900 dark:text-white text-sm">
          {title}
        </h4>
        <p className="text-slate-500 text-xs mt-0.5">
          {description}
        </p>
      </div>
    </div>
  );
}
