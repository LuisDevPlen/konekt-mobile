import { Ionicons } from '@expo/vector-icons';

/** Espelha konekt-front/src/app/core/utils/order-status.util.ts */
export type OrderStatus =
  | 'pending'
  | 'scheduled'
  | 'awaiting_prep'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'cancelled';

type FlowStep = {
  key: OrderStatus;
  label: string;
  shortLabel: string;
  icon: keyof typeof Ionicons.glyphMap;
};

export const ORDER_FLOW_STEPS: FlowStep[] = [
  { key: 'pending', label: 'Recebido', shortLabel: 'Novo', icon: 'receipt-outline' },
  { key: 'confirmed', label: 'Confirmado', shortLabel: 'Conf.', icon: 'checkmark-circle-outline' },
  { key: 'preparing', label: 'Em preparo', shortLabel: 'Preparo', icon: 'restaurant-outline' },
  { key: 'ready', label: 'Pronto', shortLabel: 'Pronto', icon: 'bag-check-outline' },
  { key: 'delivered', label: 'Entregue', shortLabel: 'Entregue', icon: 'bicycle-outline' },
];

/** Pedido agendado percorre outra régua (igual ao painel web). */
export const SCHEDULED_ORDER_FLOW_STEPS: FlowStep[] = [
  { key: 'scheduled', label: 'Agendado', shortLabel: 'Agendado', icon: 'calendar-outline' },
  { key: 'awaiting_prep', label: 'Aguardando preparo', shortLabel: 'Preparo', icon: 'hourglass-outline' },
  { key: 'preparing', label: 'Em preparação', shortLabel: 'Preparando', icon: 'restaurant-outline' },
  { key: 'ready', label: 'Pronto', shortLabel: 'Pronto', icon: 'bag-check-outline' },
  { key: 'delivered', label: 'Entregue', shortLabel: 'Entregue', icon: 'bicycle-outline' },
];

const STATUS_LABELS: Record<string, string> = {
  pending: 'Aguardando confirmação',
  scheduled: 'Agendado',
  awaiting_prep: 'Aguardando preparo',
  confirmed: 'Confirmado',
  preparing: 'Em preparo',
  ready: 'Pronto para entrega',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};

const STATUS_HEADLINES: Record<string, string> = {
  pending: 'Pedido recebido',
  scheduled: 'Pedido agendado',
  awaiting_prep: 'Preparo liberado',
  confirmed: 'Pedido confirmado',
  preparing: 'Preparando seu pedido',
  ready: 'Seu pedido está pronto',
  delivered: 'Pedido entregue!',
  cancelled: 'Pedido cancelado',
};

type OrderFlowRef = { order_type?: string | null; scheduled_for?: string | null } | null | undefined;

export function isScheduledOrderFlow(order?: OrderFlowRef): boolean {
  if (!order) return false;
  return order.order_type === 'scheduled' || Boolean(order.scheduled_for);
}

export function getOrderFlowSteps(order?: OrderFlowRef): FlowStep[] {
  return isScheduledOrderFlow(order) ? SCHEDULED_ORDER_FLOW_STEPS : ORDER_FLOW_STEPS;
}

const PAYMENT_LABELS: Record<string, string> = {
  pending: 'Aguardando pagamento',
  paid: 'Pago',
  failed: 'Pagamento recusado',
};

export function getOrderStepIndex(status: string, order?: OrderFlowRef): number {
  const steps = getOrderFlowSteps(order);
  const idx = steps.findIndex((s) => s.key === status);
  if (idx >= 0) return idx;

  const fallback: Record<string, number> = {
    scheduled: 0,
    awaiting_prep: 1,
    pending: 0,
    confirmed: 1,
    preparing: 2,
    ready: 3,
    delivered: 4,
    cancelled: 0,
  };
  return fallback[status] ?? 0;
}

export function getOrderStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function getOrderStatusHeadline(status: string, order?: OrderFlowRef): string {
  if (status === 'scheduled' && order?.scheduled_for) {
    return 'Pedido agendado com sucesso';
  }
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
  if (methodLabel) return `Mercado Pago · ${methodLabel}`;
  return methodLabel || '—';
}

export function isOrderActive(status: string): boolean {
  return status !== 'delivered' && status !== 'cancelled';
}
