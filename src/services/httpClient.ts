import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { config, getApiUrl, probeApiConnection, resetActiveApiUrl, resolveApiUrlCandidates, setActiveApiUrl } from '../utils/config';
import { AppApiError } from '../utils/errors';
import * as storage from '../storage/secure';

type RefreshHandler = () => Promise<string | null>;
type LogoutHandler = () => Promise<void>;
type KonektRequestConfig = InternalAxiosRequestConfig & { _konektRetried?: boolean };

let onRefresh: RefreshHandler | null = null;
let onLogout: LogoutHandler | null = null;
let probeDone = false;
let probePromise: Promise<string> | null = null;

export function resetApiConnection(): void {
  probeDone = false;
  probePromise = null;
  resetActiveApiUrl();
}

export function setAuthHandlers(refresh: RefreshHandler, logout: LogoutHandler) {
  onRefresh = refresh;
  onLogout = logout;
}

export function ensureApiConnection(): Promise<string> {
  if (probeDone) {
    return Promise.resolve(getApiUrl());
  }
  if (!probePromise) {
    probePromise = probeApiConnection().then((url) => {
      probeDone = true;
      return url;
    });
  }
  return probePromise;
}

export const http = axios.create({
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

function isSessionAuthUrl(url?: string): boolean {
  return !!url && (
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/refresh')
  );
}

function canRefreshSession(url?: string): boolean {
  return !!url && !isSessionAuthUrl(url);
}

http.interceptors.request.use(async (req: InternalAxiosRequestConfig) => {
  await ensureApiConnection();
  req.baseURL = getApiUrl();

  if (__DEV__ && req.url) {
    console.log(`[API] ${req.method?.toUpperCase()} ${getApiUrl()}${req.url}`);
  }

  const token = await storage.getAccessToken();
  if (token && req.headers && !isSessionAuthUrl(req.url)) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

http.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<{ error?: { code: string; message: string; details?: unknown } }>) => {
    const original = error.config;
    const status = error.response?.status ?? 0;
    const body = error.response?.data?.error;

    if (
      status === 401 &&
      original &&
      !(original as KonektRequestConfig)._konektRetried &&
      canRefreshSession(original.url) &&
      onRefresh
    ) {
      (original as KonektRequestConfig)._konektRetried = true;
      const newToken = await onRefresh();
      if (newToken && original.headers) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return http(original);
      }
      if (onLogout) await onLogout();
    }

    if (!error.response && original && !(original as KonektRequestConfig)._konektRetried) {
      const candidates = resolveApiUrlCandidates();
      const current = getApiUrl();
      const nextIndex = candidates.indexOf(current) + 1;

      if (nextIndex > 0 && nextIndex < candidates.length) {
        setActiveApiUrl(candidates[nextIndex]);
        (original as KonektRequestConfig)._konektRetried = true;
        original.baseURL = candidates[nextIndex];
        return http(original);
      }
    }

    if (!error.response) {
      throw new AppApiError('Sem conexão com o servidor', 0, 'NETWORK_ERROR');
    }

    throw new AppApiError(
      body?.message || 'Erro na requisição',
      status,
      body?.code || 'UNKNOWN',
      body?.details as AppApiError['details']
    );
  }
);

export { config };
