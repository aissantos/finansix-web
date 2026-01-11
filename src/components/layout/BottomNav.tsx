import { Link, useLocation } from 'react-router-dom';
import { Home, BarChart3, Wallet, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useScrollDirection } from '@/hooks';
import { QuickActionFAB } from '@/components/features';

const navItems = [
  { href: '/', icon: Home, label: 'Home', className: 'nav-home' },
  { href: '/analysis', icon: BarChart3, label: 'Análise', className: 'nav-analysis' },
  { href: '/wallet', icon: Wallet, label: 'Carteira', className: 'nav-wallet' },
  { href: '/profile', icon: User, label: 'Perfil', className: 'nav-profile' },
];

export function BottomNav() {
  const location = useLocation();
  const scrollDirection = useScrollDirection({ threshold: 15 });

  // Don't show nav on certain pages
  const hideNav = ['/transactions/new', '/auth'].some((path) =>
    location.pathname.startsWith(path)
  );

  if (hideNav) return null;

  // Hide when scrolling down, show when scrolling up or at top
  const isHidden = scrollDirection === 'down';

  return (
    <motion.nav
      className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-md"
      initial={{ y: 0 }}
      animate={{ 
        y: isHidden ? 100 : 0,
      }}
      transition={{ 
        type: 'spring',
        stiffness: 400,
        damping: 30,
      }}
    >
      {/* NEW v2.0: Glass navigation */}
      <div className="glass-nav px-6 pb-safe">
        <div className="flex items-center justify-between py-2">
          {navItems.slice(0, 2).map((item) => (
            <NavItem 
              key={item.href} 
              {...item} 
              isActive={location.pathname === item.href} 
            />
          ))}

          {/* NEW v2.0: QuickActionFAB with radial menu */}
          <motion.div
            className="relative -top-6"
            animate={{ 
              y: isHidden ? 20 : 0,
              scale: isHidden ? 0.8 : 1,
              opacity: isHidden ? 0 : 1,
            }}
            transition={{ 
              type: 'spring',
              stiffness: 400,
              damping: 25,
            }}
          >
            <div className="fab-new-transaction flex h-16 w-16 items-center justify-center rounded-full bg-gradient-primary shadow-[0_15px_45px_-10px_rgba(19,91,236,0.6)] border-[6px] border-white dark:border-slate-900 neon-glow-primary">
              <QuickActionFAB />
            </div>
          </motion.div>

          {navItems.slice(2).map((item) => (
            <NavItem 
              key={item.href} 
              {...item} 
              isActive={location.pathname === item.href} 
            />
          ))}
        </div>
      </div>
    </motion.nav>
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
        'flex flex-col items-center gap-1 transition-all duration-200',
        isActive ? 'text-primary scale-110' : 'text-slate-400 hover:text-slate-600',
        className
      )}
    >
      <Icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 2} />
      <span className="text-[10px] font-bold">{label}</span>
    </Link>
  );
}
