import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: number | string;
  delta?: number;
  icon: LucideIcon;
  isLoading?: boolean;
}

export function MetricCard({ 
  title, 
  value, 
  delta, 
  icon: Icon,
  isLoading = false
}: MetricCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
        <div className="animate-pulse">
          <div className="flex justify-between items-start mb-4">
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24"></div>
            <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
          </div>
          <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded w-32 mb-2"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:shadow-lg transition-shadow"
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          {title}
        </h3>
        <div className="w-10 h-10 bg-blue-500/10 dark:bg-blue-500/20 rounded-lg flex items-center justify-center">
          <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
      
      <div className="text-4xl font-bold font-mono mb-2 text-slate-900 dark:text-slate-50">
        {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
      </div>
      
      {delta !== undefined && (
        <div className={cn(
          "flex items-center gap-2 text-sm font-semibold",
          delta > 0 ? "text-green-600 dark:text-green-400" : 
          delta < 0 ? "text-red-600 dark:text-red-400" : 
          "text-slate-500 dark:text-slate-400"
        )}>
          {delta > 0 ? <TrendingUp className="w-4 h-4" /> : 
           delta < 0 ? <TrendingDown className="w-4 h-4" /> : 
           <Minus className="w-4 h-4" />}
          <span>{Math.abs(delta)}% vs ontem</span>
        </div>
      )}
    </motion.div>
  );
}
