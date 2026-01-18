
import { 
    Activity, 
    AlertTriangle, 
    CheckCircle2, 
    Server, 
    Database, 
    Zap, 
    Cloud, 
    RefreshCw, 
    XCircle 
} from 'lucide-react';
import { format } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSystemHealth } from '@/admin/hooks/useSystemHealth';

export function SystemHealthPage() {
  const { data, isLoading, refetch, isRefetching } = useSystemHealth();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'degraded': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <Activity className="h-5 w-5 text-slate-500" />;
    }
  };

  const getServiceIcon = (name: string) => {
    if (name.includes('Database')) return <Database className="h-4 w-4" />;
    if (name.includes('API')) return <Server className="h-4 w-4" />;
    if (name.includes('Edge')) return <Zap className="h-4 w-4" />;
    if (name.includes('Storage')) return <Cloud className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  if (isLoading && !data) {
    return (
      <div className="flex h-96 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
          <p className="text-muted-foreground">Monitoramento em tempo real dos serviços críticos.</p>
        </div>
        <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            disabled={isRefetching}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Overall Status Banner */}
      <Card className={`border-l-4 ${
        data?.overallStatus === 'healthy' ? 'border-l-green-500' : 
        data?.overallStatus === 'degraded' ? 'border-l-yellow-500' : 'border-l-red-500'
      }`}>
        <CardContent className="pt-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${
                    data?.overallStatus === 'healthy' ? 'bg-green-100 dark:bg-green-900/30' : 
                    data?.overallStatus === 'degraded' ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-red-100 dark:bg-red-900/30'
                }`}>
                    {getStatusIcon(data?.overallStatus || 'unknown')}
                </div>
                <div>
                    <h2 className="text-xl font-semibold">
                        {data?.overallStatus === 'healthy' ? 'Todos os sistemas operacionais' : 
                         data?.overallStatus === 'degraded' ? 'Degradação de Performance Detectada' : 'Interrupção de Serviço Crítica'}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Última atualização: {data ? format(new Date(data.lastUpdated), 'HH:mm:ss') : '--:--:--'}
                    </p>
                </div>
            </div>
            <div className="text-right hidden md:block">
                <div className="text-2xl font-mono font-bold">99.98%</div>
                <div className="text-xs text-muted-foreground">Uptime (30 dias)</div>
            </div>
        </CardContent>
      </Card>

      {/* Service Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {data?.services.map((service) => (
          <Card key={service.service}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                {getServiceIcon(service.service)}
                {service.service}
              </CardTitle>
              {getStatusIcon(service.status)}
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2 mt-2">
                 {Object.entries(service.metrics).map(([key, value]) => (
                     <div key={key} className="flex justify-between text-xs">
                         <span className="text-muted-foreground capitalize">{key}</span>
                         <span className="font-mono font-medium">{value}</span>
                     </div>
                 ))}
                 {service.error && (
                     <div className="text-xs text-red-500 mt-1 truncate" title={service.error}>
                         {service.error}
                     </div>
                 )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Incidents (Mocked for UI) */}
      <Card>
          <CardHeader>
              <CardTitle>Histórico de Incidentes</CardTitle>
              <CardDescription>Últimos eventos registrados nos últimos 30 dias.</CardDescription>
          </CardHeader>
          <CardContent>
              <div className="space-y-4">
                  {[
                      { date: '2025-10-14 14:30', title: 'Alta latência na API', status: 'Resolved', severity: 'Minor' },
                      { date: '2025-10-02 09:15', title: 'Database maintenance window', status: 'Completed', severity: 'Maintenance' },
                  ].map((incident, i) => (
                      <div key={i} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                          <div className="flex items-center gap-4">
                              <div className={`w-2 h-2 rounded-full ${
                                  incident.severity === 'Minor' ? 'bg-yellow-500' : 'bg-blue-500'
                              }`} />
                              <div>
                                  <p className="text-sm font-medium">{incident.title}</p>
                                  <p className="text-xs text-muted-foreground">{incident.date}</p>
                              </div>
                          </div>
                          <Badge variant="outline">{incident.status}</Badge>
                      </div>
                  ))}
                  <div className="text-center pt-2">
                      <p className="text-xs text-muted-foreground">Nenhum incidente ativo no momento.</p>
                  </div>
              </div>
          </CardContent>
      </Card>
    </div>
  );
}
