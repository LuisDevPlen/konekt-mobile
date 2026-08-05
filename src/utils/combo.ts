import { ComboGroupItem, ComboSelection, Product } from '../types';

const numberOf = (value: number | string | null | undefined) => Number(value ?? 0) || 0;
const isAvailable = (item: ComboGroupItem) => item.active !== false && (!item.track_stock || numberOf(item.stock) > 0);
const itemPrice = (item: ComboGroupItem) => numberOf(item.current_price ?? (item.promo_active ? item.promo_price : item.price));

export function validateComboSelections(product: Product, selections: ComboSelection[]): string | null {
  for (const group of product.combo_groups ?? []) {
    if (!group.active) continue;
    const chosen = selections.filter((selection) => selection.groupId === group.id);
    const min = Math.max(group.required ? 1 : 0, group.min_selections ?? 0);
    if (chosen.length < min) return `Escolha ao menos ${min} op\u00e7\u00e3o(\u00f5es) em ${group.name}.`;
    if (chosen.length > group.max_selections) return `Escolha no m\u00e1ximo ${group.max_selections} op\u00e7\u00e3o(\u00f5es) em ${group.name}.`;
    if (chosen.some((selection) => !group.items.some((item) => item.id === selection.itemId && isAvailable(item)))) return `Uma op\u00e7\u00e3o de ${group.name} n\u00e3o est\u00e1 dispon\u00edvel.`;
  }
  return null;
}

export function comboUnitPrice(product: Product, selections: ComboSelection[]): number {
  const selected = (product.combo_groups ?? [])
    .flatMap((group) => selections
      .filter((selection) => selection.groupId === group.id)
      .map((selection) => group.items.find((item) => item.id === selection.itemId)))
    .filter(Boolean) as ComboGroupItem[];
  const additions = selected.reduce((total, item) => total + numberOf(item.additional_price), 0);
  if (product.combo_price_type === 'SUM_ITEMS') return selected.reduce((total, item) => total + itemPrice(item), additions);
  const base = numberOf(product.promo_active ? product.promo_price : product.price);
  return base + additions;
}

export function comboStartingPrice(product: Product): number {
  if (product.combo_price_type !== 'SUM_ITEMS') return numberOf(product.promo_active ? product.promo_price : product.price);
  return (product.combo_groups ?? []).reduce((total, group) => {
    const count = Math.max(group.required ? 1 : 0, group.min_selections ?? 0);
    const cheapest = [...group.items]
      .filter(isAvailable)
      .sort((a, b) => (itemPrice(a) + numberOf(a.additional_price)) - (itemPrice(b) + numberOf(b.additional_price)))
      .slice(0, count)
      .reduce((sum, item) => sum + itemPrice(item) + numberOf(item.additional_price), 0);
    return total + cheapest;
  }, 0);
}
