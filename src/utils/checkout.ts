export type PaymentMethod = 'pix' | 'credit_card' | 'debit_card' | 'cash' | string;
export type FulfillmentType = 'pickup' | 'delivery';
export type PaymentChannel = 'on_site' | 'online';

export const PAYMENT_LABELS: Record<string, string> = {
  pix: 'PIX',
  credit_card: 'Cartão de crédito',
  debit_card: 'Cartão de débito',
  cash: 'Dinheiro',
};

export const FULFILLMENT_LABELS: Record<FulfillmentType, string> = {
  pickup: 'Retirar na loja',
  delivery: 'Entrega em casa',
};

const ONLINE_METHODS = ['pix', 'credit_card', 'debit_card'] as const;
const DEFAULT_PAYMENT_METHODS = ['pix', 'credit_card', 'debit_card', 'cash'];

export function parseCurrencyInput(value: string): number | null {
  const normalized = value.replace(/[^\d,.-]/g, '').replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function formatCurrencyInput(value: number): string {
  return value.toFixed(2).replace('.', ',');
}

export function isOnlinePaymentMethod(method: string): boolean {
  return (ONLINE_METHODS as readonly string[]).includes(method);
}

export function paymentMethodLabel(method: string, labels?: Record<string, string> | null): string {
  return PAYMENT_LABELS[method] || labels?.[method]?.trim() || method;
}

export type PaymentMethodsByFulfillment = {
  delivery: string[];
  pickup: string[];
};

export function resolvePaymentMethodsByFulfillment(
  tenant?: {
    payment_methods_by_fulfillment?: PaymentMethodsByFulfillment | null;
    payment_methods?: string[] | null;
  } | null
): PaymentMethodsByFulfillment {
  const fallback = tenant?.payment_methods?.length
    ? [...tenant.payment_methods]
    : [...DEFAULT_PAYMENT_METHODS];
  const byFulfillment = tenant?.payment_methods_by_fulfillment;
  if (byFulfillment && (byFulfillment.delivery?.length || byFulfillment.pickup?.length)) {
    return {
      delivery: byFulfillment.delivery?.length ? [...byFulfillment.delivery] : [...fallback],
      pickup: byFulfillment.pickup?.length ? [...byFulfillment.pickup] : [...fallback],
    };
  }
  return { delivery: [...fallback], pickup: [...fallback] };
}

export function getPaymentMethodsForFulfillment(
  tenant: {
    payment_methods_by_fulfillment?: PaymentMethodsByFulfillment | null;
    payment_methods?: string[] | null;
  } | null | undefined,
  fulfillment: FulfillmentType
): string[] {
  return resolvePaymentMethodsByFulfillment(tenant)[fulfillment];
}

export function getOnlinePaymentMethods(methods: string[], mpConfigured: boolean): string[] {
  if (!mpConfigured) return [];
  const configured = methods.filter((method) => isOnlinePaymentMethod(method));
  return configured.length > 0 ? configured : [...ONLINE_METHODS];
}

export function getActiveCheckoutPaymentMethods(
  channel: PaymentChannel,
  onSiteMethods: string[],
  onlineMethods: string[]
): string[] {
  return channel === 'online' ? onlineMethods : onSiteMethods;
}

/** Online = Checkout Pro do Mercado Pago (igual ao web). */
export function requiresOnlineCheckout(channel: PaymentChannel, mpConfigured = false): boolean {
  return channel === 'online' && mpConfigured;
}

export function isCardPaymentMethod(method: string): boolean {
  return method === 'credit_card' || method === 'debit_card';
}

export function paymentOnSiteLabel(fulfillment: FulfillmentType): string {
  return fulfillment === 'pickup' ? 'Pagamento na retirada' : 'Pagamento na entrega';
}
