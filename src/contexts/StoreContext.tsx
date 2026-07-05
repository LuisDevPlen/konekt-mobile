import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { Tenant } from '../types';

import { storeApi } from '../services/storeApi';



interface StoreContextValue {

  store: Tenant | null;

  enterStore: (tenant: Tenant) => Promise<void>;

  enterStoreBySlug: (slug: string) => Promise<Tenant>;

  leaveStore: () => void;

}



const StoreContext = createContext<StoreContextValue | null>(null);



export function StoreProvider({ children }: { children: React.ReactNode }) {

  const [store, setStore] = useState<Tenant | null>(null);



  const enterStore = useCallback(async (tenant: Tenant) => {

    const validated = await storeApi.getTenant(tenant.slug);

    setStore(validated);

  }, []);



  const enterStoreBySlug = useCallback(async (slug: string) => {

    const validated = await storeApi.getTenant(slug);

    setStore(validated);

    return validated;

  }, []);



  const leaveStore = useCallback(() => {

    setStore(null);

  }, []);



  const value = useMemo(

    () => ({ store, enterStore, enterStoreBySlug, leaveStore }),

    [store, enterStore, enterStoreBySlug, leaveStore]

  );



  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;

}



export function useStore() {

  const ctx = useContext(StoreContext);

  if (!ctx) throw new Error('useStore must be used within StoreProvider');

  return ctx;

}



export function useStoreGuard() {

  const { store } = useStore();

  if (!store) throw new Error('Nenhuma loja selecionada');

  return store;

}



/** @deprecated use useStore */

export const useTenant = useStore;

/** @deprecated use StoreProvider */

export const TenantProvider = StoreProvider;

/** @deprecated use useStoreGuard */

export const useTenantGuard = useStoreGuard;


