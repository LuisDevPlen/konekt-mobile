import { validateEmail, validateTenantSlug, validatePhone } from '../src/validators/forms';
import { formatCurrency } from '../src/utils/errors';

describe('validators', () => {
  test('validateEmail rejects invalid', () => {
    expect(validateEmail('')).toBeTruthy();
    expect(validateEmail('bad')).toBeTruthy();
    expect(validateEmail('a@b.com')).toBeNull();
  });

  test('validateTenantSlug', () => {
    expect(validateTenantSlug('')).toBeTruthy();
    expect(validateTenantSlug('ALPHA')).toBeTruthy();
    expect(validateTenantSlug('alpha')).toBeNull();
  });

  test('validatePhone', () => {
    expect(validatePhone('123')).toBeTruthy();
    expect(validatePhone('11999998888')).toBeNull();
  });
});

describe('formatCurrency', () => {
  test('formats BRL', () => {
    expect(formatCurrency(99.9)).toContain('99');
  });
});
