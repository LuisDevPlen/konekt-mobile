import {
  canIncreaseAddition,
  categoryHint,
  changeAdditionQty,
  productAdditionGroups,
  sortAdditionGroupsByPriority,
  validateAdditionSelections,
} from '../src/utils/additions';
import { AdditionCategoryGroup, Product } from '../src/types';

const product: Product = {
  id: 'p1',
  name: 'Hambúrguer',
  price: 25,
  stock: 10,
  version: 1,
  additions: [
    {
      id: 'a1',
      name: 'Simples',
      price: 0,
      min_quantity: 0,
      max_quantity: 1,
      category_id: 'c1',
      category_name: 'Tamanho',
    },
    {
      id: 'a2',
      name: 'Duplo',
      price: 10,
      min_quantity: 0,
      max_quantity: 1,
      category_id: 'c1',
      category_name: 'Tamanho',
    },
  ],
  addition_categories: [{
    id: 'c1',
    name: 'Tamanho',
    min_selections: 1,
    max_selections: 1,
    required: true,
    additions: [
      { id: 'a1', name: 'Simples', price: 0, min_quantity: 0, max_quantity: 1 },
      { id: 'a2', name: 'Duplo', price: 10, min_quantity: 0, max_quantity: 1 },
    ],
  }],
};

describe('additions utils', () => {
  test('groups from addition_categories', () => {
    const groups = productAdditionGroups(product);
    expect(groups).toHaveLength(1);
    expect(groups[0].name).toBe('Tamanho');
  });

  test('category hint for required single choice', () => {
    const group = product.addition_categories![0];
    expect(categoryHint(group)).toBe('Escolha 1 opção');
  });

  test('validates required group', () => {
    const error = validateAdditionSelections(product, new Map());
    expect(error).toContain('Tamanho');
  });

  test('allows only one selection in group', () => {
    const group = product.addition_categories![0];
    let qty = new Map<string, number>();
    qty = changeAdditionQty(group.additions[0], group, qty, 1);
    expect(canIncreaseAddition(group.additions[1], group, qty)).toBe(true);
    qty = changeAdditionQty(group.additions[1], group, qty, 1);
    expect(qty.get('a1')).toBeUndefined();
    expect(qty.get('a2')).toBe(1);
  });

  test('fallback group when no categories', () => {
    const flat: Product = {
      id: 'p2',
      name: 'Item',
      price: 5,
      stock: 1,
      version: 1,
      additions: [{ id: 'x1', name: 'Extra', price: 2 }],
    };
    const groups = productAdditionGroups(flat);
    expect(groups[0].name).toBe('Outros adicionais');
  });

  test('sorts required groups before optional by priority', () => {
    const grouped: Product = {
      id: 'p3',
      name: 'Combo',
      price: 30,
      stock: 1,
      version: 1,
      addition_categories: [
        {
          id: 'opt',
          name: 'Molhos',
          min_selections: 0,
          max_selections: 99,
          required: false,
          sort_order: 0,
          additions: [{ id: 'm1', name: 'Alho', price: 2 }],
        },
        {
          id: 'req',
          name: 'Tipo de Carne',
          min_selections: 0,
          max_selections: 1,
          required: true,
          sort_order: 1,
          additions: [
            { id: 'c1', name: 'Carne', price: 0 },
            { id: 'c2', name: 'Frango', price: 0 },
          ],
        },
      ],
    };

    const sorted = sortAdditionGroupsByPriority(grouped.addition_categories!);
    expect(sorted.map((group) => group.name)).toEqual(['Tipo de Carne', 'Molhos']);
  });

  test('validates required group flagged with min zero', () => {
    const requiredProduct: Product = {
      ...product,
      addition_categories: [{
        id: 'c1',
        name: 'Tipo de Carne',
        min_selections: 0,
        max_selections: 1,
        required: true,
        additions: product.addition_categories![0].additions,
      }],
    };

    expect(validateAdditionSelections(requiredProduct, new Map())).toContain('Tipo de Carne');
  });

  test('blocks more distinct options than group max', () => {
    const group: AdditionCategoryGroup = {
      id: 'molhos',
      name: 'Molhos',
      min_selections: 0,
      max_selections: 2,
      required: false,
      additions: [
        { id: 'm1', name: 'Alho', price: 1 },
        { id: 'm2', name: 'Maionese', price: 0 },
        { id: 'm3', name: 'Mostarda', price: 1 },
      ],
    };

    let qty = new Map<string, number>();
    qty = changeAdditionQty(group.additions[0], group, qty, 1);
    qty = changeAdditionQty(group.additions[1], group, qty, 1);
    expect(canIncreaseAddition(group.additions[2], group, qty)).toBe(false);
  });

  test('blocks quantity above group max on the same item', () => {
    const group: AdditionCategoryGroup = {
      id: 'doces',
      name: 'Adicionais doce',
      min_selections: 0,
      max_selections: 2,
      required: false,
      additions: [
        { id: 'amendoim', name: 'Amendoim', price: 2, max_quantity: 99 },
        { id: 'ovo', name: 'Ovomaltine', price: 3, max_quantity: 99 },
      ],
    };

    let qty = new Map<string, number>();
    qty = changeAdditionQty(group.additions[0], group, qty, 1);
    qty = changeAdditionQty(group.additions[0], group, qty, 1);
    expect(qty.get('amendoim')).toBe(2);
    expect(canIncreaseAddition(group.additions[0], group, qty)).toBe(false);
    qty = changeAdditionQty(group.additions[0], group, qty, 1);
    expect(qty.get('amendoim')).toBe(2);
  });
});

