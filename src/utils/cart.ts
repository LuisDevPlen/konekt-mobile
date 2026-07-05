import { CartItem, Product, SelectedAddition } from '../types';

export function calcProductUnitTotal(product: Product, selectedAdditions: SelectedAddition[] = []): number {
  const additionsTotal = selectedAdditions.reduce((sum, sel) => {
    const add = (product.additions || []).find((a) => a.id === sel.id);
    return sum + (add ? Number(add.price) * sel.quantity : 0);
  }, 0);
  return Number(product.price) + additionsTotal;
}

export function calcItemTotal(item: CartItem): number {
  return calcProductUnitTotal(item.product, item.selectedAdditions) * item.quantity;
}

export function calcCartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + calcItemTotal(item), 0);
}

export function formatAdditionSummary(item: CartItem): string {
  const parts = item.selectedAdditions
    .map((sel) => {
      const add = (item.product.additions || []).find((a) => a.id === sel.id);
      if (!add) return null;
      return sel.quantity > 1 ? `${sel.quantity}× ${add.name}` : add.name;
    })
    .filter(Boolean);
  return parts.join(', ');
}
