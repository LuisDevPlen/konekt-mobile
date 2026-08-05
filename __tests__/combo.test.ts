import { comboStartingPrice, comboUnitPrice, validateComboSelections } from '../src/utils/combo';
import type { Product } from '../src/types';

const product: Product = {
  id: 'combo', name: 'Combo', price: 30, stock: 1, version: 1, product_kind: 'COMBO', combo_price_type: 'FIXED',
  combo_groups: [{ id: 'drink', name: 'Bebida', required: true, min_selections: 1, max_selections: 1, active: true, items: [
    { id: 'water', product_id: 'water', name: 'Agua', price: 5, additional_price: 0, active: true },
    { id: 'soda', product_id: 'soda', name: 'Refrigerante', price: 8, additional_price: 3, active: true },
  ] }],
};

describe('combo pricing', () => {
  test('fixed combo adds only premium extra', () => expect(comboUnitPrice(product, [{ groupId: 'drink', itemId: 'soda' }])).toBe(33));
  test('sum items uses cheapest required item as starting price', () => expect(comboStartingPrice({ ...product, combo_price_type: 'SUM_ITEMS' })).toBe(5));
  test('requires group minimum', () => expect(validateComboSelections(product, [])).toContain('Escolha'));
});
