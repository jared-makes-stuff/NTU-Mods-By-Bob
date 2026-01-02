/**
 * Health check types
 */

/**
 * Service health status
 */
export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  message?: string;
}

/**
 * System health summary
 */
export interface SystemHealth {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptime: number;
  services: ServiceHealth[];
}
