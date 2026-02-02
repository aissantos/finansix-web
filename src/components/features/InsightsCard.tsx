import type { Insight } from '@/types/insights';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, AlertTriangle, X, CheckCircle } from 'lucide-react';
import { useState } from 'react';

interface InsightsCardProps {
  insights: Insight[];
  onDismiss: (id: string) => void;
  onAction?: (insight: Insight) => void;
}

export function InsightsCard({ insights, onDismiss, onAction }: InsightsCardProps) {
  const [minimized, setMinimized] = useState(false);

  if (insights.length === 0) return null;

  const getIcon = (type: Insight['type']) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'info': return <Sparkles className="h-5 w-5 text-blue-500" />;
      default: return <Sparkles className="h-5 w-5 text-slate-500" />;
    }
  };

  const getColor = (type: Insight['type']) => {
    switch (type) {
      case 'warning': return 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/20';
      case 'success': return 'bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/20';
      case 'info': return 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20';
      default: return 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700';
    }
  };

  return (
    <Card className="mb-6 overflow-hidden border-none shadow-sm bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-900/50 outline outline-1 outline-slate-200 dark:outline-slate-800">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100">
            Smart Insights
            <span className="ml-2 text-xs font-normal text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              {insights.length} novos
            </span>
          </CardTitle>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setMinimized(!minimized)}>
           {minimized ? 'Expandir' : 'Ocultar'}
        </Button>
      </CardHeader>
      
      {!minimized && (
        <CardContent className="space-y-3 animate-in slide-in-from-top-2 duration-300">
          {insights.map((insight) => (
            <div 
              key={insight.id}
              className={`p-4 rounded-xl border flex gap-4 transition-all hover:shadow-md ${getColor(insight.type)}`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {getIcon(insight.type)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                    {insight.title}
                  </h4>
                  {insight.dismissible && (
                    <button 
                      onClick={() => onDismiss(insight.id)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {insight.message}
                </p>

                {(insight.metric || insight.actionLabel) && (
                  <div className="flex items-center gap-3 mt-3">
                    {insight.metric && (
                      <span className="text-xs font-bold font-mono bg-white/50 dark:bg-black/20 px-2 py-1 rounded">
                        {insight.metric}
                      </span>
                    )}
                    {insight.actionLabel && (
                      <Button 
                        size="sm" 
                        variant="link" 
                        className="h-auto p-0 text-xs"
                        onClick={() => onAction?.(insight)}
                      >
                        {insight.actionLabel}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}
