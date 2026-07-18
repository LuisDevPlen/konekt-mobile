jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    isDevice: true,
    expoConfig: null,
    manifest2: null,
    platform: { android: { model: 'SM-G991B', brand: 'samsung' } },
  },
}));

jest.mock('expo', () => ({
  getExpoGoProjectConfig: jest.fn(() => null),
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
}));

describe('resolveApiUrl', () => {
  const originalDev = (global as { __DEV__?: boolean }).__DEV__;
  const originalEnv = process.env.EXPO_PUBLIC_API_URL;

  afterEach(() => {
    (global as { __DEV__?: boolean }).__DEV__ = originalDev;
    process.env.EXPO_PUBLIC_API_URL = originalEnv;
    jest.resetModules();
  });

  test('uses env URL in production', () => {
    (global as { __DEV__?: boolean }).__DEV__ = false;
    process.env.EXPO_PUBLIC_API_URL = 'https://api.konekt.com/api';
    jest.isolateModules(() => {
      const { resolveApiUrlCandidates } = require('../src/utils/config');
      expect(resolveApiUrlCandidates()).toEqual(['https://api.konekt.com/api']);
    });
  });

  test('fails production build when API URL is localhost', () => {
    (global as { __DEV__?: boolean }).__DEV__ = false;
    process.env.EXPO_PUBLIC_API_URL = 'http://127.0.0.1:3000/api';
    jest.isolateModules(() => {
      const { resolveApiUrlCandidates } = require('../src/utils/config');
      expect(() => resolveApiUrlCandidates()).toThrow(/localhost/i);
    });
  });

  test('fails production build when API URL is missing', () => {
    (global as { __DEV__?: boolean }).__DEV__ = false;
    delete process.env.EXPO_PUBLIC_API_URL;
    jest.isolateModules(() => {
      const { resolveApiUrlCandidates } = require('../src/utils/config');
      expect(() => resolveApiUrlCandidates()).toThrow(/obrigatória/i);
    });
  });

  test('derives API host from Expo Go debugger host in dev', () => {
    (global as { __DEV__?: boolean }).__DEV__ = true;
    process.env.EXPO_PUBLIC_API_URL = 'http://127.0.0.1:3000/api';
    const { getExpoGoProjectConfig } = require('expo');
    getExpoGoProjectConfig.mockReturnValue({ debuggerHost: '192.168.0.42:8081' });

    jest.isolateModules(() => {
      const { resolveApiUrlCandidates } = require('../src/utils/config');
      const candidates = resolveApiUrlCandidates();
      expect(candidates[0]).toBe('http://127.0.0.1:3000/api');
      expect(candidates).toContain('http://192.168.0.42:3000/api');
    });
  });

  test('does not use 10.0.2.2 on physical android device', () => {
    (global as { __DEV__?: boolean }).__DEV__ = true;
    process.env.EXPO_PUBLIC_API_URL = '';
    jest.isolateModules(() => {
      const { resolveApiUrlCandidates } = require('../src/utils/config');
      const candidates = resolveApiUrlCandidates();
      expect(candidates).toContain('http://127.0.0.1:3000/api');
      expect(candidates).not.toContain('http://10.0.2.2:3000/api');
    });
  });
});
