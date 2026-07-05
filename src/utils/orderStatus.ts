import { Ionicons } from '@expo/vector-icons';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'cancelled';

export const ORDER_FLOW_STEPS: {
  key: OrderStatus;
  label: string;
  shortLabel: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: 'pending', label: 'Recebido', shortLabel: 'Novo', icon: 'receipt-outline' },
  { key: 'confirmed', label: 'Confirmado', shortLabel: 'Conf.', icon: 'checkmark-circle-outline' },
  { key: 'preparing', label: 'Em preparo', shortLabel: 'Preparo', icon: 'restaurant-outline' },
  { key: 'ready', label: 'Pronto', shortLabel: 'Pronto', icon: 'bag-check-outline' },
  { key: 'delivered', label: 'Entregue', shortLabel: 'Entregue', icon: 'bicycle-outline' },
];

const STATUS_LABELS: Record<string, string> = {
  pending: 'Aguardando confirmação',
  confirmed: 'Confirmado',
  preparing: 'Em preparo',
  ready: 'Pronto para entrega',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};

const STATUS_HEADLINES: Record<string, string> = {
  pending: 'Pedido recebido',
  confirmed: 'Pedido confirmado',
  preparing: 'Preparando seu pedido',
  ready: 'Seu pedido está pronto',
  delivered: 'Pedido entregue!',
  cancelled: 'Pedido cancelado',
};

const PAYMENT_LABELS: Record<string, string> = {
  pending: 'Aguardando pagamento',
  paid: 'Pago',
};

export function getOrderStepIndex(status: string): number {
  const idx = ORDER_FLOW_STEPS.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
}

export function getOrderStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function getOrderStatusHeadline(status: string): string {
  return STATUS_HEADLINES[status] ?? 'Acompanhe seu pedido';
}

export function getPaymentStatusLabel(
  status: string,
  order?: { pay_on_delivery?: boolean; fulfillment_type?: string | null }
): string {
  if (status === 'paid') return 'Pago';
  if (order?.pay_on_delivery) {
    return order.fulfillment_type === 'pickup'
      ? 'Pagamento na retirada'
      : 'Pagamento na entrega';
  }
  return PAYMENT_LABELS[status] ?? status;
}

export function getPaymentMethodLabel(
  method: string | undefined | null,
  labels: Record<string, string>,
  order?: { pay_on_delivery?: boolean; fulfillment_type?: string | null }
): string {
  const methodLabel = method ? (labels[method] || method) : '';
  if (order?.pay_on_delivery) {
    const timing = order.fulfillment_type === 'pickup'
      ? 'Pagamento na retirada'
      : 'Pagamento na entrega';
    return methodLabel ? `${timing} · ${methodLabel}` : timing;
  }
  return methodLabel || '—';
}

export function isOrderActive(status: string): boolean {
  return status !== 'delivered' && status !== 'cancelled';
}
