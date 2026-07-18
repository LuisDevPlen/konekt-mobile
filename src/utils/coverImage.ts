import { Tenant } from '../types';
import { resolveImageUrl } from './imageUrl';

export function getTenantCoverUri(tenant?: Pick<Tenant, 'cover_url'> | null): string | null {
  return resolveImageUrl(tenant?.cover_url ?? null);
}

export const DEFAULT_AUTH_COVER =
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80';
