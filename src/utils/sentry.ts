import * as Sentry from '@sentry/react-native';

/** Sem DSN, nada é inicializado — nenhum crash/evento é enviado. */
export function initSentry(): void {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim();
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: __DEV__ ? 'development' : 'production',
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
  });
}

export { Sentry };
