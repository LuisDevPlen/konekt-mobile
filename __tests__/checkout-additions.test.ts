import {
  getActiveCheckoutPaymentMethods,
  getOnlinePaymentMethods,
  getPaymentMethodsForFulfillment,
  requiresOnlineCheckout,
} from '../src/utils/checkout';
import { normalizeProductAdditions, validateAdditionSelections } from '../src/utils/additions';
import { Product } from '../src/types';

describe('checkout payment channels', () => {
  test('online checkout only when channel is online and MP configured', () => {
    expect(requiresOnlineCheckout('online', true)).toBe(true);
    expect(requiresOnlineCheckout('online', false)).toBe(false);
    expect(requiresOnlineCheckout('on_site', true)).toBe(false);
  });

  test('online methods filter from store methods', () => {
    expect(getOnlinePaymentMethods(['pix', 'cash', 'credit_card'], true)).toEqual([
      'pix',
      'credit_card',
    ]);
    expect(getOnlinePaymentMethods(['cash'], true)).toEqual([
      'pix',
      'credit_card',
      'debit_card',
    ]);
    expect(getOnlinePaymentMethods(['pix'], false)).toEqual([]);
  });

  test('active methods follow channel', () => {
    expect(getActiveCheckoutPaymentMethods('on_site', ['pix', 'cash'], ['pix'])).toEqual([
      'pix',
      'cash',
    ]);
    expect(getActiveCheckoutPaymentMethods('online', ['pix', 'cash'], ['pix'])).toEqual(['pix']);
  });

  test('methods by fulfillment', () => {
    const tenant = {
      payment_methods_by_fulfillment: {
        delivery: ['pix', 'cash'],
        pickup: ['credit_card'],
      },
    };
    expect(getPaymentMethodsForFulfillment(tenant, 'delivery')).toEqual(['pix', 'cash']);
    expect(getPaymentMethodsForFulfillment(tenant, 'pickup')).toEqual(['credit_card']);
  });
});

describe('uncategorized addition rules', () => {
  test('applies product uncategorized min/max/required', () => {
    const product = normalizeProductAdditions({
      id: 'p1',
      name: 'Item',
      price: 10,
      stock: 5,
      version: 1,
      uncategorized_additions_min_selections: 1,
      uncategorized_additions_max_selections: 2,
      uncategorized_additions_required: true,
      additions: [
        { id: 'a1', name: 'Bacon', price: 2 },
        { id: 'a2', name: 'Queijo', price: 1 },
      ],
      addition_categories: [],
    } as Product);

    const group = product.addition_categories![0];
    expect(group.id).toBeNull();
    expect(group.min_selections).toBe(1);
    expect(group.max_selections).toBe(2);
    expect(group.required).toBe(true);
    expect(validateAdditionSelections(product, new Map())).toContain('Outros adicionais');
  });
});
