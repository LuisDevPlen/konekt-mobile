import { calcCartTotal, calcItemTotal, calcProductUnitTotal } from '../src/utils/cart';

import { CartItem, Product } from '../src/types';



const baseProduct: Product = {

  id: 'p1',

  name: 'Produto A',

  description: 'Desc',

  price: 10,

  stock: 5,

  version: 1,

  category_id: 'c1',

  additions: [

    { id: 'a1', name: 'Extra', price: 2 },

    { id: 'a2', name: 'Outro', price: 3 },

  ],

};



describe('cart totals', () => {

  test('item without additions', () => {

    const item: CartItem = {

      product: baseProduct,

      quantity: 2,

      selectedAdditions: [],

    };

    expect(calcItemTotal(item)).toBe(20);

  });



  test('item with selected additions', () => {

    const item: CartItem = {

      product: baseProduct,

      quantity: 1,

      selectedAdditions: [{ id: 'a1', quantity: 1 }],

    };

    expect(calcItemTotal(item)).toBe(12);

  });



  test('item with addition quantity', () => {

    expect(calcProductUnitTotal(baseProduct, [{ id: 'a1', quantity: 3 }])).toBe(16);

  });



  test('cart total sums items', () => {

    const items: CartItem[] = [

      { product: baseProduct, quantity: 1, selectedAdditions: [] },

      { product: { ...baseProduct, id: 'p2', price: 5 }, quantity: 2, selectedAdditions: [] },

    ];

    expect(calcCartTotal(items)).toBe(20);

  });

});

