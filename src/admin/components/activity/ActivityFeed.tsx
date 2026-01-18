import { useActivityFeed } from '@/admin/hooks/useActivityFeed';
import { Shield, Settings, Users, AlertTriangle, Activity as ActivityIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const activityIcons: Record<string, typeof Shield> = {
  'impersonation': Shield,
  'config_change': Settings,
  'admin_login': Users,
  'rate_limit': AlertTriangle,
  'migration': ActivityIcon,
};

const activityColors: Record<string, string> = {
  'impersonation': 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/20',
  'config_change': 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20',
  'admin_login': 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20',
  'rate_limit': 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20',
  'migration': 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/20',
};

export function ActivityFeed() {
  const { activities, isLoading } = useActivityFeed();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start gap-3 animate-pulse">
            <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
            <div className="flex-1">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const Icon = activityIcons[activity.action] || ActivityIcon;
        const colorClass = activityColors[activity.action] || 'text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-800';

        return (
          <div key={activity.id} className="flex items-start gap-3 group hover:bg-slate-50 dark:hover:bg-slate-900/50 p-2 rounded-lg transition-colors">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
              colorClass
            )}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                {activity.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {formatDistanceToNow(new Date(activity.timestamp), { 
                  addSuffix: true,
                  locale: ptBR 
                })}
              </p>
              {activity.metadata?.description && (
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 truncate">
                  {(typeof activity.metadata.description === 'string' 
                    ? activity.metadata.description 
                    : JSON.stringify(activity.metadata.description)) as string}
                </p>
              )}
            </div>
            {activity.result && (
              <span className={cn(
                "text-xs font-semibold px-2 py-1 rounded-full",
                activity.result === 'success' 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
              )}>
                {activity.result}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
