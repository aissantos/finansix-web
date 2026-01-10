import { cn } from '@/lib/utils';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'skeleton-shimmer',
        'rounded-lg bg-slate-200 dark:bg-slate-700',
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
