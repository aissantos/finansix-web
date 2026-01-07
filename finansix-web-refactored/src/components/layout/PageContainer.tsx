import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function PageContainer({ children, className, noPadding }: PageContainerProps) {
  return (
    <main
      className={cn(
        'flex-1 overflow-y-auto pb-32',
        !noPadding && 'p-4',
        className
      )}
    >
      {children}
    </main>
  );
}
