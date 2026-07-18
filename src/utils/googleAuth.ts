import Constants from 'expo-constants';
import { Platform } from 'react-native';

/** Credenciais oficiais Dino Eats (Google Cloud — projeto Dino Eats Delivery). */
export const DINO_EATS_GOOGLE = {
  webClientId: '630358177762-21rdhck17psdgtk9vd4rafomo1vc9134.apps.googleusercontent.com',
  androidClientId: '630358177762-0s7vn3h57l2feel8i3p3vabem1m4b49k.apps.googleusercontent.com',
  iosClientId: '630358177762-ermgfja5ki9699fa56s64dftl87maoqn.apps.googleusercontent.com',
} as const;

function envClientId(name: string): string {
  return process.env[name]?.trim() || '';
}

function extraClientId(key: 'googleWebClientId' | 'googleAndroidClientId' | 'googleIosClientId'): string {
  const extra = Constants.expoConfig?.extra as Record<string, string> | undefined;
  return extra?.[key]?.trim() || '';
}

/**
 * Sempre usa Dino Eats.
 * Ignora Client IDs de outros projetos (ex.: conta pessoal antiga).
 */
function resolveClientId(
  envName: string,
  extraKey: 'googleWebClientId' | 'googleAndroidClientId' | 'googleIosClientId',
  fallback: string
): string {
  const fromExtra = extraClientId(extraKey);
  if (fromExtra.startsWith('630358177762-')) return fromExtra;

  const fromEnv = envClientId(envName);
  if (fromEnv.startsWith('630358177762-')) return fromEnv;

  return fallback;
}

export function isExpoGo(): boolean {
  // Expo Go não tem módulos nativos customizados (ex.: RNGoogleSignin).
  return (
    Constants.appOwnership === 'expo' ||
    (Constants as { executionEnvironment?: string }).executionEnvironment === 'storeClient'
  );
}

export function getGoogleWebClientId(): string {
  return resolveClientId(
    'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID',
    'googleWebClientId',
    DINO_EATS_GOOGLE.webClientId
  );
}

export function getGoogleAndroidClientId(): string {
  return resolveClientId(
    'EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID',
    'googleAndroidClientId',
    DINO_EATS_GOOGLE.androidClientId
  );
}

export function getGoogleIosClientId(): string {
  return resolveClientId(
    'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID',
    'googleIosClientId',
    DINO_EATS_GOOGLE.iosClientId
  );
}

/** Mantido para compatibilidade com testes / UI. */
export function isGoogleSignInConfigured(): boolean {
  return !!getGoogleWebClientId() && Platform.OS !== 'web';
}

/** @deprecated Prefer native Google Sign-In. Kept for tests. */
export function getGoogleAuthRequestConfig() {
  const webClientId = getGoogleWebClientId();
  if (!webClientId) return null;
  return {
    webClientId,
    androidClientId: getGoogleAndroidClientId() || webClientId,
    iosClientId: getGoogleIosClientId() || webClientId,
    redirectUri: 'dinoeats://redirect',
  };
}
