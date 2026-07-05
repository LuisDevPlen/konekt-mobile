import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { Customer } from '../types';

import { storeApi } from '../services/storeApi';

import * as storage from '../storage/secure';

import { setAuthHandlers } from '../services/httpClient';



interface AuthContextValue {
  customer: Customer | null;
  isAuthenticated: boolean;
  loading: boolean;
  needsTermsAcceptance: () => boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    termsAccepted: true;
  }) => Promise<void>;
  acceptTerms: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}



const AuthContext = createContext<AuthContextValue | null>(null);



export function AuthProvider({ children }: { children: React.ReactNode }) {

  const [customer, setCustomer] = useState<Customer | null>(null);

  const [loading, setLoading] = useState(true);

  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);



  const logout = useCallback(async () => {

    await storage.clearAllSession();

    setCustomer(null);

  }, []);



  const refreshTokens = useCallback(async (): Promise<string | null> => {

    if (refreshPromiseRef.current) return refreshPromiseRef.current;

    refreshPromiseRef.current = (async () => {

    const refresh = await storage.getRefreshToken();

    if (!refresh) return null;

    try {

      const data = await storeApi.refresh(refresh);

      await storage.saveTokens(data.accessToken, data.refreshToken);

      return data.accessToken;

    } catch {

      await logout();

      return null;

    }

    })();

    try {

      return await refreshPromiseRef.current;

    } finally {

      refreshPromiseRef.current = null;

    }

  }, [logout]);



  useEffect(() => {

    setAuthHandlers(refreshTokens, logout);

  }, [refreshTokens, logout]);



  useEffect(() => {

    (async () => {

      setLoading(true);

      const token = await storage.getAccessToken();

      if (token) {

        try {

          const profile = await storeApi.me();

          setCustomer(profile);

          await storage.saveCustomer(profile);

        } catch {

          await logout();

        }

      } else {

        setCustomer(null);

      }

      setLoading(false);

    })();

  }, [logout]);



  const login = useCallback(async (email: string, password: string) => {

    await storage.clearAllSession();

    const data = await storeApi.login({ email, password });

    await storage.saveTokens(data.accessToken, data.refreshToken);

    await storage.saveCustomer(data.customer);

    setCustomer(data.customer);

  }, []);



  const register = useCallback(async (body: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    termsAccepted: true;
  }) => {
    await storage.clearAllSession();
    const data = await storeApi.register(body);
    await storage.saveTokens(data.accessToken, data.refreshToken);
    await storage.saveCustomer(data.customer);
    setCustomer(data.customer);
  }, []);

  const acceptTerms = useCallback(async () => {
    const profile = await storeApi.acceptTerms();
    setCustomer(profile);
    await storage.saveCustomer(profile);
  }, []);

  const needsTermsAcceptance = useCallback(() => {
    return !!customer && customer.termsAccepted !== true;
  }, [customer]);

  const refreshProfile = useCallback(async () => {
    const profile = await storeApi.me();
    setCustomer(profile);
    await storage.saveCustomer(profile);
  }, []);

  const value = useMemo(
    () => ({
      customer,
      isAuthenticated: !!customer,
      loading,
      needsTermsAcceptance,
      login,
      register,
      acceptTerms,
      logout,
      refreshProfile,
    }),
    [customer, loading, needsTermsAcceptance, login, register, acceptTerms, logout, refreshProfile]
  );



  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;

}



export function useAuth() {

  const ctx = useContext(AuthContext);

  if (!ctx) throw new Error('useAuth must be used within AuthProvider');

  return ctx;

}


