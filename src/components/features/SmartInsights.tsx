import { TrendingDown, TrendingUp, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { SpendingInsight } from '@/lib/analysis';
import { cn } from '@/lib/utils';

interface SmartInsightsProps {
  insights: SpendingInsight[];
  className?: string;
}

export function SmartInsights({ insights, className }: SmartInsightsProps) {
  if (!insights || insights.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      {insights.map((insight, index) => (
        <Card 
          key={index}
          className={cn(
            "p-4 border-l-4 shadow-sm",
            insight.type === 'warning' && "border-l-amber-500 bg-amber-50 dark:bg-amber-950/20",
            insight.type === 'positive' && "border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950/20",
            insight.type === 'neutral' && "border-l-blue-500 bg-blue-50 dark:bg-blue-950/20",
          )}
        >
          <div className="flex items-start gap-3">
            <div className={cn(
              "p-2 rounded-full mt-0.5",
              insight.type === 'warning' && "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-400",
              insight.type === 'positive' && "bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400",
              insight.type === 'neutral' && "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400",
            )}>
              {insight.type === 'warning' && <TrendingUp className="h-4 w-4" />}
              {insight.type === 'positive' && <TrendingDown className="h-4 w-4" />}
              {insight.type === 'neutral' && <Info className="h-4 w-4" />}
            </div>
            
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <h4 className={cn(
                  "font-bold text-sm",
                  insight.type === 'warning' && "text-amber-900 dark:text-amber-100",
                  insight.type === 'positive' && "text-emerald-900 dark:text-emerald-100",
                  insight.type === 'neutral' && "text-blue-900 dark:text-blue-100",
                )}>
                  {insight.message}
                </h4>
                {insight.metric && (
                  <span className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded-full",
                    insight.type === 'warning' && "bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
                    insight.type === 'positive' && "bg-emerald-200 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
                  )}>
                    {insight.metric}
                  </span>
                )}
              </div>
              <p className={cn(
                "text-xs leading-relaxed",
                insight.type === 'warning' && "text-amber-700 dark:text-amber-300",
                insight.type === 'positive' && "text-emerald-700 dark:text-emerald-300",
                insight.type === 'neutral' && "text-blue-700 dark:text-blue-300",
              )}>
                {insight.detail}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
