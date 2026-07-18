import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_PLATFORM_NAME,
  fetchPlatformBranding,
  PlatformBranding,
} from '../services/platformApi';
import { resolveImageUrl } from '../utils/imageUrl';

type BrandingContextValue = {
  branding: PlatformBranding;
  logoUri: string | null;
  platformName: string;
  loading: boolean;
  refresh: () => Promise<void>;
};

const defaultBranding: PlatformBranding = {
  logoUrl: null,
  contactEmail: '',
  contactPhone: '',
  platformName: DEFAULT_PLATFORM_NAME,
};

const BrandingContext = createContext<BrandingContextValue>({
  branding: defaultBranding,
  logoUri: null,
  platformName: DEFAULT_PLATFORM_NAME,
  loading: true,
  refresh: async () => {},
});

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<PlatformBranding>(defaultBranding);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchPlatformBranding();
      setBranding(data);
    } catch {
      setBranding(defaultBranding);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      branding,
      logoUri: resolveImageUrl(branding.logoUrl),
      platformName: branding.platformName || DEFAULT_PLATFORM_NAME,
      loading,
      refresh,
    }),
    [branding, loading, refresh]
  );

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}

export function useBranding() {
  return useContext(BrandingContext);
}
