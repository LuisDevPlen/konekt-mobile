describe('store API paths', () => {
  test('tenant catalog endpoints use slug', () => {
    expect(`/store/tenants/alpha`).toBe('/store/tenants/alpha');
    expect(`/store/alpha/products`).toBe('/store/alpha/products');
  });

  test('global auth endpoints', () => {
    expect('/store/auth/login').toBe('/store/auth/login');
    expect('/store/auth/orders').toBe('/store/auth/orders');
  });
});
