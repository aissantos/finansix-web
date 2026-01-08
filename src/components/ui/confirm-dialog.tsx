import { ReactNode, useEffect, useRef } from 'react';
import { AlertTriangle, Trash2, X, AlertCircle, HelpCircle } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

type DialogVariant = 'danger' | 'warning' | 'info';

interface ConfirmDialogProps {
  /** Controla visibilidade */
  isOpen: boolean;
  /** Callback para fechar */
  onClose: () => void;
  /** Callback para confirmar */
  onConfirm: () => void;
  /** Título do dialog */
  title: string;
  /** Descrição/mensagem */
  description?: string;
  /** Texto do botão de confirmar */
  confirmText?: string;
  /** Texto do botão de cancelar */
  cancelText?: string;
  /** Variante visual */
  variant?: DialogVariant;
  /** Estado de loading no botão confirmar */
  isLoading?: boolean;
  /** Ícone customizado */
  icon?: ReactNode;
}

const variantConfig: Record<DialogVariant, {
  icon: typeof AlertTriangle;
  iconBg: string;
  iconColor: string;
  buttonVariant: 'destructive' | 'default';
}> = {
  danger: {
    icon: Trash2,
    iconBg: 'bg-red-100 dark:bg-red-900/30',
    iconColor: 'text-red-600 dark:text-red-400',
    buttonVariant: 'destructive',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
    buttonVariant: 'default',
  },
  info: {
    icon: HelpCircle,
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
    buttonVariant: 'default',
  },
};

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  isLoading = false,
  icon,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const config = variantConfig[variant];
  const Icon = config.icon;

  // Trap focus inside dialog
  useEffect(() => {
    if (isOpen) {
      const firstButton = dialogRef.current?.querySelector('button');
      firstButton?.focus();
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={!isLoading ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby={description ? 'dialog-description' : undefined}
        className={cn(
          'relative z-10 w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-xl',
          'animate-in fade-in zoom-in-95 duration-200'
        )}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-3 right-3 btn-icon-sm text-slate-400 hover:text-slate-600"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className={cn('icon-container-lg', config.iconBg, config.iconColor)}>
              {icon || <Icon className="h-6 w-6" />}
            </div>
          </div>

          {/* Title */}
          <h2
            id="dialog-title"
            className="text-lg font-bold text-slate-900 dark:text-white text-center mb-2"
          >
            {title}
          </h2>

          {/* Description */}
          {description && (
            <p
              id="dialog-description"
              className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6"
            >
              {description}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelText}
            </Button>
            <Button
              variant={config.buttonVariant}
              className="flex-1"
              onClick={onConfirm}
              isLoading={isLoading}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook para facilitar o uso
import { useState, useCallback } from 'react';

interface UseConfirmDialogOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: DialogVariant;
  onConfirm: () => void | Promise<void>;
}

export function useConfirmDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState<UseConfirmDialogOptions | null>(null);

  const confirm = useCallback((opts: UseConfirmDialogOptions) => {
    setOptions(opts);
    setIsOpen(true);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!options) return;
    
    setIsLoading(true);
    try {
      await options.onConfirm();
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  const handleClose = useCallback(() => {
    if (!isLoading) {
      setIsOpen(false);
    }
  }, [isLoading]);

  const DialogComponent = options ? (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={handleClose}
      onConfirm={handleConfirm}
      title={options.title}
      description={options.description}
      confirmText={options.confirmText}
      cancelText={options.cancelText}
      variant={options.variant}
      isLoading={isLoading}
    />
  ) : null;

  return {
    confirm,
    Dialog: DialogComponent,
    isOpen,
    close: handleClose,
  };
}
