import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, BarChart3, Wallet, User, Plus, X, TrendingDown, TrendingUp, ArrowRightLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useScrollDirection } from '@/hooks';

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/analysis', icon: BarChart3, label: 'Análise' },
  // FAB goes here (index 2)
  { href: '/wallet', icon: Wallet, label: 'Carteira' },
  { href: '/profile', icon: User, label: 'Perfil' },
];

const quickActions = [
  {
    icon: TrendingDown,
    label: 'Despesa',
    color: 'bg-expense',
    shadowColor: 'shadow-red-500/30',
    route: '/expense/new',
  },
  {
    icon: TrendingUp,
    label: 'Receita',
    color: 'bg-income',
    shadowColor: 'shadow-green-500/30',
    route: '/income/new',
  },
  {
    icon: ArrowRightLeft,
    label: 'Transferência',
    color: 'bg-primary',
    shadowColor: 'shadow-blue-500/30',
    route: '/transfer/new',
  },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const scrollDirection = useScrollDirection({ threshold: 15 });
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Don't show nav on certain pages
  const hideNav = ['/expense/new', '/income/new', '/transfer/new', '/auth'].some((path) =>
    location.pathname.startsWith(path)
  );

  if (hideNav) return null;

  const isHidden = scrollDirection === 'down' && !isMenuOpen;

  const handleFabClick = () => {
    setIsMenuOpen(!isMenuOpen);
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  const handleActionClick = (route: string) => {
    setIsMenuOpen(false);
    navigate(route);
  };

  return (
    <>
      {/* Overlay when menu is open */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={() => setIsMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Quick Actions Menu - Positioned above FAB */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-28 left-0 right-0 z-50 px-6 max-w-md mx-auto"
          >
            <div className="glass-card p-4 rounded-2xl">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 text-center">
                Nova Transação
              </p>
              <div className="flex justify-center gap-4">
                {quickActions.map((action, index) => (
                  <motion.button
                    key={action.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleActionClick(action.route)}
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div
                      className={cn(
                        'h-14 w-14 rounded-2xl flex items-center justify-center',
                        'shadow-lg transform transition-all duration-200',
                        'group-hover:scale-110 group-active:scale-95',
                        action.color,
                        action.shadowColor
                      )}
                    >
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {action.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation Bar */}
      <motion.nav
        className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-md px-4 pb-safe"
        initial={{ y: 0 }}
        animate={{ y: isHidden ? 100 : 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <div className="relative">
          {/* Navigation Background - Solid with subtle shadow */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between px-2 py-2">
              {/* Left nav items */}
              {navItems.slice(0, 2).map((item) => (
                <NavItem
                  key={item.href}
                  {...item}
                  isActive={location.pathname === item.href}
                />
              ))}

              {/* Center FAB Space */}
              <div className="w-16" />

              {/* Right nav items */}
              {navItems.slice(2).map((item) => (
                <NavItem
                  key={item.href}
                  {...item}
                  isActive={location.pathname === item.href}
                />
              ))}
            </div>
          </div>

          {/* Floating Action Button - Centered and elevated */}
          <motion.button
            onClick={handleFabClick}
            className={cn(
              'absolute left-1/2 -translate-x-1/2 -top-6',
              'h-14 w-14 rounded-full',
              'flex items-center justify-center',
              'shadow-lg transition-all duration-300',
              isMenuOpen
                ? 'bg-slate-700 dark:bg-slate-600 shadow-slate-500/30'
                : 'bg-gradient-to-br from-primary to-blue-600 shadow-primary/40 neon-glow-primary'
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{ rotate: isMenuOpen ? 45 : 0 }}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6 text-white" />
            ) : (
              <Plus className="h-6 w-6 text-white" strokeWidth={2.5} />
            )}
          </motion.button>
        </div>
      </motion.nav>
    </>
  );
}

function NavItem({
  href,
  icon: Icon,
  label,
  isActive,
}: {
  href: string;
  icon: typeof Home;
  label: string;
  isActive: boolean;
}) {
  return (
    <Link
      to={href}
      className={cn(
        'flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all duration-200',
        isActive
          ? 'text-primary bg-primary/10'
          : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
      )}
    >
      <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
      <span className={cn('text-[10px] font-bold', isActive && 'text-primary')}>
        {label}
      </span>
    </Link>
  );
}
