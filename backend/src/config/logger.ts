type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'debug';

const levelWeights: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

function normalizeLevel(value?: string): LogLevel {
  const normalized = value?.toLowerCase().trim();
  if (!normalized) return 'info';
  if (normalized === 'error' || normalized === 'warn' || normalized === 'info' || normalized === 'http' || normalized === 'debug') {
    return normalized;
  }
  return 'info';
}

function getCurrentLevel(): LogLevel {
  return normalizeLevel(process.env.LOG_LEVEL);
}

function shouldLog(level: LogLevel): boolean {
  const current = getCurrentLevel();
  return levelWeights[level] <= levelWeights[current];
}

function write(level: LogLevel, method: 'log' | 'warn' | 'error' | 'debug', args: unknown[]): void {
  if (!shouldLog(level)) return;
  // Preserve console formatting and object inspection.
  (console[method] as (...items: unknown[]) => void)(...args);
}

export const logger = {
  error: (...args: unknown[]) => write('error', 'error', args),
  warn: (...args: unknown[]) => write('warn', 'warn', args),
  info: (...args: unknown[]) => write('info', 'log', args),
  http: (...args: unknown[]) => write('http', 'log', args),
  debug: (...args: unknown[]) => write('debug', 'debug', args),
};
