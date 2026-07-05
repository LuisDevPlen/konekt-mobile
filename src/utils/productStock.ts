import { Product } from '../types';

export function tracksStock(product: Pick<Product, 'track_stock'>): boolean {
  return product.track_stock !== false;
}

export function isProductAvailable(product: Pick<Product, 'track_stock' | 'stock'>): boolean {
  return !tracksStock(product) || product.stock > 0;
}

export function maxProductQuantity(product: Pick<Product, 'track_stock' | 'stock'>): number {
  return tracksStock(product) ? Math.max(product.stock, 0) : 99;
}

export function stockLabel(product: Pick<Product, 'track_stock' | 'stock'>): string {
  if (!tracksStock(product)) return 'Sempre disponível';
  return product.stock > 0 ? `${product.stock} disponíveis` : 'Sem estoque';
}
