export const normalizeHost = (value?: string): string | undefined => {
  const trimmed = value?.trim().replace(/\/$/, '');
  if (!trimmed) return undefined;
  return /^https?:\/\//i.test(trimmed) ? trimmed : undefined;
};

export const normalizeUrl = (value?: string): string | undefined => {
  const trimmed = value?.trim().replace(/\/$/, '');
  return trimmed || undefined;
};

export const buildUrlFromHost = (host?: string, port?: string): string | undefined => {
  if (!host) {
    return undefined;
  }

  const normalizedHost = normalizeHost(host);
  if (!normalizedHost) {
    return undefined;
  }

  if (!port) {
    return normalizedHost;
  }

  try {
    const parsed = new URL(normalizedHost);
    return parsed.port ? normalizedHost : `${normalizedHost}:${port}`;
  } catch {
    return `${normalizedHost}:${port}`;
  }
};
