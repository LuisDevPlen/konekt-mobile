import { ApiResponse } from '../types';
import { ensureApiConnection, http } from './httpClient';

export interface PlatformBranding {
  logoUrl: string | null;
  contactEmail: string;
  contactPhone: string;
  platformName: string;
  updatedAt?: string | null;
}

export const DEFAULT_PLATFORM_NAME = 'Dino Eats';

export async function fetchPlatformBranding(): Promise<PlatformBranding> {
  await ensureApiConnection();
  try {
    const res = await http.get<ApiResponse<PlatformBranding>>('/public/branding');
    const data = res.data.data;
    return {
      ...data,
      platformName: data.platformName?.trim() || DEFAULT_PLATFORM_NAME,
    };
  } catch {
    return {
      logoUrl: null,
      contactEmail: '',
      contactPhone: '',
      platformName: DEFAULT_PLATFORM_NAME,
    };
  }
}
