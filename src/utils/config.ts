import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getExpoGoProjectConfig } from 'expo';

const API_PATH = '/api';
const API_PORT = 3000;

function getMetroHost(): string | null {
  const fromExpoGo = getExpoGoProjectConfig()?.debuggerHost;
  if (fromExpoGo) {
    return fromExpoGo.split(':')[0] || null;
  }

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    return hostUri.split(':')[0] || null;
  }

  const manifestHost = Constants.manifest2?.extra?.expoGo?.debuggerHost as string | undefined;
  if (manifestHost) {
    return manifestHost.split(':')[0] || null;
  }

  return null;
}

function isLikelyAndroidEmulator(): boolean {
  if (Platform.OS !== 'android') return false;

  const model = (Constants.platform?.android?.model ?? '').toLowerCase();
  const brand = (Constants.platform?.android?.brand ?? '').toLowerCase();

  return (
    model.includes('sdk') ||
    model.includes('emulator') ||
    model.includes('gphone') ||
    (brand === 'google' && model.includes('android'))
  );
}

function toApiUrl(host: string): string {
  return `http://${host}:${API_PORT}${API_PATH}`;
}

function isLocalhostUrl(url: string): boolean {
  return /:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(url);
}

function assertProductionApiUrl(url: string | undefined): string {
  const trimmed = url?.trim();
  if (!trimmed) {
    throw new Error(
      'EXPO_PUBLIC_API_URL é obrigatória em builds de produção. Defina uma URL HTTPS da API.'
    );
  }
  if (isLocalhostUrl(trimmed)) {
    throw new Error(
      'EXPO_PUBLIC_API_URL não pode apontar para localhost em produção. Use a URL HTTPS oficial da API.'
    );
  }
  if (!/^https:\/\//i.test(trimmed)) {
    throw new Error('EXPO_PUBLIC_API_URL em produção deve usar HTTPS.');
  }
  return trimmed.replace(/\/$/, '');
}

export function resolveApiUrlCandidates(): string[] {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  const candidates: string[] = [];

  const push = (url: string) => {
    if (url && !candidates.includes(url)) {
      candidates.push(url);
    }
  };

  if (!__DEV__) {
    push(assertProductionApiUrl(envUrl));
    return candidates;
  }

  if (Platform.OS === 'android') {
    // Celular fisico via USB (adb reverse) — nunca usar 10.0.2.2 aqui
    push(toApiUrl('127.0.0.1'));
  }

  const metroHost = getMetroHost();
  if (metroHost) {
    push(toApiUrl(metroHost));
  }

  if (envUrl) {
    push(envUrl);
  }

  if (isLikelyAndroidEmulator()) {
    push(toApiUrl('10.0.2.2'));
  }

  return candidates.length ? candidates : [toApiUrl('127.0.0.1')];
}

let activeApiUrl: string | null = null;

export function getApiUrl(): string {
  if (activeApiUrl) {
    return activeApiUrl;
  }

  const candidates = resolveApiUrlCandidates();
  return candidates[0] || toApiUrl('127.0.0.1');
}

export function setActiveApiUrl(url: string): void {
  activeApiUrl = url;
  if (__DEV__) {
    console.log(`[Konekt] API URL ativa: ${url}`);
  }
}

export function resetActiveApiUrl(): void {
  activeApiUrl = null;
}

export function resolveApiUrl(): string {
  return getApiUrl();
}

export async function probeApiConnection(): Promise<string> {
  const candidates = resolveApiUrlCandidates();

  for (const url of candidates) {
    const healthUrl = url.replace(/\/api\/?$/, '/health');
    try {
      const res = await axios.get(healthUrl, { timeout: 4000 });
      if (res.status === 200) {
        setActiveApiUrl(url);
        return url;
      }
    } catch {
      if (__DEV__) {
        console.log(`[Konekt] API indisponível em ${url}`);
      }
    }
  }

  const fallback =
    candidates.find((url) => !url.includes('10.0.2.2')) || candidates[0] || toApiUrl('127.0.0.1');
  setActiveApiUrl(fallback);
  return fallback;
}

export const config = {
  get apiUrl() {
    return getApiUrl();
  },
  get assetsBaseUrl() {
    return getApiUrl().replace(/\/api\/?$/, '');
  },
  google: {
    get webClientId() {
      return process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() || '';
    },
    get androidClientId() {
      return process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() || '';
    },
    get iosClientId() {
      return process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() || '';
    },
  },
};
