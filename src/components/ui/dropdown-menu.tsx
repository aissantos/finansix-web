import type { ReactNode } from 'react';
import { useState, useRef, useEffect } from 'react';
import { MoreVertical, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DropdownMenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
}

interface DropdownMenuProps {
  /** Items do menu */
  items: DropdownMenuItem[];
  /** Ícone do trigger */
  triggerIcon?: 'vertical' | 'horizontal';
  /** Trigger customizado */
  trigger?: ReactNode;
  /** Posição do menu */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  /** Classes adicionais no trigger */
  triggerClassName?: string;
  /** Aria label para acessibilidade */
  ariaLabel?: string;
}

export function DropdownMenu({
  items,
  triggerIcon = 'vertical',
  trigger,
  position = 'bottom-right',
  triggerClassName,
  ariaLabel = 'Abrir menu',
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const handleItemClick = (item: DropdownMenuItem) => {
    if (!item.disabled) {
      setIsOpen(false);
      item.onClick();
    }
  };

  const Icon = triggerIcon === 'vertical' ? MoreVertical : MoreHorizontal;

  const positionClasses = {
    'bottom-right': 'right-0 top-full mt-1',
    'bottom-left': 'left-0 top-full mt-1',
    'top-right': 'right-0 bottom-full mb-1',
    'top-left': 'left-0 bottom-full mb-1',
  }[position];

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        ref={triggerRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={cn('btn-icon touch-target', triggerClassName)}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {trigger || <Icon className="h-5 w-5 text-slate-400" />}
      </button>

      {/* Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div
            ref={menuRef}
            role="menu"
            className={cn(
              'absolute z-50 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-1 min-w-[160px]',
              'animate-in fade-in slide-in-from-top-2 duration-150',
              positionClasses
            )}
          >
            {items.map((item, index) => (
              <button
                key={index}
                role="menuitem"
                onClick={() => handleItemClick(item)}
                disabled={item.disabled}
                className={cn(
                  'w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors',
                  item.disabled && 'opacity-50 cursor-not-allowed',
                  item.variant === 'danger'
                    ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                )}
              >
                {item.icon && (
                  <span className={cn(
                    'flex-shrink-0',
                    item.variant === 'danger' ? '' : 'text-slate-400'
                  )}>
                    {item.icon}
                  </span>
                )}
                <span className="flex-1">{item.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Divider para separar grupos de items
export function DropdownMenuDivider() {
  return <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />;
}
