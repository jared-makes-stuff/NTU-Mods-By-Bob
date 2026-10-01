const isString = (value: unknown): value is string => typeof value === 'string';

const extractFirstString = (value: unknown): string | undefined => {
  if (isString(value)) return value;
  if (Array.isArray(value)) {
    for (const entry of value) {
      if (isString(entry)) return entry;
    }
  }
  return undefined;
};

const normalizeStringArray = (values: string[]): string[] =>
  values.map((value) => value.trim()).filter((value) => value.length > 0);

export const getStringList = (value: unknown): string[] => {
  if (isString(value)) return [value];
  if (Array.isArray(value)) {
    return normalizeStringArray(value.filter(isString));
  }
  return [];
};

export const getQueryString = (value: unknown): string | undefined => {
  const result = extractFirstString(value);
  return result?.trim() || undefined;
};

export const getQueryStringArray = (value: unknown): string[] | undefined => {
  if (isString(value)) {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    return normalizeStringArray(trimmed.split(','));
  }

  if (Array.isArray(value)) {
    const entries = normalizeStringArray(value.filter(isString));
    return entries.length > 0 ? entries : undefined;
  }

  return undefined;
};

export const getQueryNumber = (value: unknown): number | undefined => {
  const result = getQueryString(value);
  if (!result) return undefined;
  const parsed = Number(result);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const getQueryInt = (value: unknown): number | undefined => {
  const result = getQueryString(value);
  if (!result) return undefined;
  const parsed = Number.parseInt(result, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const getQueryBoolean = (value: unknown): boolean | undefined => {
  const result = getQueryString(value);
  if (!result) return undefined;
  const normalized = result.toLowerCase();
  if (normalized === 'true' || normalized === '1') return true;
  if (normalized === 'false' || normalized === '0') return false;
  return undefined;
};
