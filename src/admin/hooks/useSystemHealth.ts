import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface ServiceHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'error';
  metrics: {
    [key: string]: string | number;
  };
  error?: string;
  lastChecked: string;
}

export interface SystemHealthData {
  services: ServiceHealth[];
  overallStatus: 'healthy' | 'degraded' | 'error';
  lastUpdated: string;
}

async function checkDatabaseHealth(): Promise<ServiceHealth> {
  const start = performance.now();
  try {
    const { data: metrics, error } = await supabase.rpc('get_database_metrics');
    
    if (error) throw error;
    
    const latency = Math.round(performance.now() - start);
    
    // Determine status based on thresholds
    let status: ServiceHealth['status'] = 'healthy';
    if (metrics.cpu > 80 || latency > 200) status = 'degraded';
    if (metrics.cpu > 90 || latency > 1000) status = 'error';

    return {
      service: 'Database',
      status,
      metrics: {
        cpu: `${metrics.cpu}%`,
        connections: metrics.connections,
        memory: `${metrics.memory_usage}%`,
        latency: `${latency}ms`
      },
      lastChecked: new Date().toISOString()
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return {
      service: 'Database',
      status: 'error',
      metrics: {},
      error: message,
      lastChecked: new Date().toISOString()
    };
  }
}

async function checkApiHealth(): Promise<ServiceHealth> {
  // Simulating API check since we are in the API's client mostly
  // In a real app we might fetch('/api/health')
  const start = performance.now();
  await new Promise(resolve => setTimeout(resolve, Math.random() * 100)); // Simulate net delay
  const latency = Math.round(performance.now() - start);

  return {
    service: 'API Server',
    status: latency < 200 ? 'healthy' : 'degraded',
    metrics: {
      uptime: '99.9%',
      latency: `${latency}ms`
    },
    lastChecked: new Date().toISOString()
  };
}

async function checkEdgeFunctions(): Promise<ServiceHealth> {
    // Simulated check
    return {
        service: 'Edge Functions',
        status: 'healthy',
        metrics: {
            invocations: '1.2k/min',
            errors: '0'
        },
        lastChecked: new Date().toISOString()
    };
}

async function checkStorage(): Promise<ServiceHealth> {
     // Simulated check
     return {
        service: 'Storage (CDN)',
        status: 'healthy',
        metrics: {
            bandwidth: '45 MB/s',
            cache_hit: '94%'
        },
        lastChecked: new Date().toISOString()
    };
}


export function useSystemHealth() {
  return useQuery({
    queryKey: ['system-health'],
    queryFn: async (): Promise<SystemHealthData> => {
      const services = await Promise.all([
        checkDatabaseHealth(),
        checkApiHealth(),
        checkEdgeFunctions(),
        checkStorage()
      ]);

      const hasError = services.some(s => s.status === 'error');
      const hasDegraded = services.some(s => s.status === 'degraded');
      
      const overallStatus = hasError ? 'error' : hasDegraded ? 'degraded' : 'healthy';

      return {
        services,
        overallStatus,
        lastUpdated: new Date().toISOString()
      };
    },
    refetchInterval: 15000, // 15 seconds polling
    refetchOnWindowFocus: true
  });
}
