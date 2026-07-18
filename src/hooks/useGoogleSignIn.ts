import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import {
  DINO_EATS_GOOGLE,
  getGoogleWebClientId,
  isExpoGo,
} from '../utils/googleAuth';

type GoogleSigninModule = typeof import('@react-native-google-signin/google-signin');

let nativeModule: GoogleSigninModule | null | undefined;
let configured = false;

function loadNativeModule(): GoogleSigninModule | null {
  if (isExpoGo() || Platform.OS === 'web') {
    return null;
  }
  if (nativeModule !== undefined) {
    return nativeModule;
  }
  try {
    // Lazy require: nunca carregar no Expo Go (não tem RNGoogleSignin nativo).
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    nativeModule = require('@react-native-google-signin/google-signin') as GoogleSigninModule;
    return nativeModule;
  } catch {
    nativeModule = null;
    return null;
  }
}

function ensureConfigured(mod: GoogleSigninModule) {
  if (configured) return;
  mod.GoogleSignin.configure({
    webClientId: getGoogleWebClientId() || DINO_EATS_GOOGLE.webClientId,
    offlineAccess: false,
    forceCodeForRefreshToken: false,
  });
  configured = true;
}

export function useGoogleSignIn() {
  const [ready, setReady] = useState(false);
  const expoGo = isExpoGo();
  const nativeAvailable = !expoGo && Platform.OS !== 'web' && !!loadNativeModule();

  useEffect(() => {
    if (expoGo || Platform.OS === 'web') {
      setReady(true);
      return;
    }
    const mod = loadNativeModule();
    if (mod) {
      try {
        ensureConfigured(mod);
        setReady(true);
      } catch {
        setReady(false);
      }
    } else {
      setReady(true);
    }
  }, [expoGo]);

  const signIn = useCallback(async (): Promise<string> => {
    if (expoGo || !nativeAvailable) {
      throw new Error(
        'Login com Google não funciona no Expo Go. O Google bloqueia redirect exp://. Use: npx expo run:android'
      );
    }

    const mod = loadNativeModule();
    if (!mod) {
      throw new Error(
        'Módulo Google Sign-In não encontrado. Gere o build nativo: npx expo run:android'
      );
    }

    ensureConfigured(mod);

    await mod.GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await mod.GoogleSignin.signIn();

    if (!mod.isSuccessResponse(response)) {
      throw new Error('Login com Google cancelado');
    }

    const idToken = response.data.idToken;
    if (!idToken) {
      const tokens = await mod.GoogleSignin.getTokens();
      if (!tokens.idToken) {
        throw new Error('Não foi possível obter o token do Google');
      }
      return tokens.idToken;
    }

    return idToken;
  }, [expoGo, nativeAvailable]);

  return {
    signIn,
    ready,
    requiresDevBuild: expoGo || !nativeAvailable,
  };
}

export function mapGoogleSignInError(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;

  if (!isExpoGo() && Platform.OS !== 'web') {
    try {
      const mod = loadNativeModule();
      if (mod && mod.isErrorWithCode(err)) {
        const code = (err as { code?: string }).code;
        switch (code) {
          case mod.statusCodes.SIGN_IN_CANCELLED:
            return 'Login com Google cancelado';
          case mod.statusCodes.IN_PROGRESS:
            return 'Login com Google já em andamento';
          case mod.statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            return 'Google Play Services indisponível neste aparelho';
          default:
            break;
        }
      }
    } catch {
      // ignore
    }
  }

  return 'Não foi possível entrar com Google';
}
