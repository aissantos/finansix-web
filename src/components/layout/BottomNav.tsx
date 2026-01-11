import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, BarChart3, Wallet, User, Plus, TrendingDown, TrendingUp, ArrowRightLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useScrollDirection } from '@/hooks';

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/analysis', icon: BarChart3, label: 'Análise', className: 'nav-analysis' },
  // FAB goes here (index 2)
  { href: '/wallet', icon: Wallet, label: 'Carteira', className: 'nav-wallet' },
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
            className="fixed bottom-24 left-4 right-4 z-50 mx-auto max-w-sm"
          >
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800">
              <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-5 text-center">
                O que deseja registrar?
              </p>
              <div className="flex justify-between items-center px-2">
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
                        'shadow-lg transform transition-all duration-300',
                        'group-hover:scale-110 group-active:scale-95',
                        action.color
                      )}
                    >
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors">
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
        className="fixed bottom-4 left-0 right-0 z-50 mx-auto max-w-[90%] md:max-w-md px-4 pb-safe"
        initial={{ y: 0, opacity: 1 }}
        animate={{ 
          y: isHidden ? 120 : 0,
          opacity: isHidden ? 0 : 1,
          scale: isHidden ? 0.9 : 1
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <div className="relative">
          {/* Navigation Background - Solid with subtle shadow */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2rem] shadow-[0_-8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.2)] border border-white/20 dark:border-slate-800/50 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-3">
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
          <div className="absolute left-1/2 -translate-x-1/2 -top-4 flex flex-col items-center">
            <motion.button
              onClick={handleFabClick}
              className={cn(
                'fab-new-transaction',
                'h-16 w-16 rounded-2xl',
                'flex items-center justify-center',
                'shadow-[0_8px_25px_-5px_rgba(19,91,236,0.4)] transition-all duration-300',
                'border-4 border-white dark:border-slate-900',
                isMenuOpen
                  ? 'bg-slate-800 dark:bg-slate-700 rotate-45'
                  : 'bg-gradient-to-br from-primary to-blue-700'
              )}
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <Plus 
                className={cn(
                  "h-8 w-8 text-white transition-transform duration-300",
                  isMenuOpen && "rotate-0"
                )} 
                strokeWidth={2.5} 
              />
            </motion.button>
          </div>
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
  className,
}: {
  href: string;
  icon: typeof Home;
  label: string;
  isActive: boolean;
  className?: string;
}) {
  return (
    <Link
      to={href}
      className={cn(
        'flex flex-col items-center justify-center gap-1.5 px-3 py-2 rounded-2xl transition-all duration-300 relative group',
        isActive
          ? 'text-primary'
          : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200',
        className
      )}
    >
      {isActive && (
        <motion.div
          layoutId="activeNav"
          className="absolute inset-0 bg-primary/10 dark:bg-primary/20 rounded-2xl -z-10"
          transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }}
        />
      )}
      <Icon 
        className={cn(
          'h-6 w-6 transition-transform duration-300 group-hover:scale-110', 
          isActive ? 'stroke-[2.5px]' : 'stroke-[2px]'
        )} 
      />
      <span className={cn(
        'text-[10px] font-bold tracking-tight transition-all duration-300',
        isActive ? 'opacity-100 translate-y-0' : 'opacity-70 group-hover:opacity-100'
      )}>
        {label}
      </span>
    </Link>
  );
}