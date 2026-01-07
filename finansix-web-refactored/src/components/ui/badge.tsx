import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary/10 text-primary',
        secondary: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
        success: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
        warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
        danger: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
        outline: 'border border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
