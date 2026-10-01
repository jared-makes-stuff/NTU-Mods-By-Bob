"use client";

const STATE_STORAGE_KEY = "google_oauth_state";
const STATE_TIMESTAMP_KEY = "google_oauth_state_ts";
const REDIRECT_STORAGE_KEY = "google_oauth_redirect";
const MODE_STORAGE_KEY = "google_oauth_mode";
const PROCESSING_STORAGE_KEY = "google_oauth_processing";
const STATE_TTL_MS = 10 * 60 * 1000;

export type GoogleOAuthMode = "login" | "link";

const fallbackState = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const getStorageCandidates = (): Storage[] => {
  if (typeof window === "undefined") {
    return [];
  }

  const storages: Storage[] = [];

  try {
    if (window.sessionStorage) {
      storages.push(window.sessionStorage);
    }
  } catch {
    // Storage might be unavailable in some browser contexts.
  }

  try {
    if (window.localStorage) {
      storages.push(window.localStorage);
    }
  } catch {
    // Storage might be unavailable in some browser contexts.
  }

  return storages;
};

const readStorageItem = (key: string): string | null => {
  for (const storage of getStorageCandidates()) {
    try {
      const value = storage.getItem(key);
      if (value !== null) {
        return value;
      }
    } catch {
      // Ignore storage read errors.
    }
  }

  return null;
};

const writeStorageItem = (key: string, value: string): void => {
  for (const storage of getStorageCandidates()) {
    try {
      storage.setItem(key, value);
    } catch {
      // Ignore storage write errors.
    }
  }
};

const removeStorageItem = (key: string): void => {
  for (const storage of getStorageCandidates()) {
    try {
      storage.removeItem(key);
    } catch {
      // Ignore storage remove errors.
    }
  }
};

const getStateTimestamp = (): number | null => {
  const raw = readStorageItem(STATE_TIMESTAMP_KEY);
  if (!raw) {
    return null;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
};

const isStateExpired = (timestamp: number): boolean => Date.now() - timestamp > STATE_TTL_MS;

export const createGoogleOAuthState = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return fallbackState();
};

export const storeGoogleOAuthState = (
  state: string,
  redirectPath: string,
  mode: GoogleOAuthMode = "login"
): void => {
  writeStorageItem(STATE_STORAGE_KEY, state);
  writeStorageItem(STATE_TIMESTAMP_KEY, String(Date.now()));
  writeStorageItem(REDIRECT_STORAGE_KEY, redirectPath);
  writeStorageItem(MODE_STORAGE_KEY, mode);
};

export const getGoogleOAuthState = (): {
  state: string | null;
  redirectPath: string | null;
  mode: GoogleOAuthMode | null;
} => {
  const state = readStorageItem(STATE_STORAGE_KEY);
  const redirectPath = readStorageItem(REDIRECT_STORAGE_KEY);
  const storedMode = readStorageItem(MODE_STORAGE_KEY);
  const timestamp = getStateTimestamp();

  if (state && timestamp && isStateExpired(timestamp)) {
    clearGoogleOAuthState();
    return { state: null, redirectPath: null, mode: null };
  }

  const mode = storedMode === "link" || storedMode === "login" ? storedMode : null;

  return { state, redirectPath, mode };
};

export const clearGoogleOAuthState = (): void => {
  removeStorageItem(STATE_STORAGE_KEY);
  removeStorageItem(STATE_TIMESTAMP_KEY);
  removeStorageItem(REDIRECT_STORAGE_KEY);
  removeStorageItem(MODE_STORAGE_KEY);
  removeStorageItem(PROCESSING_STORAGE_KEY);
};

export const getGoogleOAuthProcessingState = (): string | null => readStorageItem(PROCESSING_STORAGE_KEY);

export const setGoogleOAuthProcessingState = (state: string): void => {
  writeStorageItem(PROCESSING_STORAGE_KEY, state);
};

export const buildGoogleAuthorizeUrl = (params: {
  clientId: string;
  redirectUri: string;
  state: string;
  scope?: string;
}): string => {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", params.clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", params.scope ?? "openid email profile");
  url.searchParams.set("state", params.state);
  url.searchParams.set("include_granted_scopes", "true");
  return url.toString();
};
