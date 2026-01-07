import { Link, useLocation } from 'react-router-dom';
import { Home, BarChart3, Wallet, User, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/analysis', icon: BarChart3, label: 'Análise' },
  { href: '/wallet', icon: Wallet, label: 'Carteira' },
  { href: '/profile', icon: User, label: 'Perfil' },
];

export function BottomNav() {
  const location = useLocation();

  // Don't show nav on certain pages
  const hideNav = ['/transactions/new', '/auth'].some((path) =>
    location.pathname.startsWith(path)
  );

  if (hideNav) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-md">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-6 pb-safe">
        <div className="flex items-center justify-between py-2">
          {navItems.slice(0, 2).map((item) => (
            <NavItem key={item.href} {...item} isActive={location.pathname === item.href} />
          ))}

          {/* FAB */}
          <Link
            to="/transactions/new"
            className="relative -top-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary via-primary to-blue-700 text-white shadow-[0_15px_45px_-10px_rgba(19,91,236,0.6)] border-[6px] border-white dark:border-slate-900 transition-all hover:scale-110 hover:-translate-y-1 active:scale-95"
          >
            <Plus className="h-8 w-8" strokeWidth={2.5} />
          </Link>

          {navItems.slice(2).map((item) => (
            <NavItem key={item.href} {...item} isActive={location.pathname === item.href} />
          ))}
        </div>
      </div>
    </nav>
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
        'flex flex-col items-center gap-1 transition-all duration-200',
        isActive ? 'text-primary scale-110' : 'text-slate-400 hover:text-slate-600'
      )}
    >
      <Icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 2} />
      <span className="text-[10px] font-bold">{label}</span>
    </Link>
  );
}
