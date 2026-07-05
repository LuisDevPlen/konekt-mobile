import { AppApiError, getFriendlyErrorMessage } from '../src/utils/errors';

describe('getFriendlyErrorMessage', () => {
  test('409 conflict', () => {
    const err = new AppApiError('Preço alterado', 409, 'CONFLICT');
    expect(getFriendlyErrorMessage(err)).toContain('Preço alterado');
  });

  test('401 unauthorized session expired', () => {
    const err = new AppApiError('Token expirado', 401, 'UNAUTHORIZED');
    expect(getFriendlyErrorMessage(err)).toContain('sessão expirou');
  });

  test('401 unauthorized invalid credentials', () => {
    const err = new AppApiError('Credenciais inválidas', 401, 'UNAUTHORIZED');
    expect(getFriendlyErrorMessage(err)).toBe('Credenciais inválidas');
  });

  test('403 forbidden', () => {
    const err = new AppApiError('Negado', 403, 'FORBIDDEN');
    expect(getFriendlyErrorMessage(err)).toBe('Negado');
  });

  test('403 terms acceptance', () => {
    const err = new AppApiError(
      'Aceite os Termos de Uso e Política de Privacidade para continuar',
      403,
      'FORBIDDEN'
    );
    expect(getFriendlyErrorMessage(err)).toContain('Termos');
  });

  test('404 not found', () => {
    const err = new AppApiError('Empresa não encontrada', 404, 'NOT_FOUND');
    expect(getFriendlyErrorMessage(err)).toContain('Empresa não encontrada');
  });

  test('network error', () => {
    expect(getFriendlyErrorMessage(new Error('Network Error'))).toContain('conexão');
  });
});
