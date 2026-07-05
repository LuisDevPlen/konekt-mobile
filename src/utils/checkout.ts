export type PaymentMethod = 'pix' | 'credit_card' | 'debit_card' | 'cash';
export type FulfillmentType = 'pickup' | 'delivery';

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  pix: 'PIX',
  credit_card: 'Cartão de crédito',
  debit_card: 'Cartão de débito',
  cash: 'Dinheiro',
};

export const FULFILLMENT_LABELS: Record<FulfillmentType, string> = {
  pickup: 'Retirar na loja',
  delivery: 'Entrega em casa',
};

export function parseCurrencyInput(value: string): number | null {
  const normalized = value.replace(/[^\d,.-]/g, '').replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function formatCurrencyInput(value: number): string {
  return value.toFixed(2).replace('.', ',');
}

const ONLINE_METHODS: PaymentMethod[] = ['pix', 'credit_card', 'debit_card'];

export function requiresOnlineCheckout(method: string, mpConfigured = false): boolean {
  return mpConfigured && ONLINE_METHODS.includes(method as PaymentMethod);
}

export function isCardPaymentMethod(method: string): boolean {
  return method === 'credit_card' || method === 'debit_card';
}
