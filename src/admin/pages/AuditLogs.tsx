import { useState } from 'react';
import { useAuditLogs } from '../hooks/useAuditLogs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Loader2, FilterX, Download } from 'lucide-react';
import { supabaseAdmin } from '@/admin/lib/supabase-admin';
// import { DatePicker } from '@/components/ui/date-picker'; // Fallback to native for now

export function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    action: '',
    resourceType: '',
    startDate: '', // using string for native input
    endDate: '',
  });

  // Convert string dates to Date objects for hook if present
  const hookFilters = {
    ...filters,
    startDate: filters.startDate ? new Date(filters.startDate) : undefined,
    endDate: filters.endDate ? new Date(filters.endDate) : undefined,
    // clear empty strings
    action: filters.action || undefined,
    resourceType: filters.resourceType || undefined,
  };

  const { data, isLoading, isError } = useAuditLogs({
    page,
    pageSize: 20,
    filters: hookFilters,
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to page 1 on filter change
  };

  const clearFilters = () => {
    setFilters({
      action: '',
      resourceType: '',
      startDate: '',
      endDate: '',
    });
    setPage(1);
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
        let query = supabaseAdmin.from('audit_logs').select('*').csv();

        // Apply filters (replicating hook logic roughly)
        if (hookFilters.action) query = query.eq('action', hookFilters.action);
        if (hookFilters.resourceType) query = query.eq('resource_type', hookFilters.resourceType);
        if (hookFilters.startDate) query = query.gte('timestamp', hookFilters.startDate.toISOString());
        if (hookFilters.endDate) query = query.lte('timestamp', hookFilters.endDate.toISOString());

        const { data, error } = await query;
        
        if (error) throw error;
        if (!data) throw new Error('No data');

        const blob = new Blob([data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

    } catch (error) {
        console.error('Export failed:', error);
        // Toast logic would be good here
    } finally {
        setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Logs de Auditoria</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Busque logs por ação, recurso ou data.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Ação (ex: create, update)"
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
            />
            <Input
              placeholder="Recurso (ex: system_settings)"
              value={filters.resourceType}
              onChange={(e) => handleFilterChange('resourceType', e.target.value)}
            />
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="block"
            />
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="block"
            />
          </div>
          <div className="mt-4 flex justify-end">
             <Button variant="outline" onClick={clearFilters} className="flex gap-2">
               <FilterX className="h-4 w-4" />
               Limpar Filtros
             </Button>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-md border bg-white dark:bg-slate-950">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500">Erro ao carregar logs. Tente novamente.</div>
        ) : data?.data.length === 0 ? (
           <div className="p-12 text-center text-slate-500">Nenhum log encontrado.</div>
        ) : (
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm text-left">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Data/Hora</th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Admin</th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Ação</th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Recurso</th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Status</th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground w-[200px]">Detalhes</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {data?.data.map((log) => (
                  <tr key={log.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <td className="p-4 align-middle font-mono text-xs">
                      {format(new Date(log.timestamp || ''), 'dd/MM/yyyy HH:mm:ss')}
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex flex-col">
                        <span className="font-medium">{log.admin?.name || 'Sistema'}</span>
                        <span className="text-xs text-muted-foreground">{log.admin?.email}</span>
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                        {log.action}
                      </span>
                    </td>
                     <td className="p-4 align-middle">
                        <span className="font-mono text-xs">{log.resource_type}</span>
                        {log.resource_id && <span className="block text-xs text-muted-foreground">ID: {log.resource_id.slice(0,8)}...</span>}
                    </td>
                    <td className="p-4 align-middle">
                      {log.result === 'failure' ? (
                         <span className="text-red-500 text-xs font-bold">Falha</span>
                      ) : (
                         <span className="text-green-500 text-xs font-bold">Sucesso</span>
                      )}
                    </td>
                     <td className="p-4 align-middle max-w-[200px] truncate" title={JSON.stringify(log.metadata)}>
                      <code className="text-xs bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded">
                        {JSON.stringify(log.metadata)?.slice(0, 50)}...
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

       {/* Pagination */}
       {data && data.totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Anterior
          </Button>
          <div className="text-sm font-medium">
            Página {page} de {data.totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
            disabled={page === data.totalPages}
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  );
}
