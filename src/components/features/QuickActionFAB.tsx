import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, TrendingDown, TrendingUp, ArrowRightLeft, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAction {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
  route: string;
  angle: number;
}

const quickActions: QuickAction[] = [
  {
    icon: TrendingDown,
    label: 'Despesa',
    color: 'bg-red-500',
    route: '/new-transaction?type=expense',
    angle: -60,
  },
  {
    icon: TrendingUp,
    label: 'Receita',
    color: 'bg-green-500',
    route: '/new-transaction?type=income',
    angle: 0,
  },
  {
    icon: ArrowRightLeft,
    label: 'Transferência',
    color: 'bg-blue-500',
    route: '/transfer',
    angle: 60,
  },
];

export function QuickActionFAB() {
  return null;
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const fabRef = useRef<HTMLButtonElement>(null);

  const handlePressStart = () => {
    const timer = setTimeout(() => {
      setIsOpen(true);
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(30);
      }
    }, 300);
    setLongPressTimer(timer);
  };

  const handlePressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleClick = () => {
    if (!isOpen) {
      navigate('/new-transaction');
    }
  };

  const handleActionClick = (route: string) => {
    setIsOpen(false);
    navigate(route);
  };

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <>
      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="relative z-50">
        {/* Quick Actions */}
        <AnimatePresence>
          {isOpen && quickActions.map((action, index) => {
            const radius = 120;
            const angleRad = (action.angle * Math.PI) / 180;
            const x = Math.cos(angleRad) * radius;
            const y = Math.sin(angleRad) * radius;

            return (
              <motion.button
                key={action.label}
                initial={{ scale: 0, x: 0, y: 0 }}
                animate={{ scale: 1, x, y }}
                exit={{ scale: 0, x: 0, y: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 260,
                  damping: 20,
                  delay: index * 0.05,
                }}
                onClick={() => handleActionClick(action.route)}
                className={cn(
                  'absolute bottom-0 right-0',
                  'h-14 w-14 rounded-full shadow-lg',
                  'flex flex-col items-center justify-center',
                  'text-white font-medium text-xs',
                  'hover:scale-110 active:scale-95',
                  'transition-transform',
                  action.color
                )}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <action.icon className="h-5 w-5 mb-0.5" />
                <span className="text-[9px] font-bold">{action.label}</span>
              </motion.button>
            );
          })}
        </AnimatePresence>

        {/* Main FAB */}
        <motion.button
          ref={fabRef}
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          onTouchStart={handlePressStart}
          onTouchEnd={handlePressEnd}
          onClick={handleClick}
          className={cn(
            'h-14 w-14 rounded-full shadow-xl',
            'flex items-center justify-center',
            'bg-primary text-white',
            'hover:shadow-2xl active:scale-95',
            'transition-all duration-200',
            isOpen && 'bg-slate-600'
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={{ rotate: isOpen ? 45 : 0 }}
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Plus className="h-6 w-6" />
          )}
        </motion.button>

        {/* Long Press Hint (shows first time) */}
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap"
          >
            <div className="bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg">
              Segure para ações rápidas
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45" />
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
}
