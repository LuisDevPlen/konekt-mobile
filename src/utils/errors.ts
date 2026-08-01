import { ApiError } from '../types';

export class AppApiError extends Error {
  status: number;
  code: string;
  details?: ApiError['details'];

  constructor(message: string, status: number, code: string, details?: ApiError['details']) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function isSessionExpiredMessage(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('token') ||
    normalized.includes('expirad') ||
    normalized.includes('revogad') ||
    normalized.includes('refresh')
  );
}

export function getFriendlyErrorMessage(error: unknown): string {
  if (error instanceof AppApiError) {
    switch (error.code) {
      case 'VALIDATION_ERROR':
        return error.message || 'Dados inválidos. Verifique os campos.';
      case 'UNAUTHORIZED':
        if (error.message && !isSessionExpiredMessage(error.message)) {
          return error.message;
        }
        return 'Sua sessão expirou. Faça login novamente.';
      case 'FORBIDDEN':
        return error.message || 'Você não tem permissão para esta ação.';
      case 'NOT_FOUND':
        return error.message || 'Registro não encontrado.';
      case 'CONFLICT':
        return error.message || 'Os dados foram alterados. Atualize e tente novamente.';
      case 'RATE_LIMIT':
        return error.message || 'Muitas solicitações em pouco tempo. Aguarde um momento e tente novamente.';
      case 'DATABASE_UNAVAILABLE':
        return 'Serviço temporariamente indisponível. Tente novamente em instantes.';
      case 'INTERNAL_ERROR':
        return error.message && error.message !== 'Erro interno do servidor'
          ? error.message
          : 'Falha no servidor ao processar o pagamento. Verifique se o Mercado Pago da loja está conectado e tente novamente.';
      case 'NETWORK_ERROR':
        return 'Sem conexão com o servidor. Verifique sua internet ou tente novamente.';
      default:
        return error.message || 'Ocorreu um erro. Tente novamente.';
    }
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const msg = String((error as Error).message);
    if (msg.includes('Network Error') || msg.includes('timeout')) {
      return 'Sem conexão com o servidor. Verifique sua internet ou tente novamente.';
    }
  }

  return 'Erro inesperado. Tente novamente.';
}

export function isTermsAcceptanceError(error: unknown): boolean {
  if (!(error instanceof AppApiError)) return false;
  return error.code === 'FORBIDDEN' && error.message.toLowerCase().includes('termos');
}

export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
