jest.mock('expo-constants', () => ({
  appOwnership: 'standalone',
  expoConfig: { extra: {} },
}));

import { getGoogleAuthRequestConfig, getGoogleWebClientId, isGoogleSignInConfigured } from '../src/utils/googleAuth';

describe('googleAuth', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('always resolves to Dino Eats web client id', () => {
    delete process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    expect(getGoogleWebClientId()).toContain('630358177762-');
    expect(isGoogleSignInConfigured()).toBe(true);
  });

  test('ignores non-Dino Eats env client ids', () => {
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = '999999999999-oldproject.apps.googleusercontent.com';
    expect(getGoogleWebClientId()).toContain('630358177762-');
    expect(getGoogleAuthRequestConfig()?.webClientId).toContain('630358177762-');
  });

  test('accepts Dino Eats env client id', () => {
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID =
      '630358177762-21rdhck17psdgtk9vd4rafomo1vc9134.apps.googleusercontent.com';
    expect(getGoogleWebClientId()).toBe(
      '630358177762-21rdhck17psdgtk9vd4rafomo1vc9134.apps.googleusercontent.com'
    );
  });
});
