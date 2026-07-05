import { Tenant } from '../types';

export type StoreCategoryFilter = 'all' | 'restaurant' | 'shop' | 'market' | 'promo';
export type StoreSortFilter = 'name' | 'rating' | 'free';

export type StoreFilterId =
  | 'sort'
  | 'sort_name'
  | 'sort_rating'
  | 'sort_free'
  | 'free'
  | 'open'
  | 'near'
  | 'promo';

const MARKET_RE = /\b(mercado|market|hortifruti|supermercado|mercearia|padaria)\b/i;
const SHOP_RE = /\b(loja|shop|boutique|varejo|eletr[oô]nicos?|tech|inform[aá]tica)\b/i;

export function classifyStoreSegment(tenant: Tenant): 'restaurant' | 'shop' | 'market' {
  const text = `${tenant.name} ${tenant.description ?? ''} ${tenant.slug}`;
  if (MARKET_RE.test(text)) return 'market';
  if (SHOP_RE.test(text)) return 'shop';
  return 'restaurant';
}

export function storeMatchesSearch(tenant: Tenant, term: string): boolean {
  const q = term.trim().toLowerCase();
  if (!q) return true;
  return (
    tenant.name.toLowerCase().includes(q)
    || tenant.slug.toLowerCase().includes(q)
    || (tenant.description ?? '').toLowerCase().includes(q)
    || (tenant.address ?? '').toLowerCase().includes(q)
  );
}

export function filterAndSortStores(
  stores: Tenant[],
  options: {
    search?: string;
    category?: StoreCategoryFilter;
    activeFilters?: Set<string>;
    sort?: StoreSortFilter;
  }
): Tenant[] {
  const search = options.search ?? '';
  const category = options.category ?? 'all';
  const active = options.activeFilters ?? new Set<string>();
  let sort: StoreSortFilter = options.sort ?? 'name';

  if (active.has('sort_rating')) sort = 'rating';
  else if (active.has('sort_free')) sort = 'free';
  else if (active.has('sort_name')) sort = 'name';

  let list = stores.filter((store) => storeMatchesSearch(store, search));

  if (category === 'promo' || active.has('promo')) {
    list = list.filter((store) => store.has_promo);
  } else if (category === 'restaurant') {
    list = list.filter((store) => classifyStoreSegment(store) === 'restaurant');
  } else if (category === 'shop') {
    list = list.filter((store) => classifyStoreSegment(store) === 'shop');
  } else if (category === 'market') {
    list = list.filter((store) => classifyStoreSegment(store) === 'market');
  }

  if (active.has('free')) {
    list = list.filter((store) => store.free_delivery);
  }

  // "Abertos agora" / "Perto de você": lojas públicas já estão ativas; sem geolocalização, mantém lista.
  if (active.has('open') || active.has('near')) {
    list = list.filter((store) => store.active !== false);
  }

  const sorted = [...list];
  if (sort === 'rating') {
    sorted.sort((a, b) => {
      const ra = a.rating_count ? Number(a.rating_average ?? 0) : -1;
      const rb = b.rating_count ? Number(b.rating_average ?? 0) : -1;
      if (rb !== ra) return rb - ra;
      return a.name.localeCompare(b.name);
    });
  } else if (sort === 'free') {
    sorted.sort((a, b) => {
      const fa = a.free_delivery ? 0 : 1;
      const fb = b.free_delivery ? 0 : 1;
      if (fa !== fb) return fa - fb;
      return a.name.localeCompare(b.name);
    });
  } else {
    sorted.sort((a, b) => a.name.localeCompare(b.name));
  }

  return sorted;
}

export function formatStoreRating(tenant: Tenant): string | null {
  if (!tenant.rating_count || tenant.rating_count <= 0 || tenant.rating_average == null) {
    return null;
  }
  const avg = Number(tenant.rating_average).toFixed(1).replace('.', ',');
  const count = tenant.rating_count;
  const label = count === 1 ? '1 avaliação' : `${count} avaliações`;
  return `${avg} (${label})`;
}

export function formatStoreDelivery(tenant: Tenant): string {
  if (!tenant.delivery_enabled) return 'Somente retirada';
  if (tenant.free_delivery) return 'Entrega grátis';
  const tiers = tenant.delivery_fee_tiers;
  if (Array.isArray(tiers) && tiers.length > 0) {
    const fees = tiers.map((t) => Number(t.fee)).filter((n) => Number.isFinite(n));
    if (fees.length) {
      const min = Math.min(...fees);
      return `Entrega a partir de R$ ${min.toFixed(2).replace('.', ',')}`;
    }
  }
  return 'Entrega disponível';
}
